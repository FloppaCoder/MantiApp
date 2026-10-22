import { MobileApiError } from './mobile-api';

interface Task { tarea: string; completada: boolean }
export const defaultTasks = [
  'Verificar condiciones de seguridad', 'Inspeccionar componentes principales',
  'Ejecutar tarea de mantenimiento', 'Probar funcionamiento', 'Limpiar área de trabajo',
].map(tarea => ({ tarea, completada: false }));

export function validateOrderUpdate(body: unknown, order: { estado: string; checklist: Task[] | null }) {
  if (!body || typeof body !== 'object') throw new MobileApiError('Datos no válidos.', 400);
  const { nuevo_estado, estado_anterior, checklist } = body as Record<string, unknown>;
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
  return { estado: nuevo_estado as string, checklist: checklist.map(item => ({ tarea: item.tarea as string, completada: item.completada as boolean })) };
}
