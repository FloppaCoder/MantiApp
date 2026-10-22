import React from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dateLabel, isActive } from '../../lib/domain';
import { OrderReportProps, useOrderReport } from '../../lib/use-order-report';
import { Badge, Button, colors, Icon, styles } from '../ui';
import { OrderChecklist } from './order-checklist';
import { PhotoEvidence } from './photo-evidence';
import { ReportObservations } from './report-observations';

export function OrderDetailPage(props: OrderReportProps) {
  const { order, onBack, onOrders } = props;
  const { draft, ready, saving, picking, error, localError, retryDraft, toggleTask, change, leave, complete, inProgress, allChecked, progress, update, addPhoto, removePhoto } = useOrderReport(props);
  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
    <View style={[styles.header, styles.row]}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver a órdenes" disabled={saving || picking} style={styles.iconButton} onPress={() => { void leave(onBack); }}><Icon name="arrow-back" /></TouchableOpacity><View style={{ flex: 1 }}><Text style={styles.small}>{order.codigo_ot}</Text><Text style={styles.cardTitle}>{order.assets?.nombre ?? order.titulo}</Text></View><Badge value={order.estado} /></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {!ready ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {complete && <View style={[styles.card, { alignItems: 'center', padding: 26 }]}><Icon name="checkmark-circle-outline" color={colors.green} size={64} /><Text style={styles.title}>Orden completada</Text><Text style={[styles.muted, { textAlign: 'center' }]}>La orden {order.codigo_ot} está registrada como completada.</Text><Button title="Volver a mis órdenes" onPress={() => { void leave(onOrders); }} /></View>}
        <View style={[styles.row, { flexWrap: 'wrap' }]}><Badge value={order.prioridad} />{order.tipo_mantenimiento && <Badge value={order.tipo_mantenimiento} />}<Text style={styles.small}>Vence: {dateLabel(order.fecha_vencimiento)}</Text></View>
        <View style={styles.card}><View style={styles.row}><Icon name="location-outline" size={16} /><Text style={[styles.small, { flex: 1 }]}>{order.assets?.ubicacion ?? 'Ubicación no registrada'}</Text></View><Text style={styles.cardTitle}>Descripción</Text><Text style={styles.muted}>{order.descripcion}</Text></View>
        <View style={[styles.card, styles.row, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', alignItems: 'flex-start' }]}><Icon name="information-circle-outline" color={colors.primary} /><View style={{ flex: 1, gap: 6 }}><Text style={[styles.cardTitle, { color: colors.primary }]}>Instrucciones de seguridad</Text><Text style={styles.muted}>{order.instrucciones_seguridad || 'Sigue las instrucciones de seguridad y utiliza el equipo de protección adecuado.'}</Text></View></View>
        {!complete && isActive(order) && !inProgress && <Button title="Iniciar trabajo" loading={saving} onPress={() => update('En progreso')} />}
        {(inProgress || complete) && <>
          <OrderChecklist tasks={draft.checklist} complete={complete} saving={saving} progress={progress} onToggle={toggleTask} />
          <PhotoEvidence draft={draft} complete={complete} saving={saving} picking={picking} addPhoto={addPhoto} removePhoto={removePhoto} />
          <ReportObservations draft={draft} complete={complete} saving={saving} change={change} />
          {!complete && <><Button title="Guardar avance" secondary disabled={picking} loading={saving} onPress={() => update('En progreso')} /><Button title="Marcar como completada" success loading={saving} disabled={!allChecked || picking} onPress={() => Alert.alert('Completar orden', '¿Confirmas que terminaste todas las tareas? Las fotos y observaciones permanecerán en este dispositivo.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Completar', onPress: () => update('Completada') }])} />{!allChecked && <Text style={[styles.small, { textAlign: 'center' }]}>Completa todas las tareas del checklist para finalizar.</Text>}</>}
        </>}
        {(error || localError) ? <View style={styles.error}><Text accessibilityRole="alert" style={styles.errorText}>{error || localError}</Text>{localError ? <Button secondary title="Reintentar guardar borrador" onPress={retryDraft} /> : null}</View> : null}
      </ScrollView>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
