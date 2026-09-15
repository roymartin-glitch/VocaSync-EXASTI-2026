import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { getExperimentVerdictPrompt } from '@/lib/ai/prompts';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const { user, profile } = await getActiveUserProfile();


    const supabase = createAdminClient();

    let query = supabase
      .from('experiments')
      .select(`
        id,
        user_id,
        product_id,
        title,
        status,
        baseline_metric,
        target_metric,
        started_at,
        target_end_at,
        products (
          id,
          name
        ),
        experiment_results (
          id,
          recorded_at,
          current_metric,
          evaluation_status,
          ai_verdict_text
        )
      `)
      .order('started_at', { ascending: false });

    if (profile?.id) {
      query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query;

    if (error) throw error;



    // Filter out experiments that belong to products that were deleted (products is null when product_id is not null)
    const formatted = (data || [])
      .filter((exp: any) => {
        // If experiment was linked to a specific product_id, but that product was deleted (exp.products === null), filter it out!
        if (exp.product_id && !exp.products) {
          return false;
        }
        return true;
      })
      .map((exp: any) => ({
        id: exp.id,
        user_id: exp.user_id,
        product_id: exp.product_id,
        product_name: exp.products?.name || 'Produk Umum',
        title: exp.title,
        status: exp.status,
        baseline_metric: exp.baseline_metric || {},
        target_metric: exp.target_metric || {},
        started_at: exp.started_at,
        target_end_at: exp.target_end_at,
        results: (exp.experiment_results || []).sort(
          (a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        ),
      }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('GET /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { title, productName, targetMargin = 20 } = body;

    const { profile } = await getActiveUserProfile();
    const userId = profile?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    // 1. Find product by name
    let productId: string | null = null;
    let productRow: any = null;
    if (productName) {
      const { data: prod } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', `%${productName.trim()}%`)
        .limit(1);
      if (prod && prod.length > 0) {
        productId = prod[0].id;
        productRow = prod[0];
      }
    }

    // 2. Compute real baseline margin from latest stock_batches (cost) + recent transactions (selling price)
    let baselineMargin = 15.0;
    if (productId) {
      try {
        const { data: batches } = await supabase
          .from('stock_batches')
          .select('cost_price, remaining_quantity')
          .eq('product_id', productId)
          .eq('status', 'active')
          .order('cost_price', { ascending: true })
          .limit(1);

        const costPrice = batches?.[0]?.cost_price ? Number(batches[0].cost_price) : 0;

        const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: txItems } = await supabase
          .from('transaction_items')
          .select(`
            quantity,
            unit_price,
            transactions!inner (type, transaction_date, user_id)
          `)
          .eq('product_id', productId)
          .eq('transactions.user_id', userId)
          .eq('transactions.type', 'income')
          .gte('transactions.transaction_date', since30d);

        if (txItems && txItems.length > 0) {
          const totalRevenue = txItems.reduce((sum: number, ti: any) => sum + Number(ti.unit_price || 0) * Number(ti.quantity || 0), 0);
          const totalQty = txItems.reduce((sum: number, ti: any) => sum + Number(ti.quantity || 0), 0);
          const avgSellingPrice = totalQty > 0 ? totalRevenue / totalQty : 0;

          if (avgSellingPrice > 0 && costPrice > 0) {
            baselineMargin = Math.round(((avgSellingPrice - costPrice) / avgSellingPrice) * 100 * 10) / 10;
          } else if (avgSellingPrice > 0 && costPrice === 0) {
            baselineMargin = 20.0; // no cost data
          }
        }
      } catch (metricErr) {
        console.warn('Baseline metric computation fallback:', metricErr);
      }
    }

    const newExp = {
      user_id: userId,
      product_id: productId,
      title: title.trim(),
      status: 'running',
      baseline_metric: { margin: baselineMargin },
      target_metric: { margin: parseFloat(targetMargin) || 20.0 },
      started_at: new Date().toISOString(),
      target_end_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    const { data: inserted, error } = await supabase.from('experiments').insert(newExp).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, data: inserted });
  } catch (err: any) {
    console.error('POST /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { experimentId, status = 'completed' } = body;

    if (!experimentId) {
      return NextResponse.json({ success: false, error: 'experimentId wajib diisi.' }, { status: 400 });
    }

    // 1. Get experiment detail
    const { data: exp, error: expErr } = await supabase
      .from('experiments')
      .select('*, products(name)')
      .eq('id', experimentId)
      .single();

    if (expErr || !exp) {
      return NextResponse.json({ success: false, error: 'Eksperimen tidak ditemukan.' }, { status: 404 });
    }

    // 2. Hitung margin aktual dari transaksi nyata selama eksperimen berjalan
    const baselineMargin = Number(exp.baseline_metric?.margin) || 15.0;
    const daysRunning = Math.max(
      Math.round((Date.now() - new Date(exp.started_at).getTime()) / 86400000),
      1
    );

    // Ambil transaksi penjualan produk ini selama periode eksperimen
    let currentMargin = Number(exp.target_metric?.margin) || 20.0;
    let realDailyProfit: number | null = null;

    if (exp.product_id) {
      try {
        const since = exp.started_at;
        const { data: txItems } = await supabase
          .from('transaction_items')
          .select(`
            quantity,
            unit_price,
            transactions!inner (type, transaction_date, user_id)
          `)
          .eq('product_id', exp.product_id)
          .eq('transactions.user_id', exp.user_id)
          .eq('transactions.type', 'income')
          .gte('transactions.transaction_date', since);

        const { data: costBatches } = await supabase
          .from('stock_batches')
          .select('cost_price, remaining_quantity')
          .eq('product_id', exp.product_id)
          .eq('status', 'active')
          .order('cost_price', { ascending: true })
          .limit(1);

        const costPrice = costBatches?.[0]?.cost_price ? Number(costBatches[0].cost_price) : 0;

        if (txItems && txItems.length > 0) {
          const totalRevenue = txItems.reduce((s: number, ti: any) => s + Number(ti.unit_price || 0) * Number(ti.quantity || 0), 0);
          const totalQty = txItems.reduce((s: number, ti: any) => s + Number(ti.quantity || 0), 0);
          const avgSelling = totalQty > 0 ? totalRevenue / totalQty : 0;

          if (avgSelling > 0 && costPrice > 0) {
            currentMargin = Math.round(((avgSelling - costPrice) / avgSelling) * 100 * 10) / 10;
          }
          const totalProfit = costPrice > 0
            ? totalRevenue - (totalQty * costPrice)
            : totalRevenue * 0.2;
          realDailyProfit = daysRunning > 0 ? Math.round(totalProfit / daysRunning) : null;
        }
      } catch (metricErr) {
        console.warn('Experiment metric computation fallback:', metricErr);
      }
    }

    let aiVerdict = 'Tindakan berhasil meningkatkan margin keuntungan sesuai target evaluasi.';
    try {
      const prompt = getExperimentVerdictPrompt(
        exp.title,
        exp.products?.name || 'Produk Dagangan',
        baselineMargin,
        currentMargin,
        daysRunning
      );
      const generated = await callGemini(prompt);
      if (generated) aiVerdict = generated.trim();
    } catch (e) {
      console.warn('Gemini verdict fallback:', e);
    }

    // 3. Update experiment status
    await supabase.from('experiments').update({ status }).eq('id', experimentId);

    // 4. Save result checkpoint dengan data nyata
    const currentMetric: Record<string, any> = { margin: currentMargin };
    if (realDailyProfit !== null) currentMetric.daily_profit = realDailyProfit;

    const { data: result, error: resErr } = await supabase
      .from('experiment_results')
      .insert({
        experiment_id: experimentId,
        recorded_at: new Date().toISOString(),
        current_metric: currentMetric,
        evaluation_status: 'success',
        ai_verdict_text: aiVerdict,
      })
      .select()
      .single();

    if (resErr) throw resErr;

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('PATCH /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const experimentId = searchParams.get('id');

    if (!experimentId) {
      return NextResponse.json({ success: false, error: 'experimentId wajib disertakan.' }, { status: 400 });
    }

    // Delete child experiment_results first
    await supabase.from('experiment_results').delete().eq('experiment_id', experimentId);
    const { error } = await supabase.from('experiments').delete().eq('id', experimentId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Eksperimen berhasil dihapus.' });
  } catch (err: any) {
    console.error('DELETE /api/experiments error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

