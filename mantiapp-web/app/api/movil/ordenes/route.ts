import { mobileFailure, mobileJson, mobileOrder, orderSelection, technicianContext } from '@/lib/mobile-api';

export async function GET(request: Request) {
  try {
    const { db, user } = await technicianContext(request);
    const { data, error } = await db.from('work_orders').select(orderSelection)
      .eq('tecnico_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return mobileJson((data ?? []).map(mobileOrder));
  } catch (failure) { return mobileFailure(failure); }
}
