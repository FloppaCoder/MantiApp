import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ChecklistItem, defaultChecklist, isCompleted, normalized, WorkOrder } from './domain';
import { saveOrder } from './technician-api';

interface Draft { checklist: ChecklistItem[]; observations: string; photos: string[] }
export interface OrderReportProps { order: WorkOrder; userId: string; onBack: () => void; onOrders: () => void; onUpdate: (order: WorkOrder) => void }
export function useOrderReport({ order, userId, onBack, onUpdate }: OrderReportProps) {
  const initial = Array.isArray(order.checklist) && order.checklist.length ? order.checklist : defaultChecklist;
  const [draft, setDraft] = useState<Draft>({ checklist: initial, observations: '', photos: [] });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');
  const latest = useRef(draft);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const busy = useRef(false);
  const draftKey = `mantiapp:report:${userId}:${order.id}`;
  const persist = (value: Draft) => {
    const write = queue.current.catch(() => undefined).then(() => AsyncStorage.setItem(draftKey, JSON.stringify(value)));
    queue.current = write;
    return write;
  };
  const change = (patch: Partial<Draft>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next; setDraft(next);
    setLocalError('');
    void persist(next).catch(() => setLocalError('No se pudo guardar el borrador. Reintenta antes de salir.'));
  };
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(draftKey).then(value => {
      if (!active || !value) return;
      const stored = JSON.parse(value) as Partial<Draft>;
      const checklist = initial.map(item => ({ ...item, completada: isCompleted(order) ? item.completada : stored.checklist?.find(t => t.tarea === item.tarea)?.completada ?? item.completada }));
      const restored = { checklist, observations: typeof stored.observations === 'string' ? stored.observations : '', photos: Array.isArray(stored.photos) ? stored.photos.filter(p => typeof p === 'string') : [] };
      latest.current = restored; setDraft(restored);
    }).catch(() => { if (active) setLocalError('No se pudo recuperar el borrador local.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
    // A draft is loaded once per order. Server updates must not erase local edits.
  }, [draftKey]);
  const leave = async (destination: () => void) => {
    if (busy.current || picking) return;
    try { if (ready) await persist(latest.current); destination(); }
    catch { setLocalError('No se pudo guardar el borrador. Reintenta antes de salir.'); }
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { void leave(onBack); return true; });
    return () => listener.remove();
  });

  const complete = isCompleted(order);
  const inProgress = normalized(order.estado) === 'en progreso';
  const checked = draft.checklist.filter(t => t.completada).length;
  const allChecked = draft.checklist.length > 0 && checked === draft.checklist.length;
  const progress = Math.round(checked / Math.max(draft.checklist.length, 1) * 100);
  const update = async (state: string) => {
    if (busy.current || (state === 'Completada' && !allChecked)) return;
    busy.current = true; setSaving(true); setError('');
    try {
      await persist(latest.current);
      setLocalError('');
      const result = await saveOrder(order, state, latest.current.checklist);
      onUpdate(result);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo guardar la orden. Tu borrador se conserva en este dispositivo.'); }
    finally { busy.current = false; setSaving(false); }
  };
  const addPhoto = async () => {
    if (picking || saving || draft.photos.length >= 6) return;
    setPicking(true); setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled || !result.assets[0]) return;
      if (!FileSystem.documentDirectory) throw new Error('Almacenamiento no disponible');
      const directory = `${FileSystem.documentDirectory}reports/${userId}/${order.id}/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const uri = `${directory}${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: uri });
      change({ photos: [...latest.current.photos, uri] });
    } catch { setError('No se pudo agregar la foto. Verifica el acceso a tu galería y el espacio disponible.'); }
    finally { setPicking(false); }
  };
  const removePhoto = (uri: string) => Alert.alert('Eliminar foto', '¿Quitar esta foto del reporte local?', [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => change({ photos: latest.current.photos.filter(photo => photo !== uri) }) },
  ]);

  const toggleTask = (index: number) => change({
    checklist: latest.current.checklist.map((item, i) => i === index ? { ...item, completada: !item.completada } : item),
  });
  const retryDraft = () => {
    void persist(latest.current).then(() => setLocalError('')).catch(() => setLocalError('No se pudo guardar el borrador.'));
  };
  return { draft, ready, saving, picking, error, localError, retryDraft, toggleTask, change, leave, complete, inProgress, allChecked, progress, update, addPhoto, removePhoto };
}
