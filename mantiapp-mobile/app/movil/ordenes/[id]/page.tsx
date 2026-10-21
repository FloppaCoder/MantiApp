import React from 'react';
import { OrderDetailPage } from '../../../../components/orders';
import type { MobileAppModel } from '../../../../lib/use-mobile-app';

export default function Page({ model }: { model: MobileAppModel }) {
  return <OrderDetailPage model={model} />;
}
