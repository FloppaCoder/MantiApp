import { MobileApiError, mobileFailure, mobileJson, mobileOrder, orderSelection, technicianContext } from '@/lib/mobile-api';
import { validateOrderUpdate } from '@/lib/mobile-orders';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { db, user } = await technicianContext(request);
    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); }
    catch { throw new MobileApiError('JSON no válido.', 400); }
    const { data: order, error: readError } = await db.from('work_orders')
      .select('estado, checklist').eq('id', id).eq('tecnico_id', user.id).maybeSingle();
    if (readError) throw readError;
    if (!order) throw new MobileApiError('Orden no encontrada.', 404);
    const update = validateOrderUpdate(body, order);
    const { data, error } = await db.from('work_orders').update(update)
      .eq('id', id).eq('tecnico_id', user.id).eq('estado', order.estado)
      .select(orderSelection).maybeSingle();
    if (error) throw error;
    if (!data) throw new MobileApiError('La orden cambió. Recarga el listado.', 409);
    return mobileJson(mobileOrder(data));
  } catch (failure) { return mobileFailure(failure); }
}
