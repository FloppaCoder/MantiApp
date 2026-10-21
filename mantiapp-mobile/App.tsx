import 'react-native-url-polyfill/auto';
import React from 'react';
import RootLayout from './app/layout';
import ConfigurationPage from './app/configuracion/page';
import MobileShell from './components/mobile-shell';
import { normalizeBaseUrl } from './lib/domain';

export default function App() {
  let baseUrl: string;
  try {
    baseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? '');
  } catch {
    return <RootLayout><ConfigurationPage /></RootLayout>;
  }
  return <RootLayout><MobileShell baseUrl={baseUrl} /></RootLayout>;
}
