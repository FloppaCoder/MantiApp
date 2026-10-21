import React, { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
