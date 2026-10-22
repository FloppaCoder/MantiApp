import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { initials as getInitials, isActive, isCompleted, Technician, TechnicianExtra, WorkOrder } from '../lib/domain';
import { Button, colors, Icon, styles } from './ui';

export interface ProfilePageProps { orders: WorkOrder[]; profile: Technician; onHistory: () => void; onExtra: (extra: TechnicianExtra) => void; onLogout: () => void; signingOut: boolean }
export function ProfilePage({ orders, profile, onHistory, onExtra, onLogout, signingOut }: ProfilePageProps) {
  const activeOrders = orders.filter(isActive);
  const completed = orders.filter(isCompleted);
  const initials = getInitials(profile.nombre);
  return <>
        <View style={[styles.hero, { alignItems: 'center', paddingVertical: 30, gap: 12 }]}><View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#ffffff33' }]}><Text style={[styles.white, { fontSize: 24, fontWeight: '600' }]}>{initials}</Text></View><Text style={[styles.title, styles.white]}>{profile.nombre}</Text><Text style={styles.heroMuted}>{profile.especialidad}</Text></View>
        <View style={styles.content}>
          <View style={styles.stats}><View style={[styles.card, { flex: 1, alignItems: 'center' }]}><Text style={styles.number}>{activeOrders.length}</Text><Text style={styles.small}>Órdenes activas</Text></View><View style={[styles.card, { flex: 1, alignItems: 'center' }]}><Text style={[styles.number, { color: colors.green }]}>{completed.length}</Text><Text style={styles.small}>Completadas</Text></View></View>
          <View style={styles.card}><View style={styles.row}><Icon name="mail-outline" /><Text selectable style={[styles.body, { flex: 1 }]}>{profile.email}</Text></View><View style={{ height: 1, backgroundColor: colors.border }} /><View style={styles.row}><Icon name="call-outline" /><Text selectable style={styles.body}>{profile.telefono}</Text></View></View>
          <View style={[styles.card, { paddingVertical: 0, gap: 0 }]}>{(['Historial de trabajos', 'Herramientas asignadas', 'Notificaciones'] as const).map((label, i) => <TouchableOpacity accessibilityRole="button" key={label} onPress={() => label === 'Historial de trabajos' ? onHistory() : onExtra(label)} style={[styles.spread, { minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }]}><View style={styles.row}><Icon name={i === 0 ? 'clipboard-outline' : i === 1 ? 'construct-outline' : 'notifications-outline'} /><Text style={styles.body}>{label}</Text></View><Icon name="chevron-forward" size={16} /></TouchableOpacity>)}</View>
          <Button secondary title="Cerrar sesión" loading={signingOut} onPress={onLogout} />
        </View></>;
}
