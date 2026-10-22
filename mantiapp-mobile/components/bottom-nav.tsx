import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TechnicianTab } from '../lib/domain';
import { colors, Icon, styles } from './ui';

const tabs = [
  { label: 'Inicio', icon: 'home-outline' },
  { label: 'Órdenes', icon: 'clipboard-outline' },
  { label: 'Perfil', icon: 'person-outline' },
] as const;

export function BottomNav({ selected, onNavigate }: {
  selected: TechnicianTab | null;
  onNavigate: (tab: TechnicianTab) => void;
}) {
  return <View accessibilityRole="tablist" style={[styles.row, {
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6,
  }]}>
    {tabs.map(({ label, icon }) => <TouchableOpacity key={label} accessibilityRole="tab"
      accessibilityState={{ selected: selected === label }} onPress={() => onNavigate(label)}
      style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12 }}>
      <Icon name={icon} color={selected === label ? colors.primary : colors.muted} />
      <Text style={[styles.small, selected === label && { color: colors.primary, fontWeight: '600' }]}>{label}</Text>
    </TouchableOpacity>)}
  </View>;
}
