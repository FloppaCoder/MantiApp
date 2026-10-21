export type Tab = 'inicio' | 'ordenes' | 'perfil';
export type OrderFilter = 'Activas' | 'Todas' | 'Completadas';
export type OrderState = 'Pendiente' | 'Asignada' | 'En progreso' | 'Completada';
export type Relation<T> = T | T[] | null;
export interface Technician {
  id: string; nombre: string; email: string; telefono: string; especialidad: string;
  ordenes_activas: number; completadas_mes: number;
}
export interface Asset { id: string; codigo: string; nombre: string; ubicacion?: string }
export interface ChecklistItem { tarea: string; completada: boolean }
export interface WorkOrder {
  id: string; codigo_ot: string; tecnico_id: string | null;
  titulo: string; descripcion: string; prioridad: string; estado: OrderState;
  fecha_vencimiento: string | null; instrucciones_seguridad?: string | null;
  checklist?: ChecklistItem[] | null;
  assets: Relation<Asset>;
  profiles: Relation<{ id: string; nombre: string; email: string }>;
}
export function relation<T>(value: Relation<T> | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
export function filterOrders(orders: WorkOrder[], filter: OrderFilter): WorkOrder[] {
  return orders.filter(order => filter === 'Todas'
    || (filter === 'Completadas' ? order.estado === 'Completada'
      : order.estado !== 'Completada'));
}
export function dateLabel(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha válida'
    : new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase();
}
export function canTransition(from: OrderState, to: OrderState): boolean {
  return (from === 'Asignada' && to === 'En progreso')
    || (from === 'En progreso' && to === 'Completada');
}
export function normalizeBaseUrl(value: string): string {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.search || url.hash || url.pathname !== '/') {
    throw new Error('EXPO_PUBLIC_API_URL debe contener la URL base del servidor, sin /api, parámetros ni credenciales.');
  }
  return url.origin;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function readTechnicians(value: unknown): Technician[] {
  if (!Array.isArray(value) || !value.every(item => record(item)
    && typeof item.id === 'string' && typeof item.nombre === 'string')) {
    throw new Error('El API no devolvió un listado válido de técnicos.');
  }
  return value as Technician[];
}
export function readOrder(value: unknown): WorkOrder {
  if (!record(value) || typeof value.id !== 'string'
    || typeof value.estado !== 'string'
    || !['Pendiente', 'Asignada', 'En progreso', 'Completada'].includes(value.estado)
    || typeof value.codigo_ot !== 'string') {
    throw new Error('El API no devolvió una orden válida.');
  }
  return value as unknown as WorkOrder;
}
export function readOrders(value: unknown): WorkOrder[] {
  if (!Array.isArray(value)) throw new Error('El API no devolvió un listado válido de órdenes.');
  return value.map(readOrder);
}
