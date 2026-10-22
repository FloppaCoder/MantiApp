import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon, styles } from './ui';

export function PageHeading({ title, onBack }: { title: string; onBack?: () => void }) {
  return <View style={[styles.header, styles.row]}>
    {onBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.iconButton}><Icon name="arrow-back" /></TouchableOpacity>}
    <Text style={[styles.title, { flex: 1 }]}>{title}</Text>
  </View>;
}
