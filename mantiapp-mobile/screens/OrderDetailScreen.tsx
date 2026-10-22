import React from 'react';
import { OrderDetailPage } from '../components/orders/order-detail';
import { OrderReportProps } from '../lib/use-order-report';

export default function OrderDetailScreen(props: OrderReportProps) {
  return <OrderDetailPage {...props} />;
}
