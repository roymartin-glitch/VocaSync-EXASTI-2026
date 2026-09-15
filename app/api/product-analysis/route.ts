import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateMargin, determineActionCategory, isStockLow } from '@/lib/calculations/financial';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';


export async function GET(req: NextRequest) {
  try {
    const { user, profile } = await getActiveUserProfile();
    const supabase = createAdminClient();
    const userId = profile?.id;

    let productsQuery = supabase.from('products').select('id, name, default_unit, image_url').order('name');
    if (userId) {
      productsQuery = productsQuery.eq('user_id', userId);
    }

    let itemsQuery = supabase.from('transaction_items').select(`
      product_id,
      quantity,
      unit_price,
      transactions!inner (
        type,
        transaction_date,
        user_id
      )
    `);
    if (userId) {
      itemsQuery = itemsQuery.eq('transactions.user_id', userId);
    }

    let batchesQuery = supabase.from('stock_batches').select('*');
    if (userId) {
      batchesQuery = batchesQuery.eq('user_id', userId);
    }

    // Parallelize all database queries concurrently for maximum speed
    let [productsRes, itemsRes, batchesRes] = await Promise.all([
      productsQuery,
      itemsQuery,
      batchesQuery,
    ]);

    // Graceful fallback if image_url column doesn't exist yet in DB
    if (productsRes.error && productsRes.error.message?.includes('image_url')) {
      let fallbackQuery = supabase.from('products').select('id, name, default_unit').order('name');
      if (userId) fallbackQuery = fallbackQuery.eq('user_id', userId);
      productsRes = (await fallbackQuery) as any;
    }

    const threshold = Number(profile?.margin_alert_threshold) || 20;
    const products = productsRes.data || [];
    const items = itemsRes.data || [];
    const stockBatches = batchesRes.data || [];

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        threshold,
        data: [],
      });
    }

    // DEDUPLIKASI OTOMATIS: Gabungkan produk yang memiliki nama sama (case-insensitive)
    const uniqueProducts: any[] = [];
    const nameToPrimaryId = new Map<string, string>();
    const duplicateIdsToMigrate: { fromId: string; toId: string }[] = [];

    (products || []).forEach((p: any) => {
      const cleanName = (p.name || '').trim().toLowerCase();
      if (!nameToPrimaryId.has(cleanName)) {
        nameToPrimaryId.set(cleanName, p.id);
        uniqueProducts.push(p);
      } else {
        const primaryId = nameToPrimaryId.get(cleanName)!;
        duplicateIdsToMigrate.push({ fromId: p.id, toId: primaryId });
      }
    });

    // Jalankan konsolidasi di background jika ditemukan data duplikat di database
    if (duplicateIdsToMigrate.length > 0) {
      (async () => {
        try {
          for (const item of duplicateIdsToMigrate) {
            await supabase.from('transaction_items').update({ product_id: item.toId }).eq('product_id', item.fromId);
            await supabase.from('stock_batches').update({ product_id: item.toId }).eq('product_id', item.fromId);
            await supabase.from('products').delete().eq('id', item.fromId);
          }
        } catch (mErr) {
          console.warn('Auto product consolidation error:', mErr);
        }
      })();
    }

    const idResolver = (id: string) => {
      const dup = duplicateIdsToMigrate.find((d) => d.fromId === id);
      return dup ? dup.toId : id;
    };

    // Compute cost price, selling price, and stock per product
    const productStats: Record<string, any> = {};

    (uniqueProducts || []).forEach((p: any) => {
      productStats[p.id] = {
        id: p.id,
        name: p.name,
        unit: p.default_unit || 'kg',
        image_url: p.image_url || null,
        latestCost: 0,
        latestCostDate: '',
        latestSelling: 0,
        latestSellingDate: '',
        totalVolume: 0,
        totalRevenue: 0,
        totalBought: 0,
      };
    });

    (items || []).forEach((it: any) => {
      const pId = idResolver(it.product_id);
      if (!productStats[pId]) return;

      const tx = it.transactions;
      const txDate = tx?.transaction_date || '';
      const price = Number(it.unit_price);
      const qty = Number(it.quantity);

      if (tx?.type === 'expense') {
        if (!productStats[pId].latestCostDate || txDate > productStats[pId].latestCostDate) {
          productStats[pId].latestCost = price;
          productStats[pId].latestCostDate = txDate;
        }
        productStats[pId].totalBought += qty;
      } else if (tx?.type === 'income') {
        if (!productStats[pId].latestSellingDate || txDate > productStats[pId].latestSellingDate) {
          productStats[pId].latestSelling = price;
          productStats[pId].latestSellingDate = txDate;
        }
        productStats[pId].totalVolume += qty;
        productStats[pId].totalRevenue += price * qty;
      }
    });

    // Format analysis items with stock remaining and low stock alert
    const results: any[] = Object.values(productStats).map((stat: any) => {
      // FIFO stock calculation with idResolver
      const productBatches = stockBatches.filter((b) => idResolver(b.product_id) === stat.id);
      const activeBatchesWithCost = productBatches.filter((b) => b.status === 'active' && Number(b.cost_price) > 0);
      const batchCost = activeBatchesWithCost.length > 0 ? Number(activeBatchesWithCost[activeBatchesWithCost.length - 1].cost_price) : 0;

      const cost = batchCost || stat.latestCost || 0;
      const selling = stat.latestSelling || 0;
      const margin = calculateMargin(cost, selling);
      const category = determineActionCategory(margin, threshold);
      let remainingStock = 0;
      let initialBatchQty = 0;

      if (productBatches.length > 0) {
        remainingStock = productBatches
          .filter((b) => b.status === 'active')
          .reduce((sum, b) => sum + Number(b.remaining_quantity || 0), 0);
        initialBatchQty = productBatches.reduce((sum, b) => sum + Number(b.initial_quantity || 0), 0);
      } else {
        // Fallback: tidak ada batch stok, mulai dari 0 — jangan hardcode angka
        remainingStock = 0;
        initialBatchQty = 0;
      }

      const isLow = isStockLow(remainingStock, initialBatchQty, 20);

      return {
        id: stat.id,
        name: stat.name,
        unit: stat.unit,
        image_url: stat.image_url || null,
        cost_price: Math.round(cost),
        selling_price: Math.round(selling),
        margin_percentage: margin,
        action_category: category,
        avg_daily_volume: stat.totalVolume > 0 ? Math.max(Math.round((stat.totalVolume / Math.max(stat.dateDiffDays || 7, 1)) * 10) / 10, 0) : 0,
        total_revenue_7d: Math.round(stat.totalRevenue || 0),
        remaining_stock: Math.round(remainingStock * 10) / 10,
        is_stock_low: isLow,
      };
    });

    return NextResponse.json({ success: true, threshold, data: results });
  } catch (err: any) {
    console.error('GET /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Tambah Produk Baru dengan input Stok Awal
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { name, unit = 'kg', costPrice, sellingPrice, stock = 10, imageUrl } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus diisi.' },
        { status: 400 }
      );
    }

    const { profile } = await getActiveUserProfile();
    const userId = profile?.id || 'demo-user-pak-budi';

    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    const stockNum = Math.max(0, parseFloat(stock) || 10);

    let newProd: any = null;

    // 1. Cek apakah produk dengan nama yang sama sudah ada di akun user ini
    let isExisting = false;
    try {
      const { data: existingData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', name.trim())
        .limit(1);

      if (existingData && existingData.length > 0) {
        newProd = existingData[0];
        isExisting = true;
        const updatePayload: Record<string, any> = {};
        if (imageUrl && !newProd.image_url) updatePayload.image_url = imageUrl;
        if (unit && unit !== newProd.default_unit) updatePayload.default_unit = unit;
        if (Object.keys(updatePayload).length > 0) {
          await supabase.from('products').update(updatePayload).eq('id', newProd.id);
        }
      }
    } catch (checkErr) {
      console.warn('Product check fallback:', checkErr);
    }

    // 2. Jika belum ada, baru insert produk baru ke Supabase
    if (!newProd) {
      try {
        const insertPayload: Record<string, any> = {
          user_id: userId,
          name: name.trim(),
          default_unit: unit,
        };
        if (imageUrl) {
          insertPayload.image_url = imageUrl;
        }

        const { data, error: prodErr } = await supabase
          .from('products')
          .insert(insertPayload)
          .select()
          .single();

        if (!prodErr && data) {
          newProd = data;
        } else if (imageUrl) {
          const { data: retryData, error: retryErr } = await supabase
            .from('products')
            .insert({
              user_id: userId,
              name: name.trim(),
              default_unit: unit,
            })
            .select()
            .single();
          if (!retryErr && retryData) {
            newProd = { ...retryData, image_url: imageUrl };
          }
        }
      } catch (dbErr: any) {
        console.warn('Supabase product insert fallback to in-memory store:', dbErr.message);
      }
    }

    // 3. Masukkan riwayat modal belanja dan batch stok untuk produk ini
    let expenseTxRecord: any = null;
    if (newProd && newProd.id) {
      if (cost > 0 && stockNum > 0) {
        try {
          const actionText = isExisting ? 'Belanja Tambah Stok' : 'Stok Awal Barang';
          const rawVoice = `${actionText}: ${newProd.name} (+${stockNum} ${unit})`;
          const { data: expTx } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              type: 'expense',
              transaction_date: new Date().toISOString(),
              source: 'manual',
              raw_voice_text: rawVoice,
            })
            .select()
            .single();

          if (expTx) {
            await supabase.from('transaction_items').insert({
              transaction_id: expTx.id,
              product_id: newProd.id,
              quantity: stockNum,
              unit,
              unit_price: cost,
            });

            await supabase.from('stock_batches').insert({
              user_id: userId,
              product_id: newProd.id,
              transaction_id: expTx.id,
              initial_quantity: stockNum,
              remaining_quantity: stockNum,
              cost_price: cost,
              unit,
              status: 'active',
            });

            expenseTxRecord = {
              id: expTx.id,
              user_id: userId,
              type: 'expense',
              transaction_date: expTx.transaction_date || new Date().toISOString(),
              source: 'manual',
              raw_voice_text: rawVoice,
              total_amount: Math.round(cost * stockNum),
              items: [
                {
                  id: 'txi-' + Date.now(),
                  transaction_id: expTx.id,
                  product_id: newProd.id,
                  product_name: newProd.name,
                  quantity: stockNum,
                  unit,
                  unit_price: cost,
                  subtotal: Math.round(cost * stockNum),
                },
              ],
            };
          }
        } catch (bErr) {
          console.warn('Initial stock batch insert fallback:', bErr);
        }
      }
    }

    // 4. Fallback jika akun lokal/resilient (tidak ada foreign key di profiles)
    if (!newProd) {
      newProd = {
        id: 'prod-' + Date.now(),
        name: name.trim(),
        default_unit: unit,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
    }

    // 5. Hitung total akumulasi stok aktif untuk produk ini
    let totalAccumulatedStock = stockNum;
    if (newProd && newProd.id) {
      try {
        const { data: activeBatches } = await supabase
          .from('stock_batches')
          .select('remaining_quantity')
          .eq('product_id', newProd.id)
          .eq('status', 'active');
        if (activeBatches && activeBatches.length > 0) {
          totalAccumulatedStock = activeBatches.reduce((acc, b) => acc + Number(b.remaining_quantity || 0), 0);
        }
      } catch (_) {}
    }

    const margin = calculateMargin(cost, selling);
    const category = determineActionCategory(margin, 20);

    const completeItem = {
      id: newProd.id,
      name: newProd.name,
      unit: newProd.default_unit || unit,
      image_url: newProd.image_url || imageUrl || null,
      cost_price: Math.round(cost),
      selling_price: Math.round(selling),
      margin_percentage: margin,
      action_category: category,
      avg_daily_volume: 0,
      total_revenue_7d: 0,
      remaining_stock: totalAccumulatedStock,
      is_stock_low: totalAccumulatedStock <= 2,
      user_id: userId,
    };

    return NextResponse.json({
      success: true,
      message: isExisting
        ? `Stok ${newProd.name} berhasil ditambah (+${stockNum} ${unit}). Total stok saat ini: ${totalAccumulatedStock} ${unit}.`
        : 'Produk baru berhasil ditambahkan.',
      data: completeItem,
      isExistingProduct: isExisting,
      expenseTransaction: expenseTxRecord,
    });
  } catch (err: any) {
    console.error('POST /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Update product details (name, unit, selling price, stock)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, name, unit, sellingPrice, stock, imageUrl } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Perbarui di Supabase database — tidak ada lagi in-memory mock fallback
    const updates: Record<string, any> = {};
    if (name !== undefined && name.trim()) updates.name = name.trim();
    if (unit !== undefined && unit.trim()) updates.default_unit = unit.trim();
    if (imageUrl !== undefined) updates.image_url = imageUrl;

    let updatedProd: any = null;

    try {
      const { data, error: updateErr } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (data && !updateErr) {
        updatedProd = data;
      } else if (updateErr && imageUrl !== undefined && updateErr.message?.includes('image_url')) {
        // Retry without image_url if schema migration 10 hasn't been run in Supabase yet
        delete updates.image_url;
        const retry = await supabase.from('products').update(updates).eq('id', id).select().maybeSingle();
        if (retry.data) updatedProd = { ...retry.data, image_url: imageUrl };
      }
    } catch (_) {}

    // Perbarui stok batch di database jika stock dikirim
    if (stock !== undefined) {
      try {
        await supabase
          .from('stock_batches')
          .update({ remaining_quantity: Number(stock) })
          .eq('product_id', id);
      } catch (_) {}
    }

    // NOTE: Harga jual (sellingPrice) hanya disimpan di produk melalui stock_batches atau dicatat dari transaksi nyata.
    // Jangan pernah membuat transaksi income dummy saat user mengedit harga — ini menyebabkan laporan salah.


    return NextResponse.json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: updatedProd,
    });
  } catch (err: any) {
    console.error('PATCH /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Hapus produk secara permanen beserta seluruh riwayat transaksi terkait
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Ambil info produk dari database
    let productName = '';
    try {
      const { data: prodData } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .maybeSingle();
      if (prodData?.name) {
        productName = prodData.name;
      }
    } catch (_) {}

    // 3. Hapus seluruh riwayat transaksi yang terkait dengan produk ini
    try {
      // Dapatkan seluruh ID transaksi induk yang memuat produk ini
      const { data: itemRows } = await supabase
        .from('transaction_items')
        .select('transaction_id')
        .eq('product_id', productId);

      const txIdsToDelete = new Set<string>();
      if (itemRows) {
        itemRows.forEach((r: any) => {
          if (r.transaction_id) txIdsToDelete.add(r.transaction_id);
        });
      }

      // Cari juga transaksi yang raw_voice_text memuat nama produk ini
      if (productName) {
        const { data: textMatchedTxs } = await supabase
          .from('transactions')
          .select('id')
          .ilike('raw_voice_text', `%${productName}%`);
        if (textMatchedTxs) {
          textMatchedTxs.forEach((t: any) => txIdsToDelete.add(t.id));
        }
      }

      const txIdList = Array.from(txIdsToDelete);
      if (txIdList.length > 0) {
        await supabase.from('transaction_items').delete().in('transaction_id', txIdList);
        await supabase.from('stock_batches').delete().in('transaction_id', txIdList);
        await supabase.from('transactions').delete().in('id', txIdList);
      }

      // Hapus child records langsung dari product_id
      await supabase.from('stock_batches').delete().eq('product_id', productId);
      await supabase.from('transaction_items').delete().eq('product_id', productId);
      await supabase.from('ai_insights').delete().eq('product_id', productId);
      await supabase.from('experiments').delete().eq('product_id', productId);
      await supabase.from('products').delete().eq('id', productId);

      // Bersihkan transaksi ghost/orphan milik user ini yang tidak memiliki item lagi
      // PENTING: Wajib filter user_id agar tidak menghapus transaksi milik user lain!
      const { profile: delProfile } = await getActiveUserProfile();
      const delUserId = delProfile?.id;
      if (delUserId) {
        let orphanQuery = supabase
          .from('transactions')
          .select('id, transaction_items(id)')
          .eq('user_id', delUserId);

        const { data: remainingTxs } = await orphanQuery;
        if (remainingTxs) {
          const orphanIds = remainingTxs
            .filter((t: any) => !t.transaction_items || t.transaction_items.length === 0)
            .map((t: any) => t.id);
          if (orphanIds.length > 0) {
            await supabase.from('transactions').delete().in('id', orphanIds).eq('user_id', delUserId);
          }
        }
      }
    } catch (cleanupErr) {
      console.warn('Child records and transactions deletion fallback:', cleanupErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Produk beserta seluruh riwayat transaksi terkait berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('DELETE /api/product-analysis error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

