import { mobileFailure, mobileJson, technicianContext } from '@/lib/mobile-api';
import { nombreCompleto } from '@/lib/domain';

export async function GET(request: Request) {
  try {
    const { db, user, account } = await technicianContext(request);
    const { data: profile, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return mobileJson({
      nombre: nombreCompleto(profile) || nombreCompleto(account) || 'Técnico',
      email: profile?.email || account.email || user.email || '',
      especialidad: profile?.especialidad || 'Técnico de mantenimiento',
      telefono: profile?.telefono || 'Sin registrar',
    });
  } catch (failure) { return mobileFailure(failure); }
}
