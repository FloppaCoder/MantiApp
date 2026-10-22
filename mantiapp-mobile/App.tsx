import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabaseClient';
import { useSession } from './lib/use-session';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TechnicianShell from './components/technician-shell';
import { Button, styles, colors } from './components/ui';

export default function App() {
  const [register, setRegister] = useState(false);
  const { session, ready, authorized, error, setError, retry } = useSession();
  return <SafeAreaProvider>
    <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
    {!ready ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Cargando tu sesión…</Text></View>
      : error ? <View style={styles.center}><Text accessibilityRole="alert" style={styles.body}>{error}</Text><Button title="Reintentar" onPress={retry} />{session && <Button title="Volver al acceso" secondary onPress={async () => { const result = await supabase.auth.signOut(); if (result.error) setError('No se pudo cerrar la sesión. Reintenta.'); }} />}</View>
      : session && authorized ? <TechnicianShell key={session.user.id} user={session.user} />
      : register ? <RegisterScreen onNavigateToLogin={() => setRegister(false)} />
      : <LoginScreen onNavigateToRegister={() => setRegister(true)} onLoginSuccess={() => setRegister(false)} />}
  </SafeAreaProvider>;
}
