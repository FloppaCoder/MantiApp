import { MobileApiError, mobileFailure, mobileJson, technicianContext } from '@/lib/mobile-api';
import { validateProfileUpdate } from '@/lib/mobile-profile';
import { nombreCompleto } from '@/lib/domain';

// Perfil del técnico tal como lo muestra la app. Si aún no llenó la especialidad o el teléfono,
// se muestran textos por defecto (la app móvil los reconoce en lib/domain.ts).
function perfilParaLaApp(profile: Record<string, string | null> | null, fallbackEmail: string) {
  return {
    nombre: nombreCompleto(profile) || 'Técnico',
    email: profile?.email || fallbackEmail,
    especialidad: profile?.especialidad || 'Técnico de mantenimiento',
    telefono: profile?.telefono || 'Sin registrar',
  };
}

export async function GET(request: Request) {
  try {
    const { db, user, account } = await technicianContext(request);
    const { data: profile, error } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return mobileJson(perfilParaLaApp(profile ?? account, account.email || user.email || ''));
  } catch (failure) { return mobileFailure(failure); }
}

// Guarda la especialidad y el teléfono del propio técnico
export async function PATCH(request: Request) {
  try {
    const { db, user, account } = await technicianContext(request);
    let body: unknown;
    try { body = await request.json(); }
    catch { throw new MobileApiError('JSON no válido.', 400); }
    const cambios = validateProfileUpdate(body);
    const { data, error } = await db.from('profiles').update(cambios).eq('id', user.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) throw new MobileApiError('Perfil no encontrado.', 404);
    return mobileJson(perfilParaLaApp(data, account.email || user.email || ''));
  } catch (failure) { return mobileFailure(failure); }
}
