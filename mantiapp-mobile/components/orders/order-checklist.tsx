import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChecklistItem } from '../../lib/domain';
import { colors, Icon, styles } from '../ui';
export function OrderChecklist({ tasks, complete, saving, progress, onToggle }: { tasks: ChecklistItem[]; complete: boolean; saving: boolean; progress: number; onToggle: (index: number) => void }) {
  return <View style={styles.card}><View style={styles.spread}><View style={styles.row}><Icon name="clipboard-outline" color={colors.primary} /><Text style={styles.cardTitle}>Checklist de tareas</Text></View><Text style={styles.caption}>{progress}%</Text></View><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }} style={{ height: 6, backgroundColor: '#edf2f7', borderRadius: 6 }}><View style={{ height: 6, width: `${progress}%`, borderRadius: 6, backgroundColor: colors.primary }} /></View>
            {tasks.map((item, index) => <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: item.completada, disabled: complete || saving }} disabled={complete || saving} key={`${index}-${item.tarea}`} onPress={() => onToggle(index)} style={[styles.row, { minHeight: 44 }]}><Icon name={item.completada ? 'checkmark-circle' : 'square-outline'} color={item.completada ? colors.green : colors.muted} /><Text style={[styles.body, { flex: 1 }, item.completada && { textDecorationLine: 'line-through', color: colors.muted }]}>{item.tarea}</Text></TouchableOpacity>)}
          </View>;
}
