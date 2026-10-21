import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tab } from '../lib/domain';

const items: { key: Tab; label: string }[] = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'ordenes', label: 'Órdenes' },
  { key: 'perfil', label: 'Perfil' },
];

export function Logo({ size = 40 }: { size?: number }) {
  return <Image
    accessible
    accessibilityLabel="Logo de MantiApp"
    source={require('../assets/logo.png')}
    resizeMode="contain"
    style={{ width: size, height: size, borderRadius: Math.round(size * 0.2), alignSelf: 'center' }}
  />;
}

// Navegación inferior compartida por las pantallas del prototipo.
export default function Brand({ active, onNavigate, disabled = false }: {
  active: Tab; onNavigate: (tab: Tab) => void; disabled?: boolean;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {items.map(item => {
        const selected = active === item.key;
        const color = selected ? '#285cc4' : '#697586';
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onNavigate(item.key)}
            style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && styles.pressed]}
          >
            <View accessible={false} style={styles.icon}>
              {item.key === 'inicio' ? <>
                <View style={[styles.roof, { borderColor: color }]} />
                <View style={[styles.house, { borderColor: color }]} />
              </> : item.key === 'ordenes' ? (
                <View style={[styles.clipboard, { borderColor: color }]}>
                  <View style={[styles.line, { backgroundColor: color }]} />
                  <View style={[styles.line, { backgroundColor: color }]} />
                  <View style={[styles.line, { backgroundColor: color }]} />
                </View>
              ) : <>
                <View style={[styles.head, { borderColor: color }]} />
                <View style={[styles.shoulders, { borderColor: color }]} />
              </>}
            </View>
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e4e8ef' },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12 },
  selected: { backgroundColor: '#eff4ff' },
  pressed: { opacity: 0.65 },
  label: { fontSize: 12, fontWeight: '600' },
  icon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  roof: { position: 'absolute', top: 3, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2, transform: [{ rotate: '45deg' }] },
  house: { position: 'absolute', bottom: 1, width: 16, height: 13, borderWidth: 2, borderTopWidth: 0, borderRadius: 2 },
  clipboard: { width: 17, height: 21, borderWidth: 2, borderRadius: 3, padding: 3, justifyContent: 'space-around' },
  line: { height: 1.5, width: 7 },
  head: { position: 'absolute', top: 1, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  shoulders: { position: 'absolute', bottom: 1, width: 20, height: 11, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 2 },
});
