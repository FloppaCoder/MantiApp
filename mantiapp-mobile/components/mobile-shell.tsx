import React from 'react';
import { useMobileApp } from '../lib/use-mobile-app';
import SelectTechnicianPage from '../app/page';
import MobileLayout from '../app/movil/layout';
import HomePage from '../app/movil/page';
import OrdersPage from '../app/movil/ordenes/page';
import OrderDetailPage from '../app/movil/ordenes/[id]/page';
import ProfilePage from '../app/movil/perfil/page';

// Expo conserva su entrada index.ts; aquí se seleccionan explícitamente las páginas.
export default function MobileShell({ baseUrl }: { baseUrl: string }) {
  const model = useMobileApp(baseUrl);
  if (!model.technicianId || (!model.currentTech && !model.technicians.loading)) {
    return <SelectTechnicianPage model={model} />;
  }
  return <MobileLayout model={model}>
    {model.selectedId ? <OrderDetailPage model={model} />
      : model.tab === 'ordenes' ? <OrdersPage model={model} />
      : model.tab === 'perfil' ? <ProfilePage model={model} />
      : <HomePage model={model} />}
  </MobileLayout>;
}
