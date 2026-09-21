'use client';
import Link from 'next/link';
import { planCount } from './schedule';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { request, useResource } from '@/lib/api-client';
import { type Asset, type MaintenancePlan, planStates, priorities, relation, dateLabel, assetLabel } from '@/lib/domain';
import { Badge, ButtonLink, Empty, Field, Icon, Notice, PageHeading, Panel, ResourceState, Stat } from './ui';
export function MaintenancePage() {
    const [state, setState] = useState('Todos');
    const resource = useResource<MaintenancePlan[]>('/api/mantenimientos');
    const visiblePlans = (resource.data ?? []).filter(plan => state === 'Todos' || plan.estado === state);
    return <><PageHeading title="Mantenimientos" subtitle="Organiza las próximas tareas y da seguimiento a los planes."><ButtonLink href="/admin/mantenimientos/nuevo"><Icon name="plus" size={18}/>Nuevo plan</ButtonLink></PageHeading><ResourceState {...resource} retry={resource.reload}><div className="stats-grid three-stats"><Stat label="Vencidos" value={planCount(resource.data ?? [], 'Vencido')} hint="Requieren atención" icon="alert" tone="red"/><Stat label="Próximos" value={planCount(resource.data ?? [], 'Próximo')} hint="Estado registrado" icon="clock" tone="amber"/><Stat label="Programados" value={planCount(resource.data ?? [], 'Programado')} hint="Pendientes en el calendario" icon="calendar"/></div></ResourceState><Panel><div className="filter-tabs spacious">{['Todos', ...planStates].map(item => <button key={item} aria-pressed={item === state} className={item === state ? 'selected' : ''} onClick={() => setState(item)}>{item}</button>)}</div><ResourceState {...resource} retry={resource.reload}>{visiblePlans.length ? <div className="table-scroll"><table><thead><tr><th>Tarea / Activo</th><th>Tipo</th><th>Frecuencia</th><th>Próxima fecha</th><th>Prioridad</th><th>Estado</th></tr></thead><tbody>{visiblePlans.map(plan => <tr key={plan.id}><td><div className="table-title"><strong>{plan.tarea}</strong><Link href={`/admin/activos/${encodeURIComponent(plan.asset_id)}`}>{assetLabel(relation(plan.assets), 'Consultar activo')}</Link></div></td><td>{plan.tipo}</td><td>{plan.frecuencia || 'Sin frecuencia'}</td><td>{dateLabel(plan.proxima_fecha)}</td><td><Badge value={plan.prioridad}/></td><td><Badge value={plan.estado}/></td></tr>)}</tbody></table></div> : <Empty title="No hay planes en esta vista" description="Crea un plan de mantenimiento o consulta otro estado."/>}</ResourceState></Panel></>;
}
export function NewMaintenancePage() {
    const router = useRouter();
    const assets = useResource<Asset[]>('/api/activos');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy)
            return;
        const body = Object.fromEntries([...new FormData(event.currentTarget)].map(([key, value]) => [key, String(value).trim()]));
        if (!body.tarea || !body.asset_id || !body.proxima_fecha) {
            setError('Completa la tarea, el activo y la fecha.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await request('/api/mantenimientos', { method: 'POST', body: JSON.stringify(body) });
            router.push('/admin/mantenimientos');
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'No se pudo crear el plan.');
        }
        finally {
            setBusy(false);
        }
    }
    return <><Link className="back-link" href="/admin/mantenimientos"><Icon name="back" size={16}/>Volver a mantenimientos</Link><PageHeading title="Nuevo plan de mantenimiento" subtitle="Define la tarea y la próxima fecha de atención."/><Panel title="Información del plan" className="form-panel"><ResourceState {...assets} retry={assets.reload}>{assets.data?.length ? <form onSubmit={save} className="form-stack"><fieldset disabled={busy} className="form-stack"><Field label="Activo *"><select name="asset_id" required defaultValue=""><option value="" disabled>Selecciona un activo</option>{assets.data.map(asset => <option key={asset.id} value={asset.id}>{asset.codigo} · {asset.nombre}</option>)}</select></Field><Field label="Tarea *"><input name="tarea" required maxLength={200} placeholder="Ej. Revisar filtros y lubricación"/></Field><div className="form-grid"><Field label="Tipo"><select name="tipo"><option>Preventivo</option><option>Correctivo</option></select></Field><Field label="Frecuencia"><input name="frecuencia" placeholder="Ej. Cada 3 meses" maxLength={100}/></Field><Field label="Próxima fecha *"><input type="date" name="proxima_fecha" required/></Field><Field label="Prioridad"><select name="prioridad" defaultValue="Media">{priorities.map(item => <option key={item}>{item}</option>)}</select></Field></div></fieldset>{error && <Notice danger>{error}</Notice>}<div className="form-actions">{!busy && <Link className="button secondary" href="/admin/mantenimientos">Cancelar</Link>}<button className="button" disabled={busy}>{busy ? 'Guardando…' : 'Crear plan'}</button></div></form> : <Empty title="Primero registra un activo" description="Cada plan necesita un equipo asociado."><ButtonLink href="/admin/activos/nuevo">Crear activo</ButtonLink></Empty>}</ResourceState></Panel></>;
}
