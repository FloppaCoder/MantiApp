'use client';
import Link from 'next/link';
import { AssetPlans } from './schedule';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { request, useDebounced, useResource } from '@/lib/api-client';
import { type Asset, type WorkOrder, assetStates, categories, normalized, relation } from '@/lib/domain';
import { Badge, ButtonLink, Empty, Field, Icon, Modal, Notice, PageHeading, Panel, ResourceState, SearchField } from './ui';
export function AssetsPage() {
    const params = useSearchParams();
    return <AssetInventory key={params.get('search') ?? ''} initialQuery={params.get('search') ?? ''}/>;
}
function AssetInventory({ initialQuery }: {
    initialQuery: string;
}) {
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState('Todos');
    const settled = useDebounced(query);
    const filters = new URLSearchParams();
    if (settled.trim())
        filters.set('search', settled.trim());
    if (category !== 'Todos')
        filters.set('categoria', category);
    const resource = useResource<Asset[]>(`/api/activos?${filters}`);
    return <><PageHeading title="Activos" subtitle="Un inventario claro de los equipos que hacen funcionar tu empresa."><ButtonLink href="/admin/activos/nuevo"><Icon name="plus" size={18}/>Nuevo activo</ButtonLink></PageHeading><Panel><div className="toolbar"><SearchField value={query} onChange={setQuery} placeholder="Buscar por nombre o código…"/><span className="muted">{resource.data ? `${resource.data.length} activos encontrados` : 'Inventario de activos'}</span></div><div className="filter-tabs" aria-label="Categorías">{['Todos', ...categories].map(item => <button key={item} className={category === item ? 'selected' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><ResourceState {...resource} retry={resource.reload}>{resource.data?.length ? <div className="table-scroll"><table><thead><tr><th>Activo</th><th>Categoría</th><th>Ubicación</th><th>Estado</th><th><span className="sr-only">Detalle</span></th></tr></thead><tbody>{resource.data.map(asset => <tr key={asset.id}><td><Link className="asset-name" href={`/admin/activos/${encodeURIComponent(asset.id)}`}><span className="asset-symbol"><Icon name="box"/></span><span><strong>{asset.nombre}</strong><small>{asset.codigo}</small></span></Link></td><td>{asset.categoria || 'Sin categoría'}</td><td><span className="inline-icon"><Icon name="pin" size={15}/>{asset.ubicacion || 'Sin ubicación'}</span></td><td><Badge value={asset.estado}/></td><td><Link className="icon-button" href={`/admin/activos/${encodeURIComponent(asset.id)}`} aria-label={`Ver ${asset.nombre}`}><Icon name="arrow" size={18}/></Link></td></tr>)}</tbody></table></div> : <Empty title={query || category !== 'Todos' ? 'No encontramos coincidencias' : 'Tu inventario comienza aquí'} description={query || category !== 'Todos' ? 'Prueba con otra búsqueda o categoría.' : 'Registra tu primer activo para organizar su mantenimiento.'}/>}</ResourceState></Panel></>;
}
export function AssetForm({ asset, onSaved }: {
    asset?: Asset;
    onSaved?: () => void;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy)
            return;
        const form = new FormData(event.currentTarget);
        const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value).trim()]));
        if (['nombre', 'categoria', 'ubicacion', ...(asset ? [] : ['codigo'])].some(key => !payload[key])) {
            setError('Completa todos los campos obligatorios.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await request<Asset>(asset ? `/api/activos/${encodeURIComponent(asset.id)}` : '/api/activos', { method: asset ? 'PUT' : 'POST', body: JSON.stringify(payload) });
            if (onSaved)
                onSaved();
            else
                router.push('/admin/activos');
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'No se pudo guardar el activo.');
        }
        finally {
            setBusy(false);
        }
    }
    const state = assetStates.find(item => normalized(item) === normalized(asset?.estado)) ?? asset?.estado ?? 'Operativo';
    return <form onSubmit={save} className="form-stack"><fieldset disabled={busy}><div className="form-grid">{!asset && <Field label="Código del activo *"><input name="codigo" placeholder="Ej. EQ-001" maxLength={60} required/></Field>}<Field label="Nombre del activo *"><input name="nombre" defaultValue={asset?.nombre} placeholder="Ej. Compresor de aire" maxLength={180} required/></Field><Field label="Categoría *"><select name="categoria" defaultValue={asset?.categoria || ''} required><option value="" disabled>Selecciona una categoría</option>{Array.from(new Set([...categories, ...(asset?.categoria ? [asset.categoria] : [])])).map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Ubicación *"><input name="ubicacion" defaultValue={asset?.ubicacion} placeholder="Ej. Taller central" maxLength={180} required/></Field><Field label="Estado"><select name="estado" defaultValue={state}>{Array.from(new Set([...assetStates, state])).map(item => <option key={item}>{item}</option>)}</select></Field></div></fieldset>{error && <Notice danger>{error}</Notice>}<div className="form-actions">{!busy && <Link className="button secondary" href={asset ? `/admin/activos/${encodeURIComponent(asset.id)}` : '/admin/activos'}>Cancelar</Link>}<button className="button" disabled={busy}><Icon name="check" size={18}/>{busy ? 'Guardando…' : 'Guardar activo'}</button></div></form>;
}
export function NewAssetPage() { return <><Link className="back-link" href="/admin/activos"><Icon name="back" size={16}/>Volver al inventario</Link><PageHeading title="Nuevo activo" subtitle="Registra la información básica de tu equipo."/><Panel title="Datos del activo" subtitle="Los campos con * son obligatorios." className="form-panel"><AssetForm /></Panel></>; }
export function AssetDetailPage({ id, edit = false }: {
    id: string;
    edit?: boolean;
}) {
    const router = useRouter();
    const resource = useResource<Asset[]>('/api/activos');
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const asset = resource.data?.find(item => item.id === id);
    async function remove() {
        if (busy)
            return;
        setBusy(true);
        setError('');
        try {
            await request(`/api/activos/${encodeURIComponent(id)}`, { method: 'DELETE' });
            router.push('/admin/activos');
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'No se pudo eliminar el activo.');
            setBusy(false);
        }
    }
    return <><Link className="back-link" href="/admin/activos"><Icon name="back" size={16}/>Volver al inventario</Link><ResourceState {...resource} retry={resource.reload}>{asset ? <><PageHeading title={edit ? 'Editar activo' : asset.nombre} subtitle={`${asset.codigo} · ${asset.categoria || 'Sin categoría'}`}>{!edit && <ButtonLink secondary href={`/admin/activos/${encodeURIComponent(id)}/editar`}><Icon name="edit" size={16}/>Editar activo</ButtonLink>}</PageHeading>{edit ? <Panel title="Información del activo" className="form-panel"><AssetForm asset={asset} onSaved={() => router.push(`/admin/activos/${encodeURIComponent(id)}`)}/></Panel> : <><div className="detail-grid"><Panel title="Ficha del equipo"><dl className="data-list"><div><dt>Código</dt><dd>{asset.codigo}</dd></div><div><dt>Categoría</dt><dd>{asset.categoria || 'Sin categoría'}</dd></div><div><dt>Ubicación</dt><dd>{asset.ubicacion || 'Sin ubicación'}</dd></div><div><dt>Estado actual</dt><dd><Badge value={asset.estado}/></dd></div></dl></Panel><Panel title="Gestión del mantenimiento"><div className="panel-body"><p className="muted">Crea una orden para coordinar el próximo trabajo sobre este activo.</p><ButtonLink href={`/admin/ordenes/nueva?activo=${encodeURIComponent(id)}`}><Icon name="plus" size={18}/>Crear orden</ButtonLink></div></Panel></div><AssetPlans id={id}/><AssetOrders id={id}/><div className="danger-zone"><div><strong>Eliminar activo</strong><p>Esta acción elimina el registro de forma permanente.</p></div><button className="button danger-button" onClick={() => setConfirm(true)}>Eliminar activo</button></div></>}</> : <Empty title="Activo no encontrado" description="Puede que se haya eliminado o que el enlace ya no esté disponible."/>}</ResourceState>{confirm && <Modal title="¿Eliminar este activo?" busy={busy} onClose={() => { setConfirm(false); setError(''); }}><div className="panel-body"><p>Se eliminará <strong>{asset?.nombre}</strong> del inventario. Esta acción no se puede deshacer.</p>{error && <Notice danger>{error}</Notice>}<div className="form-actions"><button className="button secondary" disabled={busy} onClick={() => setConfirm(false)}>Conservar activo</button><button className="button danger-button" disabled={busy} onClick={remove}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div></div></Modal>}</>;
}
function AssetOrders({ id }: {
    id: string;
}) {
    const resource = useResource<WorkOrder[]>('/api/ordenes');
    const orders = resource.data?.filter(order => order.asset_id === id || relation(order.assets)?.id === id) ?? [];
    return <Panel title="Órdenes relacionadas" subtitle="Trabajos registrados para este activo."><ResourceState {...resource} retry={resource.reload}>{orders.length ? <div className="record-list">{orders.map(order => <Link key={order.id} className="record-row" href={`/admin/ordenes/${encodeURIComponent(order.id)}`}><span className="code-label">{order.codigo_ot}</span><strong>{order.titulo}</strong><Badge value={order.estado}/><Icon name="arrow" size={16}/></Link>)}</div> : <Empty title="Sin órdenes relacionadas" description="Las órdenes de este activo aparecerán aquí."/>}</ResourceState></Panel>;
}
