import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { initials as getInitials, isActive, isCompleted, Technician, WorkOrder } from '../lib/domain';
import { Icon, styles } from './ui';
import { OrdersList } from './orders/orders-list';

export interface HomePageProps { orders: WorkOrder[]; profile: Technician; onSelect: (order: WorkOrder) => void; onOrders: () => void; onNotifications: () => void; onLogout: () => void; signingOut: boolean }
export function HomePage({ orders, profile, onSelect, onOrders, onNotifications, onLogout, signingOut }: HomePageProps) {
  const activeOrders = orders.filter(isActive);
  const completed = orders.filter(isCompleted);
  const initials = getInitials(profile.nombre);
  return <>
        <View style={styles.hero}>
          <View style={styles.spread}><View style={[styles.row, { flex: 1 }]}><View style={styles.avatar}><Text style={[styles.white, { fontWeight: '700' }]}>{initials}</Text></View><View style={{ flex: 1 }}><Text style={styles.heroMuted}>Buen día,</Text><Text style={[styles.cardTitle, styles.white]}>{profile.nombre}</Text></View></View>
            <View style={styles.row}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Notificaciones" onPress={onNotifications} style={styles.iconButton}><Icon name="notifications-outline" color="#fff" /></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={onLogout} disabled={signingOut} style={styles.iconButton}><Icon name="log-out-outline" color="#fff" /></TouchableOpacity></View>
          </View>
          <View style={styles.stats}><View style={styles.stat}><Icon name="time-outline" color="#dbeafe" /><Text style={[styles.number, styles.white]}>{activeOrders.length}</Text><Text style={styles.heroMuted}>Órdenes activas</Text></View><View style={styles.stat}><Icon name="checkmark-circle-outline" color="#dbeafe" /><Text style={[styles.number, styles.white]}>{completed.length}</Text><Text style={styles.heroMuted}>Órdenes completadas</Text></View></View>
        </View>
        <View style={styles.content}><View style={styles.spread}><Text style={styles.cardTitle}>Órdenes asignadas</Text><TouchableOpacity accessibilityRole="button" onPress={onOrders} style={{ paddingVertical: 10 }}><Text style={styles.link}>Ver todas</Text></TouchableOpacity></View><OrdersList orders={activeOrders} onSelect={onSelect} emptyMessage="No tienes órdenes activas. Las nuevas asignaciones aparecerán aquí." />{completed.length > 0 && <><Text style={styles.cardTitle}>Completadas recientemente</Text><OrdersList orders={completed.slice(0, 3)} onSelect={onSelect} /></>}</View>
      </>;
}
