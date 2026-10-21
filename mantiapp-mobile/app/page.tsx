import React from 'react';
import { SelectTechnicianPage } from '../components/technicians';
import type { MobileAppModel } from '../lib/use-mobile-app';

export default function Page({ model }: { model: MobileAppModel }) {
  return <SelectTechnicianPage model={model} />;
}
