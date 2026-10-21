import React from 'react';
import type { MobileAppModel } from '../lib/use-mobile-app';
import { s } from '../app/globals';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Badge, Button, Empty, ResourceFeedback } from './ui';
import { dateLabel, relation, type OrderFilter, type WorkOrder } from '../lib/domain';

export function OrdersPage({ model }: { model: MobileAppModel }) {
  const { visible, orders, refresh, filter, setFilter, search, setSearch, openOrder } = model;
  return (<>
      <View style={s.pageHeader}><Text style={s.pageTitle}>Mis órdenes</Text><Text style={s.muted}>Órdenes de trabajo asignadas a ti</Text></View>
      <FlatList data={visible} keyExtractor={item => item.id} contentContainerStyle={s.content}
        refreshing={orders.loading} onRefresh={refresh} keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<>
          <View style={s.filters}>{(['Todas', 'Activas', 'Completadas'] as OrderFilter[]).map(value => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }}
              onPress={() => setFilter(value)} style={[s.filter, filter === value && s.activeFilter]}>
              <Text style={[s.filterText, filter === value && s.activeFilterText]}>{value}</Text>
            </Pressable>
          ))}</View>
          <TextInput accessibilityLabel="Buscar órdenes" style={s.input} placeholder="Buscar código, activo o descripción" placeholderTextColor="#697586" value={search} onChangeText={setSearch} />
          <ResourceFeedback loading={orders.loading} error={orders.error} onRetry={refresh} />
        </>}
        ListEmptyComponent={!orders.loading && !orders.error ? <Empty text="No hay órdenes que coincidan con este filtro." /> : null}
        renderItem={({ item }) => <OrderCard order={item} onPress={() => openOrder(item)} />}
      />
    </>);
}

export function OrderDetailPage({ model }: { model: MobileAppModel }) {
  const { selectedId, selected, saving, orders, refresh, notice, writeError, busy,
    changeState, progress, selectedTasks, verified, toggleTask, allChecked, back, showOrders } = model;
  return (<>
      <View style={s.detailHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver a las órdenes" disabled={saving} onPress={back} style={s.back}>
          <Text style={s.backText}>←</Text>
        </Pressable>
        <View style={[s.grow, s.orderDetails]}><Text style={s.small}>{selected?.codigo_ot ?? 'Detalle de orden'}</Text>
          <Text numberOfLines={1} style={s.cardTitle}>{selected ? relation(selected.assets)?.nombre ?? selected.titulo : 'Orden de trabajo'}</Text></View>
        {selected && <Badge value={selected.estado} />}
      </View>
      <ScrollView key={selectedId} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={orders.loading} onRefresh={refresh} enabled={!saving} />}>
        <ResourceFeedback loading={orders.loading} error={orders.error} onRetry={refresh} />
        {!orders.loading && !orders.error && !selected && <Empty text="La orden ya no está disponible para este técnico. Vuelve al listado y recarga." />}
        {selected && <>
          {notice ? <View style={s.successBox}><Text accessibilityRole="alert" style={s.successText}>✓ {notice}</Text></View> : null}
          {writeError ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.errorText}>{writeError}</Text><Text style={s.small}>Recarga para comprobar el estado antes de reintentar.</Text></View> : null}
          <View style={s.row}><Badge value={selected.prioridad} /><Text style={s.small}>Vence: {dateLabel(selected.fecha_vencimiento)}</Text></View>
          <View style={s.card}>
            <Text style={s.small}>Ubicación · {relation(selected.assets)?.ubicacion || 'Sin registrar'}</Text>
            <Text style={s.sectionTitle}>{selected.titulo}</Text>
            <Text style={s.body}>{selected.descripcion || 'Sin descripción registrada.'}</Text>
            <Text style={s.small}>Activo: {relation(selected.assets)?.codigo || 'Sin asignar'}</Text>
          </View>
          <View style={s.infoBox}><Text style={s.infoTitle}>Instrucciones de seguridad</Text>
            <Text style={s.body}>{selected.instrucciones_seguridad || 'No hay instrucciones adicionales registradas.'}</Text></View>
          {selected.estado === 'Completada' ? (
            <View style={s.card}><Text style={s.successTitle}>✓ Orden completada</Text><Text style={s.muted}>Este trabajo figura como completado en el API.</Text>
              <Button label="Volver a mis órdenes" secondary onPress={() => showOrders('Activas')} /></View>
          ) : selected.estado === 'Asignada' ? (
            <Button label={saving ? 'Iniciando trabajo…' : '▷ Iniciar trabajo'} disabled={busy} onPress={() => void changeState('En progreso')} />
          ) : selected.estado === 'Pendiente' ? (
            <Empty text="La orden debe estar asignada antes de iniciar el trabajo." />
          ) : <>
            <View style={s.card}>
              <View style={s.between}><Text style={s.sectionTitle}>Checklist de tareas</Text><Text style={s.link}>{progress}%</Text></View>
              <Text style={s.small}>Verificación temporal: las marcas solo se conservan mientras esta app está abierta. El API todavía no guarda el avance.</Text>
              {selectedTasks.length ? <>
                <View style={s.track}><View style={[s.progress, { width: (progress + '%') as `${number}%` }]} /></View>
                {selectedTasks.map((task, index) => <Pressable key={index} accessibilityRole="checkbox"
                  accessibilityState={{ checked: verified[index], disabled: busy }} disabled={busy}
                  onPress={() => toggleTask(index)} style={s.task}>
                  <View style={[s.checkbox, verified[index] && s.checkboxChecked]}><Text style={s.checkmark}>{verified[index] ? '✓' : ''}</Text></View>
                  <Text style={[s.body, s.grow, verified[index] && s.struck]}>{task.tarea}</Text>
                </Pressable>)}
              </> : <Text style={s.muted}>Esta orden no tiene tareas de checklist registradas.</Text>}
            </View>
            <View style={s.card}><Text style={s.sectionTitle}>Evidencias y observaciones</Text>
              <Text style={s.muted}>Las fotografías y observaciones estarán disponibles cuando el API permita guardarlas.</Text></View>
            <Button label={saving ? 'Guardando…' : '✓ Marcar como completada'} disabled={busy || !allChecked} onPress={() => void changeState('Completada')} />
            {!allChecked && <Text style={s.centerText}>Verifica todas las tareas para finalizar.</Text>}
          </>}
        </>}
      </ScrollView>
    </>);
}

export function OrderCard({ order, onPress }: { order: WorkOrder; onPress: () => void }) {
  const asset = relation(order.assets);
  return <Pressable accessibilityRole="button" accessibilityLabel={'Abrir ' + order.codigo_ot}
    onPress={onPress} style={({ pressed }) => [s.card, s.orderCard, pressed && s.dim]}>
    <View style={[s.grow, s.orderDetails]}>
      <View style={s.row}><Text style={s.code}>{order.codigo_ot}</Text><Badge value={order.prioridad} /></View>
      <Text numberOfLines={1} style={s.cardTitle}>{asset?.nombre ?? order.titulo}</Text>
      <Text numberOfLines={2} style={s.muted}>{order.descripcion || order.titulo}</Text>
      <Text numberOfLines={1} style={s.small}>Ubicación · {asset?.ubicacion || asset?.codigo || 'Sin registrar'}</Text>
      <View style={s.row}><Badge value={order.estado} /><Text style={s.small}>{dateLabel(order.fecha_vencimiento)}</Text></View>
    </View>
    <Text style={s.chevron}>›</Text>
  </Pressable>;
}
