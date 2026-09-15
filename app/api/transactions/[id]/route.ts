import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await req.json();
    const { productName, quantity, totalAmount } = body;

    const qty = parseFloat(quantity) || 1;
    const total = parseFloat(totalAmount) || 0;
    const unitPrice = total / qty;

    // 1. Update transaction item
    const { data: items } = await supabase
      .from('transaction_items')
      .select('id, product_id')
      .eq('transaction_id', id)
      .limit(1);

    if (items && items.length > 0) {
      await supabase
        .from('transaction_items')
        .update({
          quantity: qty,
          unit_price: Math.round(unitPrice),
        })
        .eq('id', items[0].id);

      // If product name updated
      if (productName && items[0].product_id) {
        await supabase
          .from('products')
          .update({ name: productName.trim() })
          .eq('id', items[0].product_id);
      }
    }

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dikoreksi.' });
  } catch (err: any) {
    console.error('PATCH /api/transactions/[id] error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (err: any) {
    console.error('DELETE /api/transactions/[id] error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
