import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { isActive, isCompleted, OrderFilter, WorkOrder } from '../lib/domain';
import { colors, styles } from './ui';
import { OrdersList } from './orders/orders-list';

export interface OrdersPageProps { orders: WorkOrder[]; filter: OrderFilter; setFilter: (filter: OrderFilter) => void; onSelect: (order: WorkOrder) => void }
export function OrdersPage({ orders, filter, setFilter, onSelect }: OrdersPageProps) {
  const activeOrders = orders.filter(isActive);
  const completed = orders.filter(isCompleted);
  return <>
        <View style={styles.header}><Text style={styles.title}>Mis órdenes</Text><Text style={styles.small}>Órdenes de trabajo asignadas a ti</Text></View>
        <View style={styles.content}><View style={styles.row}>{(['Todas', 'Activas', 'Completadas'] as OrderFilter[]).map(value => <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }} style={[styles.filter, filter === value && { backgroundColor: colors.primary }]} onPress={() => setFilter(value)}><Text style={[styles.caption, filter === value && styles.white]}>{value}</Text></TouchableOpacity>)}</View><OrdersList orders={filter === 'Todas' ? orders : filter === 'Activas' ? activeOrders : completed} onSelect={onSelect} /></View>
      </>;
}
