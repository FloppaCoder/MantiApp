import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { s } from '../app/globals';

export function Button({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondaryButton, (disabled || pressed) && s.dim]}>
    <Text style={[s.buttonText, secondary && s.secondaryButtonText]}>{label}</Text>
  </Pressable>;
}

export function Badge({ value }: { value: string }) {
  const danger = ['Crítica', 'Alta', 'Vencido'].includes(value);
  const success = value === 'Completada';
  const warning = value === 'Pendiente' || value === 'Media';
  return <View style={[s.badge, danger ? s.badgeDanger : success ? s.badgeSuccess : warning ? s.badgeWarning : s.badgeInfo]}>
    <Text style={[s.badgeText, { color: danger ? '#b42318' : success ? '#15803d' : warning ? '#92400e' : '#285cc4' }]}>{value}</Text>
  </View>;
}

export function Empty({ text }: { text: string }) {
  return <View style={s.empty}><Text style={s.muted}>{text}</Text></View>;
}

export function ResourceFeedback({ loading, error, onRetry }: {
  loading: boolean; error?: string; onRetry: () => void;
}) {
  return <>
    {loading && <View style={s.loading}><ActivityIndicator color="#285cc4" /><Text style={s.muted}>Cargando órdenes…</Text></View>}
    {error && <View style={s.errorBox}><Text accessibilityRole="alert" style={s.errorText}>{error}</Text><Button label="Volver a intentar" onPress={onRetry} /></View>}
  </>;
}
