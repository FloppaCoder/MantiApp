import { mobileFailure, mobileJson, technicianContext } from '@/lib/mobile-api';

export async function GET(request: Request) {
  try {
    const { db, user, account } = await technicianContext(request);
    const { data: profile, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return mobileJson({
      nombre: profile?.nombre || [account.nombre, account.apellido].filter(Boolean).join(' ') || 'Técnico',
      email: profile?.email || account.email || user.email || '',
      especialidad: profile?.especialidad || 'Técnico de mantenimiento',
      telefono: profile?.telefono || 'Sin registrar',
    });
  } catch (failure) { return mobileFailure(failure); }
}
