import React from 'react';
import { ProfilePage } from '../../../components/overview';
import type { MobileAppModel } from '../../../lib/use-mobile-app';

export default function Page({ model }: { model: MobileAppModel }) {
  return <ProfilePage model={model} />;
}
