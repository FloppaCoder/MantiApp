import React from 'react';
import { View } from 'react-native';
import { WorkOrder } from '../../lib/domain';
import { Empty, styles } from '../ui';
import { OrderCard } from './order-card';

export function OrdersList({ orders, onSelect, emptyMessage = 'No hay órdenes en esta categoría.' }: {
  orders: WorkOrder[];
  onSelect: (order: WorkOrder) => void;
  emptyMessage?: string;
}) {
  return <View style={styles.section}>
    {orders.length
      ? orders.map(order => <OrderCard key={order.id} order={order} onPress={() => onSelect(order)} />)
      : <Empty title="Sin órdenes" message={emptyMessage} />}
  </View>;
}
