import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useResource } from '../lib/api-client';
import { technicianPaths } from '../lib/technician-api';
import { OrderFilter, Technician, TechnicianExtra, TechnicianTab, WorkOrder } from '../lib/domain';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ToolsScreen from '../screens/ToolsScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import { BottomNav } from './bottom-nav';
import { Button, colors, styles } from './ui';

export default function TechnicianShell({ user }: { user: User }) {
  const [tab, setTab] = useState<TechnicianTab>('Inicio');
  const [filter, setFilter] = useState<OrderFilter>('Activas');
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [extra, setExtra] = useState<TechnicianExtra | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [failure, setFailure] = useState('');
  const scroll = useRef<ScrollView>(null);
  const orders = useResource<WorkOrder[]>(technicianPaths.orders);
  const profile = useResource<Technician>(technicianPaths.profile);
  const refresh = () => { orders.reload(); profile.reload(); setFailure(''); };
  const navigate = (next: TechnicianTab, nextFilter: OrderFilter = 'Activas') => {
    setSelected(null); setExtra(null); setFilter(nextFilter); setTab(next);
  };

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [tab, extra]);
  useEffect(() => {
    if (selected) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (extra) { setExtra(null); return true; }
      if (tab !== 'Inicio') { setTab('Inicio'); return true; }
      return false;
    });
    return () => listener.remove();
  }, [selected, extra, tab]);

  const signOut = () => Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
      setSigningOut(true);
      try { const { error } = await supabase.auth.signOut(); if (error) throw error; }
      catch { setFailure('No se pudo cerrar la sesión. Inténtalo de nuevo.'); setSigningOut(false); }
    } },
  ]);

  if (selected) return <OrderDetailScreen key={selected.id} order={selected} userId={user.id}
    onBack={() => setSelected(null)} onOrders={() => navigate('Órdenes')}
    onUpdate={updated => { setSelected(updated); orders.update(items => items.map(item => item.id === updated.id ? updated : item)); }} />;

  const loading = orders.loading || profile.loading;
  const error = orders.error || profile.error || failure;
  const lightHeader = tab !== 'Órdenes' && !extra && !loading && !error;
  let content: React.ReactNode;
  if (loading) content = <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Cargando información…</Text></View>;
  else if (error || !profile.data || !orders.data) content = <View style={[styles.error, { margin: 20 }]}><Text accessibilityRole="alert" style={styles.errorText}>{error || 'No se pudo cargar la información.'}</Text><Button title="Reintentar" secondary onPress={refresh} /><Button title="Cerrar sesión" loading={signingOut} onPress={signOut} /></View>;
  else if (extra === 'Notificaciones') content = <NotificationsScreen orders={orders.data} onSelect={setSelected} onBack={() => setExtra(null)} />;
  else if (extra === 'Herramientas asignadas') content = <ToolsScreen onBack={() => setExtra(null)} />;
  else if (tab === 'Inicio') content = <HomeScreen orders={orders.data} profile={profile.data} onSelect={setSelected} onOrders={() => navigate('Órdenes')} onNotifications={() => setExtra('Notificaciones')} onLogout={signOut} signingOut={signingOut} />;
  else if (tab === 'Órdenes') content = <OrdersScreen orders={orders.data} filter={filter} setFilter={setFilter} onSelect={setSelected} />;
  else content = <ProfileScreen orders={orders.data} profile={profile.data} onHistory={() => navigate('Órdenes', 'Completadas')} onExtra={setExtra} onLogout={signOut} signingOut={signingOut} />;

  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
    <StatusBar barStyle={lightHeader ? 'light-content' : 'dark-content'} backgroundColor={lightHeader ? colors.primary : colors.card} />
    <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}>
      {content}
    </ScrollView>
    <BottomNav selected={extra ? null : tab} onNavigate={navigate} />
  </SafeAreaView>;
}
