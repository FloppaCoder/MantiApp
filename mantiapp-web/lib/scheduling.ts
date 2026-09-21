import { type MaintenancePlan, normalized } from './domain';

// One explicit business calendar, independent of the device time zone.
export const businessTimeZone = 'America/El_Salvador';
export function businessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: businessTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function calendarDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}
export function weekBounds(today: string) {
  if (!calendarDate(today)) throw new Error('Invalid calendar date');
  const monday = new Date(`${today}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}
export function isOpenPlan(plan: MaintenancePlan) {
  return ['programado', 'proximo', 'vencido'].includes(normalized(plan.estado));
}
export function plansForWeek(plans: MaintenancePlan[], today: string) {
  const { start, end } = weekBounds(today);
  return plans.filter(plan => isOpenPlan(plan) && calendarDate(plan.proxima_fecha) && plan.proxima_fecha >= start && plan.proxima_fecha <= end)
    .sort((a, b) => a.proxima_fecha.localeCompare(b.proxima_fecha));
}
export function nextPlan(plans: MaintenancePlan[], assetId: string, today: string) {
  return plans.filter(plan => plan.asset_id === assetId && isOpenPlan(plan) && calendarDate(plan.proxima_fecha) && plan.proxima_fecha >= today)
    .sort((a, b) => a.proxima_fecha.localeCompare(b.proxima_fecha))[0];
}
