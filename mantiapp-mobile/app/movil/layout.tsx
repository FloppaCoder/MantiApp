import React, { type ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Brand from '../../components/Brand';
import type { MobileAppModel } from '../../lib/use-mobile-app';
import { s } from '../globals';

export default function MobileLayout({ children, model }: { children: ReactNode; model: MobileAppModel }) {
  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
    {children}
    <Brand active={model.tab} onNavigate={model.navigate} disabled={model.saving} />
  </SafeAreaView>;
}
