import { createClient } from '@supabase/supabase-js';

// Server-side only — uses SERVICE_ROLE_KEY (never sent to browser)
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY   // secret — not NEXT_PUBLIC_
  );
}

export async function POST(request, { params }) {
  const { id } = params;

  if (!id) {
    return Response.json({ error: 'Order ID required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Fetch order — verify it exists and is in a cancellable state
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, is_deleted, kitchen_id')
    .eq('id', id)
    .single();

  if (error || !order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.is_deleted) {
    return Response.json({ error: 'Order is already cancelled' }, { status: 400 });
  }
  if (order.status !== 'new') {
    return Response.json(
      { error: 'Cannot cancel — order is already being prepared or delivered' },
      { status: 400 }
    );
  }

  // Soft delete — never hard-delete; admin can undo
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      is_deleted: true,
      deleted_by: 'customer',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return Response.json({ error: 'Failed to cancel order' }, { status: 500 });
  }

  return Response.json({ success: true });
}
