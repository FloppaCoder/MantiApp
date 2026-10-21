import React from 'react';
import { HomePage } from '../../components/overview';
import type { MobileAppModel } from '../../lib/use-mobile-app';

export default function Page({ model }: { model: MobileAppModel }) {
  return <HomePage model={model} />;
}
