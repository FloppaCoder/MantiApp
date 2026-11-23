import { request } from './api-client';
import { ChecklistItem, isActive, normalized, Technician, WorkOrder } from './domain';

export const technicianPaths = { orders: '/api/movil/ordenes', profile: '/api/movil/perfil' } as const;
export const loadProfile = () => request<Technician>(technicianPaths.profile);
export const loadOrders = () => request<WorkOrder[]>(technicianPaths.orders);
// Guarda la especialidad y el teléfono del técnico (un texto vacío los deja "sin registrar")
export const saveProfile = (especialidad: string, telefono: string) =>
  request<Technician>(technicianPaths.profile, { method: 'PATCH', body: JSON.stringify({ especialidad, telefono }) });
export async function saveOrder(order: WorkOrder, state: string, checklist: ChecklistItem[], fotos: string[] = [], observaciones = '') {
  if (!isActive(order) || !['En progreso', 'Completada'].includes(state)) throw new Error('Transición no válida');
  if (state === 'Completada' && (normalized(order.estado) !== 'en progreso' || !checklist.length || !checklist.every(item => item.completada))) throw new Error('Completa el checklist antes de finalizar');
  return request<WorkOrder>(`${technicianPaths.orders}/${encodeURIComponent(order.id)}`, {
    method: 'PATCH', body: JSON.stringify({ nuevo_estado: state, estado_anterior: order.estado, checklist, fotos, observaciones }),
  });
}
