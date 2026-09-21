'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useResource } from '@/lib/api-client';
import { type Asset, type DashboardData, type WorkOrder, type Technician, type MaintenancePlan, distribution, downloadCsv, normalized, relation, dateLabel } from '@/lib/domain';
import { Badge, Bars, ButtonLink, Empty, Icon, PageHeading, Panel, ResourceState, SearchField, Stat } from './ui';
import { OrderTable } from './orders';
import { WeeklySchedule, NextMaintenance } from './schedule';
import { CategoryChart } from './category-chart';
import { useBusinessDate } from '@/lib/use-business-date';
import { plansForWeek } from '@/lib/scheduling';
export function DashboardPage() {
    const today = useBusinessDate();
    // Collections act as a read-error check because the metrics route currently hides database errors.
    const metrics = useResource<DashboardData>('/api/dashboard/metricas');
    const assets = useResource<Asset[]>('/api/activos');
    const plans = useResource<MaintenancePlan[]>('/api/mantenimientos');
    const orders = useResource<WorkOrder[]>('/api/ordenes');
    const loading = metrics.loading || assets.loading || plans.loading || orders.loading;
    const error = metrics.error || assets.error || plans.error || orders.error;
    const retry = () => { metrics.reload(); assets.reload(); plans.reload(); orders.reload(); };
    const attention = assets.data?.filter(asset => normalized(asset.estado) !== 'operativo') ?? [];
    return <><PageHeading title="Dashboard" subtitle="Una mirada al estado de tu operación."><ButtonLink href="/admin/ordenes/nueva"><Icon name="plus" size={18}/>Nueva orden</ButtonLink></PageHeading><ResourceState loading={loading} error={error} retry={retry}><div className="stats-grid"><Stat label="Total de activos" value={assets.data?.length ?? '—'} hint="Equipos en el inventario" icon="box"/><Stat label="Programados esta semana" value={today ? plansForWeek(plans.data ?? [], today).length : '—'} hint="Planes abiertos · Lunes a domingo" icon="calendar" tone="amber"/><Stat label="Mantenimientos vencidos" value={plans.data?.filter(plan => normalized(plan.estado) === 'vencido').length ?? '—'} hint="Requieren atención" icon="alert" tone="red"/><Stat label="Órdenes en progreso" value={orders.data?.filter(order => normalized(order.estado) === 'en progreso').length ?? '—'} hint="Trabajo en curso" icon="orders" tone="green"/></div><div className="dashboard-grid"><Panel title="Estado del mantenimiento" subtitle="Distribución de los planes registrados" action={<Link className="text-link" href="/admin/mantenimientos">Ver planes <Icon name="arrow" size={14}/></Link>}><Bars values={distribution((plans.data ?? []).map(plan => plan.estado))}/><div className="panel-footnote">Vista actual de tus planes de mantenimiento.</div></Panel><Panel title="Alertas destacadas" subtitle="Pendientes que merecen una revisión" action={<Link className="text-link" href="/admin/alertas">Ver todas</Link>}><AlertList alerts={(metrics.data?.alertas ?? []).slice(0, 3)}/></Panel></div><WeeklySchedule plans={plans.data ?? []} today={today}/><Panel title="Activos que requieren atención" subtitle="Equipos en mantenimiento o fuera de servicio" action={<Link className="text-link" href="/admin/activos">Ver inventario <Icon name="arrow" size={14}/></Link>}>{attention.length ? <div className="record-list">{attention.slice(0, 5).map(asset => <Link href={`/admin/activos/${encodeURIComponent(asset.id)}`} key={asset.id} className="record-row"><span className="asset-symbol"><Icon name="box"/></span><div className="record-main"><strong>{asset.nombre}</strong><small>{asset.codigo} · {asset.ubicacion || 'Sin ubicación'}</small></div><NextMaintenance plans={plans.data ?? []} assetId={asset.id} today={today}/><Badge value={asset.estado}/><Icon name="arrow" size={17}/></Link>)}</div> : <Empty title="Sin activos pendientes de atención" description="No hay equipos registrados con un estado distinto a operativo."/>}</Panel></ResourceState></>;
}
function AlertList({ alerts }: {
    alerts: DashboardData['alertas'];
}) {
    return alerts.length ? <div className="alert-list">{alerts.map(alert => <article key={alert.id} className={`alert-card ${normalized(alert.tipo) === 'critica' ? 'critical' : ''}`}><div className="alert-card-top"><Badge value={alert.tipo}/><Icon name="alert" size={16}/></div><p>{alert.mensaje}</p></article>)}</div> : <Empty title="Sin alertas disponibles" description="Aquí aparecerán los avisos de equipos y mantenimientos."/>;
}
export function AlertsPage() {
    const resource = useResource<DashboardData>('/api/dashboard/metricas');
    const assets = useResource<Asset[]>('/api/activos');
    const plans = useResource<MaintenancePlan[]>('/api/mantenimientos');
    const orders = useResource<WorkOrder[]>('/api/ordenes');
    const [severity, setSeverity] = useState('Todas');
    const alerts = resource.data?.alertas.filter(item => severity === 'Todas' || normalized(item.tipo) === normalized(severity)) ?? [];
    return <><PageHeading title="Alertas" subtitle="Identifica los equipos y tareas que necesitan atención."/><Panel><div className="filter-tabs spacious">{['Todas', 'Crítica', 'Advertencia'].map(item => <button key={item} className={severity === item ? 'selected' : ''} aria-pressed={severity === item} onClick={() => setSeverity(item)}>{item}</button>)}</div><ResourceState loading={resource.loading || assets.loading || plans.loading || orders.loading} error={resource.error || assets.error || plans.error || orders.error} retry={() => { resource.reload(); assets.reload(); plans.reload(); orders.reload(); }}><div className="stats-grid three-stats alert-summary"><Stat label="Críticas" value={resource.data?.alertas.filter(item => normalized(item.tipo) === 'critica').length ?? 0} hint="Atención prioritaria" icon="alert" tone="red"/><Stat label="Advertencias" value={resource.data?.alertas.filter(item => normalized(item.tipo) === 'advertencia').length ?? 0} hint="Pendientes de revisión" icon="bell" tone="amber"/><Stat label="Total de alertas" value={resource.data?.alertas.length ?? 0} hint="Todas las severidades recibidas" icon="list"/></div><AlertList alerts={alerts}/></ResourceState></Panel></>;
}
export function TechniciansPage() {
    const resource = useResource<Technician[]>('/api/tecnicos');
    const [query, setQuery] = useState('');
    const people = resource.data?.filter(tech => normalized(`${tech.nombre} ${tech.especialidad}`).includes(normalized(query))) ?? [];
    return <><PageHeading title="Técnicos" subtitle="Conoce al equipo y consulta su carga de trabajo."/><div className="toolbar panel"><SearchField value={query} onChange={setQuery} placeholder="Buscar por nombre o especialidad…"/><span className="muted">Directorio del equipo</span></div><ResourceState {...resource} retry={resource.reload}>{people.length ? <div className="technician-grid">{people.map((person, index) => <Panel key={person.id} className="technician-card"><div className="technician-header"><span className={`person-avatar avatar-${index % 4}`}>{person.nombre?.split(' ').slice(0, 2).map(word => word[0]).join('') || 'T'}</span><div><h2>{person.nombre}</h2><p>{person.especialidad || 'General'}</p></div></div><dl className="contact-list"><div><dt>Correo</dt><dd>{person.email || 'Sin registrar'}</dd></div><div><dt>Teléfono</dt><dd>{person.telefono || 'Sin registrar'}</dd></div></dl><div className="technician-stats"><div><strong>{person.ordenes_activas}</strong><span>Órdenes activas</span></div><div><strong>{person.completadas_mes}</strong><span>Completadas · total</span></div></div></Panel>)}</div> : <Panel><Empty title="No hay técnicos para mostrar" description="Prueba otra búsqueda o consulta cuando el equipo esté registrado."/></Panel>}</ResourceState></>;
}
export function HistoryPage() {
    const resource = useResource<WorkOrder[]>('/api/ordenes?estado=Completada');
    const [query, setQuery] = useState('');
    const rows = resource.data?.filter(order => normalized(`${order.codigo_ot} ${order.titulo} ${relation(order.assets)?.nombre ?? ''} ${relation(order.profiles)?.nombre ?? ''}`).includes(normalized(query))) ?? [];
    return <><PageHeading title="Historial" subtitle="Consulta las órdenes que ya se han completado."><button className="button secondary" disabled={!rows.length} onClick={() => downloadCsv('ordenes-completadas.csv', [['Código', 'Título', 'Activo', 'Técnico', 'Fecha de vencimiento', 'Estado'], ...rows.map(order => [order.codigo_ot, order.titulo, relation(order.assets)?.nombre, relation(order.profiles)?.nombre, order.fecha_vencimiento, order.estado])])}><Icon name="download" size={18}/>Exportar CSV</button></PageHeading><Panel><div className="toolbar"><SearchField value={query} onChange={setQuery} placeholder="Buscar por orden, activo o técnico…"/></div><ResourceState {...resource} retry={resource.reload}>{rows.length ? <OrderTable orders={rows}/> : <Empty title="Sin órdenes completadas" description="Las órdenes finalizadas aparecerán aquí."/>}</ResourceState></Panel></>;
}
export function ReportsPage() {
    const today = useBusinessDate();
    const assets = useResource<Asset[]>('/api/activos');
    const orders = useResource<WorkOrder[]>('/api/ordenes');
    const plans = useResource<MaintenancePlan[]>('/api/mantenimientos');
    const byCategory = distribution((assets.data ?? []).map(asset => asset.categoria));
    const byState = distribution((orders.data ?? []).map(order => order.estado));
    const loading = assets.loading || orders.loading || plans.loading;
    const error = assets.error || orders.error || plans.error;
    const completed = orders.data?.filter(order => normalized(order.estado) === 'completada').length ?? 0;
    const reportGroups = [{ label: 'Activos', values: byCategory }, { label: 'Órdenes', values: byState }, { label: 'Planes', values: distribution((plans.data ?? []).map(plan => plan.estado)) }];
    return <><PageHeading title="Reportes" subtitle="Información útil para entender tu operación actual."><button className="button" disabled={loading || !!error || !today} onClick={() => window.print()}><Icon name="download" size={18}/>Imprimir / PDF</button><button className="button secondary" disabled={loading || !!error || (!assets.data?.length && !orders.data?.length && !plans.data?.length)} onClick={() => downloadCsv('resumen-mantenimiento.csv', [['Grupo', 'Clasificación', 'Cantidad'], ...byCategory.map(item => ['Activos por categoría', item.label, item.count]), ...byState.map(item => ['Órdenes por estado', item.label, item.count]), ...distribution((plans.data ?? []).map(plan => plan.estado)).map(item => ['Planes por estado', item.label, item.count])])}><Icon name="download" size={18}/>Exportar resumen</button></PageHeading><ResourceState loading={loading} error={error} retry={() => { assets.reload(); orders.reload(); plans.reload(); }}><div className="print-report-heading"><strong>MantiApp · Reporte de mantenimiento</strong><p>Fecha de emisión: {today ? dateLabel(today) : 'Consultando fecha…'} · El Salvador</p><p>Resumen de los registros disponibles al cargar esta vista; no representa un período histórico.</p></div><p className="print-help">Para guardar el reporte, selecciona «Guardar como PDF» en el diálogo de impresión.</p><div className="stats-grid"><Stat label="Activos registrados" value={assets.data?.length ?? 0} hint="Inventario actual" icon="box"/><Stat label="Órdenes registradas" value={orders.data?.length ?? 0} hint="Todos los estados" icon="orders"/><Stat label="Órdenes completadas" value={completed} hint="Total disponible" icon="check" tone="green"/><Stat label="Planes registrados" value={plans.data?.length ?? 0} hint="Programación registrada" icon="calendar" tone="amber"/></div><div className="equal-grid"><Panel title="Activos por categoría" subtitle="Composición del inventario"><CategoryChart values={byCategory}/></Panel><Panel title="Órdenes por estado" subtitle="Distribución del trabajo registrado"><Bars values={byState}/></Panel></div><Panel title="Planes por estado" subtitle="Resumen de la programación"><Bars values={distribution((plans.data ?? []).map(plan => plan.estado))}/></Panel><table className="print-summary"><caption>Detalle de las distribuciones</caption><thead><tr><th>Grupo</th><th>Clasificación</th><th>Cantidad</th></tr></thead><tbody>{reportGroups.flatMap(group => group.values.map(item => <tr key={`${group.label}-${item.label}`}><td>{group.label}</td><td>{item.label}</td><td>{item.count}</td></tr>))}</tbody></table></ResourceState></>;
}
export function SettingsPage() {
    return <><PageHeading title="Configuración" subtitle="Preferencias y administración de tu espacio de trabajo."/><div className="equal-grid">{[['settings', 'Datos de la empresa', 'Nombre, correo de contacto y zona horaria de tu organización.'], ['box', 'Categorías de activos', 'Administración del catálogo de categorías del inventario.']].map(([icon, title, description]) => <Panel key={title} title={title}><div className="settings-placeholder"><span className="empty-icon"><Icon name={icon} size={25}/></span><p>{description}</p><span className="availability">Todavía no disponible</span></div></Panel>)}</div></>;
}
