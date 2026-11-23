
export interface ChecklistItem { tarea: string; completada: boolean }
export interface WorkOrder {
  id: string; codigo_ot: string; titulo: string; descripcion: string; prioridad: string; estado: string;
  fecha_vencimiento: string | null; instrucciones_seguridad?: string; tipo_mantenimiento?: string;
  checklist: ChecklistItem[] | null;
  fotos?: string[]; // direcciones de las fotos de evidencia ya subidas
  observaciones?: string | null; // observaciones que el técnico ya guardó en el servidor
  assets: { codigo: string; nombre: string; ubicacion: string } | null;
}
export interface Technician { nombre: string; email: string; especialidad: string; telefono: string }
// Textos que la API devuelve cuando el técnico todavía no llenó estos datos
export const especialidadPorDefecto = 'Técnico de mantenimiento';
export const telefonoSinRegistrar = 'Sin registrar';
export const defaultChecklist: ChecklistItem[] = [
  'Verificar condiciones de seguridad', 'Inspeccionar componentes principales',
  'Ejecutar tarea de mantenimiento', 'Probar funcionamiento', 'Limpiar área de trabajo',
].map(tarea => ({ tarea, completada: false }));
export const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const isCompleted = (order: WorkOrder) => normalized(order.estado) === 'completada';
export const isActive = (order: WorkOrder) => !['completada', 'cancelada'].includes(normalized(order.estado));
export const dateLabel = (value: string | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha válida' : date.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' });
};

export type OrderFilter = 'Todas' | 'Activas' | 'Completadas';
export type TechnicianTab = 'Inicio' | 'Órdenes' | 'Perfil';
export const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(part => part[0]).join('');
