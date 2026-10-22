import React from 'react';
import { OrdersPage, OrdersPageProps } from '../components/orders';

export default function OrdersScreen(props: OrdersPageProps) {
  return <OrdersPage {...props} />;
}
