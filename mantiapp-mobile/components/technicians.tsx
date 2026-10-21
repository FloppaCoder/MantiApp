import React from 'react';
import type { MobileAppModel } from '../lib/use-mobile-app';
import { s } from '../app/globals';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Brand';
import { Button, Empty } from './ui';
import { initials } from '../lib/domain';

export function SelectTechnicianPage({ model }: { model: MobileAppModel }) {
  const { technicians, refresh, chooseTechnician } = model;
  return (<SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView contentContainerStyle={s.selection} keyboardShouldPersistTaps="handled">
        <Logo size={64} />
        <Text style={s.bigTitle}>Manti<Text style={s.brandBlue}>App</Text></Text>
        <Text style={s.centerText}>Tu trabajo de mantenimiento, en un solo lugar.</Text>
        <View style={s.selectionHeading}><Text style={s.sectionTitle}>Selecciona un técnico</Text>
          <Text style={s.muted}>Modo de prueba · selección sin autenticación</Text></View>
        {technicians.loading ? <ActivityIndicator color="#285cc4" /> : technicians.error ? (
          <View style={s.errorBox}><Text accessibilityRole="alert" style={s.errorText}>{technicians.error}</Text><Button label="Reintentar" onPress={refresh} /></View>
        ) : technicians.data?.length ? technicians.data.map(tech => (
          <Pressable key={tech.id} accessibilityRole="button" accessibilityLabel={'Seleccionar ' + tech.nombre}
            style={({ pressed }) => [s.card, s.row, pressed && s.dim]} onPress={() => chooseTechnician(tech.id)}>
            <View style={s.avatar}><Text style={s.avatarText}>{initials(tech.nombre)}</Text></View>
            <View style={[s.grow, s.orderDetails]}><Text style={s.cardTitle}>{tech.nombre}</Text><Text style={s.muted}>{tech.especialidad || 'Técnico'}</Text></View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        )) : <Empty text="No hay técnicos registrados en el API." />}
      </ScrollView>
    </SafeAreaView>);
}
