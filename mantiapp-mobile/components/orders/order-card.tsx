import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { WorkOrder, dateLabel } from '../../lib/domain';
import { Badge, Icon, styles } from '../ui';

export function OrderCard({ order, onPress }: { order: WorkOrder; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${order.codigo_ot}, ${order.assets?.nombre ?? order.titulo}, ${order.estado}`} onPress={onPress} style={[styles.card, styles.row]}>
    <View style={{ flex: 1, gap: 7 }}>
      <View style={styles.row}><Text style={styles.caption}>{order.codigo_ot}</Text><Badge value={order.prioridad} /></View>
      <Text style={styles.cardTitle}>{order.assets?.nombre ?? order.titulo}</Text>
      <Text numberOfLines={2} style={styles.muted}>{order.descripcion}</Text>
      <View style={styles.row}><Icon name="location-outline" size={14} /><Text style={[styles.small, { flex: 1 }]}>{order.assets?.ubicacion ?? 'Ubicación no registrada'}</Text></View>
      <Text style={styles.small}>Vence: {dateLabel(order.fecha_vencimiento)}</Text>
      <View style={styles.row}><Badge value={order.estado} /></View>
    </View><Icon name="chevron-forward" />
  </TouchableOpacity>;
}
