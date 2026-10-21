import React from 'react';
import { OrdersPage } from '../../../components/orders';
import type { MobileAppModel } from '../../../lib/use-mobile-app';

export default function Page({ model }: { model: MobileAppModel }) {
  return <OrdersPage model={model} />;
}
