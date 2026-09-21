'use client';
import Link from 'next/link';
import { useResource } from '@/lib/api-client';
import { type MaintenancePlan, assetLabel, dateLabel, normalized } from '@/lib/domain';
import { nextPlan, plansForWeek, weekBounds } from '@/lib/scheduling';
import { useBusinessDate } from '@/lib/use-business-date';
import { Badge, Empty, Icon, Panel, ResourceState } from './ui';

export function AssetPlans({ id }: { id: string }) {
  const resource = useResource<MaintenancePlan[]>('/api/mantenimientos');
  const today = useBusinessDate();
  const plans = (resource.data ?? []).filter(plan => plan.asset_id === id);
  const upcoming = today ? nextPlan(plans, id, today) : undefined;
  return <Panel title="Planes de mantenimiento asociados" subtitle="La programación y las tareas de este equipo.">
    <ResourceState {...resource} retry={resource.reload}>
      <div className="upcoming-banner"><Icon name="calendar"/><div><span>Próximo mantenimiento</span><strong>{!today ? 'Consultando fecha…' : upcoming ? dateLabel(upcoming.proxima_fecha) : 'Sin fecha futura programada'}</strong>{upcoming && <small>{upcoming.tarea}</small>}</div></div>
      {plans.length ? <div className="table-scroll"><table><thead><tr><th>Tarea</th><th>Frecuencia</th><th>Fecha programada</th><th>Estado</th></tr></thead><tbody>{plans.map(plan => <tr key={plan.id}><td><div className="table-title"><strong>{plan.tarea}</strong><small>{plan.tipo}</small></div></td><td>{plan.frecuencia || 'Sin frecuencia'}</td><td>{dateLabel(plan.proxima_fecha)}</td><td><Badge value={plan.estado}/></td></tr>)}</tbody></table></div> : <Empty title="Sin planes asociados" description="Los planes de este equipo aparecerán aquí cuando se registren."/>}
    </ResourceState>
  </Panel>;
}

export function WeeklySchedule({ plans, today }: { plans: MaintenancePlan[]; today: string }) {
  if (!today) return null;
  const range = weekBounds(today);
  const scheduled = plansForWeek(plans, today);
  return <Panel title="Agenda de la semana" subtitle={`${dateLabel(range.start)} — ${dateLabel(range.end)} · Lunes a domingo · El Salvador`} action={<Link href="/admin/mantenimientos" className="text-link">Ver planes <Icon name="arrow" size={15}/></Link>}>
    {scheduled.length ? <div className="weekly-agenda">{scheduled.map(plan => <Link key={plan.id} href={`/admin/activos/${encodeURIComponent(plan.asset_id)}`} className="agenda-item"><span className={`agenda-day ${plan.proxima_fecha === today ? 'today' : ''}`}><strong>{plan.proxima_fecha.slice(8)}</strong><small>{plan.proxima_fecha === today ? 'HOY' : new Intl.DateTimeFormat('es-SV', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${plan.proxima_fecha}T12:00:00Z`))}</small></span><div className="record-main"><strong>{plan.tarea}</strong><small>{assetLabel(plan.assets && (Array.isArray(plan.assets) ? plan.assets[0] : plan.assets))}</small></div><Badge value={plan.estado}/><Icon name="arrow" size={16}/></Link>)}</div> : <Empty title="Sin tareas pendientes para esta semana" description="Aquí se muestran los planes abiertos cuya fecha cae dentro de la semana actual."/>}
    <div className="panel-footnote">Incluye planes programados, próximos y vencidos de la semana. Los completados se excluyen.</div>
  </Panel>;
}

export function NextMaintenance({ plans, assetId, today }: { plans: MaintenancePlan[]; assetId: string; today: string }) {
  const plan = today ? nextPlan(plans, assetId, today) : undefined;
  return <span className="next-maintenance"><Icon name="calendar" size={14}/>{!today ? 'Consultando fecha…' : plan ? `Próx. ${dateLabel(plan.proxima_fecha)}` : 'Sin próxima fecha'}</span>;
}

export function planCount(plans: MaintenancePlan[], status: string) {
  return plans.filter(plan => normalized(plan.estado) === normalized(status)).length;
}
