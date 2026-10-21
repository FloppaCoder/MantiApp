import React from 'react';
import type { MobileAppModel } from '../lib/use-mobile-app';
import { s } from '../app/globals';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Logo } from './Brand';
import { OrderCard } from './orders';
import { Button, Empty, ResourceFeedback } from './ui';
import { initials } from '../lib/domain';

export function HomePage({ model }: { model: MobileAppModel }) {
  const { currentTech, orders, technicians, refresh, active, completed, openOrder, showOrders } = model;
  return <ScrollView contentContainerStyle={s.scrollContent}
    refreshControl={<RefreshControl refreshing={orders.loading || technicians.loading} onRefresh={refresh} />}>

        <View style={s.hero}>
          <View style={s.row}><View style={[s.avatar, s.heroAvatar]}><Text style={s.heroAvatarText}>{initials(currentTech?.nombre ?? '')}</Text></View>
            <View style={[s.grow, s.orderDetails]}><Text style={s.heroHint}>Buen día,</Text><Text style={s.heroName}>{currentTech?.nombre ?? 'Cargando técnico…'}</Text></View>
            <Logo size={36} />
          </View>
          <View style={s.stats}>
            <View style={s.heroStat}><Text style={s.heroHint}>Órdenes activas</Text><Text style={s.heroNumber}>{orders.data ? active.length : '—'}</Text></View>
            <View style={s.heroStat}><Text style={s.heroHint}>Completadas totales</Text><Text style={s.heroNumber}>{orders.data ? completed.length : '—'}</Text></View>
          </View>
        </View>
        <View style={s.content}>
          <ResourceFeedback loading={orders.loading} error={orders.error} onRetry={refresh} />
          <View style={s.between}><Text style={s.sectionTitle}>Órdenes asignadas</Text>
            <Pressable accessibilityRole="button" onPress={() => showOrders('Activas')}><Text style={s.link}>Ver todas</Text></Pressable></View>
          {active.slice(0, 5).map(order => <OrderCard key={order.id} order={order} onPress={() => openOrder(order)} />)}
          {!orders.loading && !orders.error && active.length === 0 && <Empty text="No tienes órdenes activas." />}
          {completed.length > 0 && <><Text style={s.sectionTitle}>Órdenes completadas</Text>
            {completed.slice(0, 3).map(order => <OrderCard key={order.id} order={order} onPress={() => openOrder(order)} />)}</>}
        </View>

  </ScrollView>;
}

export function ProfilePage({ model }: { model: MobileAppModel }) {
  const { currentTech, orders, technicians, refresh, active, completed, saving, chooseTechnician, showOrders } = model;
  return <ScrollView contentContainerStyle={s.scrollContent}
    refreshControl={<RefreshControl refreshing={orders.loading || technicians.loading} onRefresh={refresh} />}>
        <View style={[s.hero, s.profileHero]}>
          <View style={[s.avatar, s.largeAvatar]}><Text style={s.largeInitials}>{initials(currentTech?.nombre ?? '')}</Text></View>
          <Text style={s.heroName}>{currentTech?.nombre ?? 'Cargando técnico…'}</Text>
          <Text style={s.heroHint}>{currentTech?.especialidad || 'Técnico'}</Text>
        </View>
        <View style={s.content}>
          <ResourceFeedback loading={orders.loading} error={orders.error} onRetry={refresh} />
          <View style={s.stats}>
            <View style={[s.card, s.grow, s.statCard]}><Text style={s.statNumber}>{orders.data ? active.length : '—'}</Text><Text style={s.small}>Órdenes activas</Text></View>
            <View style={[s.card, s.grow, s.statCard]}><Text style={[s.statNumber, s.successText]}>{orders.data ? completed.length : '—'}</Text><Text style={s.small}>Completadas totales</Text></View>
          </View>
          <View style={s.card}><Text style={s.label}>Correo electrónico</Text><Text selectable style={s.body}>{currentTech?.email || 'Sin registrar'}</Text>
            <View style={s.divider} /><Text style={s.label}>Teléfono</Text><Text selectable style={s.body}>{currentTech?.telefono || 'Sin registrar'}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => showOrders('Completadas')} style={[s.card, s.between]}>
            <Text style={s.body}>Historial de trabajos</Text><Text style={s.chevron}>›</Text>
          </Pressable>
          <View style={s.card}><Text style={s.cardTitle}>Próximamente</Text><Text style={s.muted}>Herramientas asignadas y notificaciones personales.</Text></View>
          <Button label="Cambiar técnico de prueba" secondary disabled={saving} onPress={() => chooseTechnician('')} />
          <Text style={s.centerText}>Modo de prueba · sin sesión autenticada</Text>
        </View>

  </ScrollView>;
}
