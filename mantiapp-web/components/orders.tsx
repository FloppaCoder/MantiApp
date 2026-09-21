'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { request, useResource } from '@/lib/api-client';
import { type WorkOrder, type Asset, type Technician, orderStates, priorities, relation, normalized, dateLabel, assetLabel } from '@/lib/domain';
import { Badge, ButtonLink, Empty, Field, Icon, Notice, PageHeading, Panel, ResourceState, SearchField } from './ui';
export function OrdersPage() {
    const [state, setState] = useState('Todos');
    const [query, setQuery] = useState('');
    const [view, setView] = useState<'board' | 'list'>('board');
    const resource = useResource<WorkOrder[]>(`/api/ordenes${state === 'Todos' ? '' : `?estado=${encodeURIComponent(state)}`}`);
    const orders = (resource.data ?? []).filter(order => normalized(`${order.codigo_ot} ${order.titulo} ${assetLabel(relation(order.assets), '')}`).includes(normalized(query)));
    const columns = [...orderStates, ...Array.from(new Set(orders.map(order => order.estado).filter(item => !(orderStates as readonly string[]).includes(item))))];
    return <><PageHeading title="Órdenes de trabajo" subtitle="Del primer pendiente al trabajo terminado. Todo a la vista."><ButtonLink href="/admin/ordenes/nueva"><Icon name="plus" size={18}/>Nueva orden</ButtonLink></PageHeading><div className="toolbar panel"><SearchField value={query} onChange={setQuery} placeholder="Buscar una orden…"/><div className="actions"><select aria-label="Filtrar órdenes por estado" value={state} onChange={event => setState(event.target.value)}><option>Todos</option>{columns.map(item => <option key={item}>{item}</option>)}</select><div className="segmented"><button aria-label="Vista de tablero" aria-pressed={view === 'board'} className={view === 'board' ? 'selected' : ''} onClick={() => setView('board')}><Icon name="grid" size={18}/></button><button aria-label="Vista de lista" aria-pressed={view === 'list'} className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}><Icon name="list" size={18}/></button></div></div></div><ResourceState {...resource} retry={resource.reload}>{!orders.length ? <Panel><Empty title="No hay órdenes para mostrar" description="Crea una orden o ajusta los filtros de búsqueda."/></Panel> : view === 'board' ? <div className="order-board">{columns.filter(item => state === 'Todos' || item === state).map(column => <section className="board-column" key={column}><header><span className={`column-dot ${normalized(column).replace(/ /g, '-')}`}/><h2>{column}</h2><span className="count-pill">{orders.filter(order => order.estado === column).length}</span></header><div className="board-cards">{orders.filter(order => order.estado === column).map(order => <OrderCard key={order.id} order={order}/>)}{!orders.some(order => order.estado === column) && <p className="column-empty">Sin órdenes</p>}</div></section>)}</div> : <Panel><OrderTable orders={orders}/></Panel>}</ResourceState></>;
}
function OrderCard({ order }: {
    order: WorkOrder;
}) {
    const asset = relation(order.assets);
    const tech = relation(order.profiles);
    return <Link className="order-card" href={`/admin/ordenes/${encodeURIComponent(order.id)}`}><div className="order-card-top"><span className="code-label">{order.codigo_ot}</span><Badge value={order.prioridad}/></div><h3 className="order-asset-title">{assetLabel(asset)}</h3><p className="order-task-title">{order.titulo}</p>{order.descripcion && <p className="order-description">{order.descripcion}</p>}<div className="order-card-meta"><span><Icon name="calendar" size={14}/>{dateLabel(order.fecha_vencimiento)}</span><span><Icon name="users" size={14}/>{tech?.nombre ?? 'Sin asignar'}</span></div></Link>;
}
export function OrderTable({ orders }: {
    orders: WorkOrder[];
}) {
    return <div className="table-scroll"><table><thead><tr><th>Orden</th><th>Activo</th><th>Técnico</th><th>Vencimiento</th><th>Estado</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><Link className="table-title" href={`/admin/ordenes/${encodeURIComponent(order.id)}`}><strong>{order.titulo}</strong><small>{order.codigo_ot}</small></Link></td><td>{assetLabel(relation(order.assets), 'No disponible')}</td><td>{relation(order.profiles)?.nombre ?? 'Sin asignar'}</td><td>{dateLabel(order.fecha_vencimiento)}</td><td><Badge value={order.estado}/></td></tr>)}</tbody></table></div>;
}
export function NewOrderPage() {
    const router = useRouter();
    const params = useSearchParams();
    const assets = useResource<Asset[]>('/api/activos');
    const technicians = useResource<Technician[]>('/api/tecnicos');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy)
            return;
        const form = new FormData(event.currentTarget);
        const body = Object.fromEntries([...form].map(([key, value]) => [key, String(value).trim()]));
        if (!body.titulo || !body.descripcion || !body.asset_id) {
            setError('Completa el activo, título y descripción.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await request('/api/ordenes', { method: 'POST', body: JSON.stringify(body) });
            router.push('/admin/ordenes');
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'No se pudo crear la orden.');
        }
        finally {
            setBusy(false);
        }
    }
    return <><Link className="back-link" href="/admin/ordenes"><Icon name="back" size={16}/>Volver a las órdenes</Link><PageHeading title="Nueva orden de trabajo" subtitle="Define el trabajo y elige quién lo llevará a cabo."/><ResourceState loading={assets.loading} error={assets.error} retry={assets.reload}>{assets.data?.length ? <form onSubmit={save} className="form-stack"><div className="detail-grid"><Panel title="Información del trabajo" subtitle="Los campos con * son obligatorios."><fieldset disabled={busy} className="panel-body form-stack"><Field label="Activo *"><select name="asset_id" defaultValue={params.get('activo') ?? ''} required><option value="" disabled>Selecciona un activo</option>{assets.data.map(asset => <option key={asset.id} value={asset.id}>{asset.codigo} · {asset.nombre}</option>)}</select></Field><Field label="Título *"><input name="titulo" required maxLength={180} placeholder="Ej. Inspección del sistema de refrigeración"/></Field><Field label="Descripción del trabajo *"><textarea name="descripcion" required rows={4} placeholder="Detalla el trabajo que necesita el equipo…"/></Field><div className="form-grid"><Field label="Fecha de vencimiento *"><input type="date" name="fecha_vencimiento" required/></Field><Field label="Prioridad"><select name="prioridad" defaultValue="Media">{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></Field></div><Field label="Instrucciones de seguridad"><textarea name="instrucciones_seguridad" rows={3} placeholder="Precauciones y equipo de protección necesarios"/></Field></fieldset></Panel><div className="form-stack"><Panel title="Asignación"><div className="panel-body form-stack"><Field label="Técnico responsable" hint="Puedes dejar la orden pendiente y sin asignar."><select name="tecnico_id" defaultValue="" disabled={busy || technicians.loading || !!technicians.error}><option value="">Sin asignar</option>{technicians.data?.map(tech => <option key={tech.id} value={tech.id}>{tech.nombre} · {tech.especialidad}</option>)}</select></Field>{technicians.loading && <p className="muted" role="status">Cargando técnicos…</p>}{technicians.error && <><Notice danger>No se pudieron cargar los técnicos. Puedes reintentar o crear la orden sin asignación.</Notice><button type="button" className="button secondary" onClick={technicians.reload}>Reintentar</button></>}<p className="muted">Cada orden admite un técnico responsable.</p></div></Panel><Notice>Al crear la orden, el activo pasará a estado «En Mantenimiento».</Notice></div></div>{error && <Notice danger>{error}</Notice>}<div className="form-actions">{!busy && <Link className="button secondary" href="/admin/ordenes">Cancelar</Link>}<button className="button" disabled={busy}><Icon name="check" size={18}/>{busy ? 'Creando…' : 'Crear orden de trabajo'}</button></div></form> : <Panel><Empty title="Primero registra un activo" description="Las órdenes de trabajo necesitan un activo asociado."><ButtonLink href="/admin/activos/nuevo">Crear activo</ButtonLink></Empty></Panel>}</ResourceState></>;
}
export function OrderDetailPage({ id }: {
    id: string;
}) {
    const resource = useResource<WorkOrder[]>('/api/ordenes');
    const order = resource.data?.find(item => item.id === id);
    return <><Link className="back-link" href="/admin/ordenes"><Icon name="back" size={16}/>Volver a las órdenes</Link><ResourceState {...resource} retry={resource.reload}>{order ? <OrderDetail key={`${order.id}:${order.estado}`} order={order} reload={resource.reload}/> : <Empty title="Orden no encontrada" description="Verifica el enlace o vuelve al listado de órdenes."/>}</ResourceState></>;
}
function OrderDetail({ order, reload }: {
    order: WorkOrder;
    reload: () => void;
}) {
    const [state, setState] = useState(order.estado);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const asset = relation(order.assets);
    const tech = relation(order.profiles);
    async function update(event: FormEvent) {
        event.preventDefault();
        if (busy || state === order.estado)
            return;
        setBusy(true);
        setError('');
        try {
            await request(`/api/ordenes/${encodeURIComponent(order.id)}/estado`, { method: 'PATCH', body: JSON.stringify({ nuevo_estado: state }) });
            reload();
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'No se pudo actualizar la orden.');
        }
        finally {
            setBusy(false);
        }
    }
    return <><PageHeading title={order.titulo} subtitle={order.codigo_ot}><Badge value={order.estado}/><Badge value={order.prioridad}/></PageHeading><div className="detail-grid"><Panel title="Detalle del trabajo"><div className="panel-body"><h3>Descripción</h3><p className="preserve-lines">{order.descripcion || 'Sin descripción'}</p><h3>Instrucciones de seguridad</h3><p className="preserve-lines">{order.instrucciones_seguridad || 'Sin instrucciones registradas.'}</p><dl className="data-list"><div><dt>Activo</dt><dd>{asset ? <Link href={`/admin/activos/${encodeURIComponent(asset.id)}`}>{asset.codigo} · {asset.nombre}</Link> : 'No disponible'}</dd></div><div><dt>Técnico</dt><dd>{tech?.nombre ?? 'Sin asignar'}</dd></div><div><dt>Vencimiento</dt><dd>{dateLabel(order.fecha_vencimiento)}</dd></div></dl></div></Panel><Panel title="Actualizar estado"><form onSubmit={update} className="panel-body form-stack"><Field label="Estado de la orden"><select value={state} onChange={event => setState(event.target.value)} disabled={busy}>{!(orderStates as readonly string[]).includes(order.estado) && <option value={order.estado} disabled>{order.estado}</option>}{orderStates.map(item => <option key={item}>{item}</option>)}</select></Field><p className="muted">Al completar la orden, el activo vuelve a estado operativo. Asignarla o iniciarla lo coloca en mantenimiento.</p>{error && <Notice danger>{error}</Notice>}<button className="button" disabled={busy || state === order.estado}>{busy ? 'Guardando…' : 'Guardar estado'}</button></form></Panel></div></>;
}
