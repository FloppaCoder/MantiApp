import React from 'react';
import { View } from 'react-native';
import { isActive, normalized, WorkOrder } from '../lib/domain';
import { styles } from './ui';
import { PageHeading } from './page-heading';
import { OrdersList } from './orders/orders-list';

export interface NotificationsPageProps { orders: WorkOrder[]; onSelect: (order: WorkOrder) => void; onBack: () => void }
export function NotificationsPage({ orders, onSelect, onBack }: NotificationsPageProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const visible = orders.filter(order => isActive(order) && (
    normalized(order.prioridad) === 'critica' || Boolean(order.fecha_vencimiento && order.fecha_vencimiento.slice(0, 10) <= today)
  ));
  return <>
    <PageHeading title="Notificaciones" onBack={onBack} />
    <View style={styles.content}><OrdersList orders={visible} onSelect={onSelect} emptyMessage="No tienes órdenes críticas ni vencimientos pendientes." /></View>
  </>;
}
