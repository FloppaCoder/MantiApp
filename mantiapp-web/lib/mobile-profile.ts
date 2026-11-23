import { MobileApiError } from './mobile-api';
import { esTelefonoValido, limiteEspecialidad } from './validation';

// Valida los datos que el técnico puede editar de su perfil desde el móvil.
// Los dos campos son opcionales: un texto vacío significa "sin registrar" (se guarda como null).
export function validateProfileUpdate(body: unknown) {
  if (!body || typeof body !== 'object') throw new MobileApiError('Datos no válidos.', 400);
  const { especialidad, telefono } = body as Record<string, unknown>;
  if ((especialidad !== undefined && typeof especialidad !== 'string') || (telefono !== undefined && typeof telefono !== 'string')) {
    throw new MobileApiError('Datos no válidos.', 400);
  }
  const especialidadLimpia = (especialidad ?? '').toString().trim();
  const telefonoLimpio = (telefono ?? '').toString().trim();
  if (especialidadLimpia.length > limiteEspecialidad) {
    throw new MobileApiError(`La especialidad no puede pasar de ${limiteEspecialidad} caracteres.`, 400);
  }
  if (!esTelefonoValido(telefonoLimpio)) {
    throw new MobileApiError('El teléfono no es válido (8 a 15 dígitos).', 400);
  }
  return { especialidad: especialidadLimpia || null, telefono: telefonoLimpio || null };
}
