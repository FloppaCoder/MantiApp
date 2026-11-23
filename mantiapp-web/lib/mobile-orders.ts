import { MobileApiError } from './mobile-api';

interface Task { tarea: string; completada: boolean }
export const defaultTasks = [
  'Verificar condiciones de seguridad', 'Inspeccionar componentes principales',
  'Ejecutar tarea de mantenimiento', 'Probar funcionamiento', 'Limpiar área de trabajo',
].map(tarea => ({ tarea, completada: false }));

const maxFotos = 6;
const maxObservaciones = 5000; // mismo límite que el campo de texto del móvil

export function validateOrderUpdate(body: unknown, order: { estado: string; checklist: Task[] | null }, orderId = '') {
  if (!body || typeof body !== 'object') throw new MobileApiError('Datos no válidos.', 400);
  const { nuevo_estado, estado_anterior, checklist, fotos, observaciones } = body as Record<string, unknown>;
  if (estado_anterior !== order.estado) throw new MobileApiError('La orden cambió. Recarga el listado.', 409);
  if (!['Pendiente', 'Asignada', 'En progreso'].includes(order.estado) || !['En progreso', 'Completada'].includes(String(nuevo_estado))) {
    throw new MobileApiError('Transición no válida.', 400);
  }
  const expected = order.checklist?.length ? order.checklist : defaultTasks;
  if (!Array.isArray(checklist) || checklist.length !== expected.length || checklist.some((item, index) =>
    !item || typeof item.tarea !== 'string' || item.tarea !== expected[index].tarea || typeof item.completada !== 'boolean')) {
    throw new MobileApiError('El checklist no coincide con las tareas asignadas.', 400);
  }
  if (nuevo_estado === 'Completada' && (order.estado !== 'En progreso' || !checklist.every(item => item.completada))) {
    throw new MobileApiError('Completa todas las tareas antes de finalizar.', 400);
  }
  // Fotos de evidencia (opcionales): máximo 6, y solo direcciones del bucket "evidencias" que pertenezcan a ESTA orden
  const prefijo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/evidencias/${orderId}/`;
  if (fotos !== undefined && (!Array.isArray(fotos) || fotos.length > maxFotos ||
    fotos.some(foto => typeof foto !== 'string' || !orderId || !foto.startsWith(prefijo)))) {
    throw new MobileApiError('Las fotos de evidencia no son válidas.', 400);
  }
  // Observaciones del técnico (opcionales): solo texto, con un largo máximo
  if (observaciones !== undefined && (typeof observaciones !== 'string' || observaciones.length > maxObservaciones)) {
    throw new MobileApiError('Las observaciones no son válidas.', 400);
  }
  return {
    estado: nuevo_estado as string,
    checklist: checklist.map(item => ({ tarea: item.tarea as string, completada: item.completada as boolean })),
    // Fotos y observaciones se guardan en cada avance (no solo al completar), para que el administrador las vea
    ...(fotos !== undefined ? { fotos: fotos as string[] } : {}),
    ...(typeof observaciones === 'string' ? { observaciones: observaciones.trim() } : {}),
    // Al completar la orden se guarda cuándo ocurrió
    ...(nuevo_estado === 'Completada' ? { fecha_completada: new Date().toISOString() } : {}),
  };
}
