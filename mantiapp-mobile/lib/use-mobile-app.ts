import { useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { requestJson, useResource } from './api-client';
import {
  canTransition, filterOrders, readOrder, readOrders, readTechnicians, relation,
  type OrderFilter, type OrderState, type Tab, type WorkOrder,
} from './domain';

export function useMobileApp(baseUrl: string) {
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('inicio');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>('Activas');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState('');
  const [notice, setNotice] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const mutation = useRef<AbortController | null>(null);
  const technicians = useResource(baseUrl, '/api/tecnicos', readTechnicians, revision);
  const currentTech = technicians.data?.find(tech => tech.id === technicianId);
  const orders = useResource(baseUrl, technicianId
    ? '/api/ordenes?tecnico_id=' + encodeURIComponent(technicianId) : null, readOrders, revision);
  const myOrders = (orders.data ?? []).filter(order => order.tecnico_id === technicianId);
  const selected = myOrders.find(order => order.id === selectedId);
  const active = filterOrders(myOrders, 'Activas');
  const completed = filterOrders(myOrders, 'Completadas');
  const busy = orders.loading || saving;
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visible = filterOrders(myOrders, filter).filter(order => [
    order.codigo_ot, order.titulo, order.descripcion, relation(order.assets)?.nombre,
  ].some(value => value?.toLocaleLowerCase().includes(normalizedSearch)));
  const selectedTasks = Array.isArray(selected?.checklist) ? selected.checklist : [];
  const verified = selected ? checks[selected.id] ?? selectedTasks.map(task => task.completada) : [];
  const allChecked = verified.every(Boolean);
  const progress = selectedTasks.length ? Math.round(verified.filter(Boolean).length / selectedTasks.length * 100) : 0;

  useEffect(() => () => mutation.current?.abort(), []);
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (saving) return true;
      if (selectedId) { setSelectedId(null); setWriteError(''); setNotice(''); return true; }
      if (tab !== 'inicio') { setTab('inicio'); return true; }
      return false;
    });
    return () => handler.remove();
  }, [selectedId, tab, saving]);

  function navigate(next: Tab) {
    setTab(next); setSelectedId(null); setWriteError(''); setNotice('');
  }
  function openOrder(order: WorkOrder) {
    setSelectedId(order.id); setWriteError(''); setNotice('');
  }
  function chooseTechnician(id: string) {
    setTechnicianId(id); setSelectedId(null); setChecks({}); setNotice(''); setWriteError(''); setTab('inicio');
  }
  async function changeState(next: OrderState) {
    if (!selected || mutation.current || saving || orders.loading || !canTransition(selected.estado, next)) return;
    if (next === 'Completada' && !allChecked) return;
    const order = selected;
    const controller = new AbortController();
    mutation.current = controller;
    setSaving(true); setWriteError(''); setNotice('');
    try {
      const updated = readOrder(await requestJson(baseUrl, '/api/ordenes/' + encodeURIComponent(order.id) + '/estado', {
        method: 'PATCH', body: JSON.stringify({ nuevo_estado: next }), signal: controller.signal,
      }));
      if (updated.id !== order.id || updated.estado !== next) throw new Error('El API no confirmó el cambio solicitado. Recarga para comprobar el estado.');
      if (controller.signal.aborted) return;
      orders.update(data => data.map(item => item.id === updated.id ? updated : item));
      setNotice(next === 'Completada' ? 'Orden completada y guardada en el API.' : 'Trabajo iniciado. El estado se guardó correctamente.');
    } catch (error) {
      if (!controller.signal.aborted) setWriteError(error instanceof Error ? error.message : 'No se pudo guardar el cambio.');
    } finally {
      if (!controller.signal.aborted) setSaving(false);
      mutation.current = null;
    }
  }
  function toggleTask(index: number) {
    if (!selected || selected.estado !== 'En progreso' || busy) return;
    setChecks(previous => ({
      ...previous,
      [selected.id]: (previous[selected.id] ?? selectedTasks.map(task => task.completada))
        .map((value, taskIndex) => taskIndex === index ? !value : value),
    }));
  }
  const refresh = () => { if (!saving) { setChecks({}); setRevision(value => value + 1); } };

  function back() { setSelectedId(null); setWriteError(''); setNotice(''); }
  function showOrders(nextFilter: OrderFilter) {
    setFilter(nextFilter); setSearch(''); navigate('ordenes');
  }
  return {
    technicianId, tab, selectedId, filter, search, saving, writeError, notice,
    technicians, currentTech, orders, selected, active, completed, busy, visible,
    selectedTasks, verified, allChecked, progress, navigate, openOrder, chooseTechnician,
    changeState, toggleTask, refresh, back, showOrders, setFilter, setSearch,
  };
}

export type MobileAppModel = ReturnType<typeof useMobileApp>;
