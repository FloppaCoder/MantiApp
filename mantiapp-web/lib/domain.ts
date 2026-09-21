export interface Asset {
    id: string;
    codigo: string;
    nombre: string;
    categoria: string;
    ubicacion: string;
    estado: string;
}
export interface Technician {
    id: string;
    nombre: string;
    email: string;
    especialidad: string;
    telefono: string;
    ordenes_activas: number;
    completadas_mes: number;
}
type Relation<T> = T | T[] | null;
export interface WorkOrder {
    id: string;
    codigo_ot: string;
    asset_id: string;
    tecnico_id: string | null;
    titulo: string;
    descripcion: string;
    prioridad: string;
    estado: string;
    fecha_vencimiento: string | null;
    instrucciones_seguridad?: string;
    assets: Relation<Pick<Asset, 'id' | 'codigo' | 'nombre' | 'ubicacion'>>;
    profiles: Relation<{
        id: string;
        nombre: string;
        email: string;
    }>;
}
export interface MaintenancePlan {
    id: string;
    asset_id: string;
    tipo: string;
    tarea: string;
    frecuencia: string;
    proxima_fecha: string;
    prioridad: string;
    estado: string;
    assets: Relation<Pick<Asset, 'id' | 'codigo' | 'nombre'>>;
}
export interface DashboardData {
    kpis: {
        total_activos: number;
        programados_semana: number;
        mantenimientos_vencidos: number;
        ordenes_en_progreso: number;
    };
    alertas: {
        id: string;
        tipo: string;
        mensaje: string;
    }[];
    activos_atencion: Pick<Asset, 'id' | 'codigo' | 'nombre' | 'estado'>[];
}
export const assetStates = ['Operativo', 'En Mantenimiento', 'Fuera de Servicio'] as const;
export const orderStates = ['Pendiente', 'Asignada', 'En progreso', 'Completada'] as const;
export const planStates = ['Programado', 'Próximo', 'Vencido', 'Completado'] as const;
export const categories = ['Maquinaria', 'Vehículos', 'Herramientas', 'Equipos informáticos', 'Otros'] as const;
export const priorities = ['Baja', 'Media', 'Alta', 'Crítica'] as const;
export function relation<T>(value: Relation<T> | undefined): T | null {
    return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
export function assetLabel(asset: Pick<Asset, 'nombre' | 'codigo'> | null | undefined, fallback = 'Activo no disponible') {
    if (!asset) return fallback;
    return [asset.nombre, asset.codigo].filter(Boolean).join(' · ') || fallback;
}
export function normalized(value: string | null | undefined) {
    return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
export function dateLabel(value: string | null | undefined) {
    if (!value)
        return 'Sin fecha';
    // Date-only fields are calendar dates, not UTC timestamps.
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? 'Sin fecha válida' : new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
export function distribution(values: string[]) {
    const counts = new Map<string, number>();
    for (const value of values)
        counts.set(value || 'Sin clasificar', (counts.get(value || 'Sin clasificar') ?? 0) + 1);
    return Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}
export function csvText(rows: (string | number | null | undefined)[][]) {
    return '\uFEFF' + rows.map(row => row.map(value => {
        let text = String(value ?? '');
        if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
            text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }).join(',')).join('\r\n');
}
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
    const url = URL.createObjectURL(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
