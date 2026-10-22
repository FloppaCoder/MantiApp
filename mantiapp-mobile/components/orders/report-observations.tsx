import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors, styles } from '../ui';
export function ReportObservations({ draft, complete, saving, change }: { draft: { observations: string }; complete: boolean; saving: boolean; change: (patch: { observations: string }) => void }) {
  return <View style={styles.section}><Text style={styles.cardTitle}>Observaciones</Text><TextInput accessibilityLabel="Observaciones del trabajo" editable={!complete && !saving} multiline value={draft.observations} onChangeText={observations => change({ observations })} maxLength={5000} style={styles.input} placeholder="Describe el trabajo realizado, repuestos usados y hallazgos…" placeholderTextColor={colors.muted} /></View>;
}
