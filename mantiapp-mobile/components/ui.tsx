import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { normalized } from '../lib/domain';
import { colors, styles } from '../lib/theme';
export { colors, styles } from '../lib/theme';

export function Icon({ name, color = colors.muted, size = 20 }: { name: React.ComponentProps<typeof Ionicons>['name']; color?: string; size?: number }) {
  return <Ionicons name={name} color={color} size={size} accessible={false} />;
}
export function Button({ title, onPress, disabled, loading, secondary, success }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; secondary?: boolean; success?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress} style={[styles.button, secondary && styles.secondary, success && { backgroundColor: colors.green }, (disabled || loading) && { opacity: 0.45 }]}>
    {loading ? <ActivityIndicator color={secondary ? colors.primary : '#fff'} /> : <Text style={[styles.buttonText, secondary && { color: colors.primary }]}>{title}</Text>}
  </TouchableOpacity>;
}
export function Badge({ value }: { value: string }) {
  const n = normalized(value);
  const [foreground, background] = n === 'critica' ? ['#b91c1c', '#fee2e2'] : n === 'alta' ? ['#c2410c', '#ffedd5'] : n === 'completada' ? ['#15803d', '#dcfce7'] : ['en progreso', 'asignada'].includes(n) ? ['#1d4ed8', '#dbeafe'] : ['#64748b', '#f1f5f9'];
  return <View style={[styles.badge, { backgroundColor: background }]}><Text style={{ color: foreground, fontSize: 11, fontWeight: '600' }}>{value}</Text></View>;
}
export function Empty({ title, message, icon = 'clipboard-outline' }: { title: string; message: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return <View style={styles.empty}><Icon name={icon} size={32} /><Text style={styles.cardTitle}>{title}</Text><Text style={[styles.muted, { textAlign: 'center' }]}>{message}</Text></View>;
}
