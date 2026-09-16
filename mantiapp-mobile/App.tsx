import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { supabase } from './lib/supabaseClient';

interface Asset {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  estado: string;
}

export default function App() {
  const [activos, setActivos] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');

  // 1. Obtener los activos desde Supabase
  const fetchActivos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al traer activos:', error.message);
    } else {
      setActivos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivos();
  }, []);

  // 2. Insertar activo desde el teléfono
  const handleCrearActivo = async () => {
    if (!codigo.trim() || !nombre.trim()) return;

    const { error } = await supabase.from('assets').insert([
      {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        categoria: 'Móvil Test',
        ubicacion: 'En campo',
        estado: 'Operativo',
      },
    ]);

    if (!error) {
      setCodigo('');
      setNombre('');
      fetchActivos();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MantiApp Mobile</Text>
        <Text style={styles.subtitle}>Piloto conectado a Supabase</Text>
      </View>

      {/* Formulario rápido */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Código (ej. M-201)"
          placeholderTextColor="#64748b"
          value={codigo}
          onChangeText={setCodigo}
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre del activo"
          placeholderTextColor="#64748b"
          value={nombre}
          onChangeText={setNombre}
        />
        <TouchableOpacity style={styles.button} onPress={handleCrearActivo}>
          <Text style={styles.buttonText}>+ Guardar desde Teléfono</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Activos */}
      <View style={styles.listContainer}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Inventario en Tiempo Real</Text>
          <TouchableOpacity onPress={fetchActivos}>
            <Text style={styles.refreshText}>Recargar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={activos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.codeBadge}>{item.codigo}</Text>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {item.categoria} • {item.ubicacion}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.estado === 'Operativo'
                      ? styles.statusOk
                      : item.estado === 'Fuera de Servicio'
                      ? styles.statusDanger
                      : styles.statusWarn,
                  ]}
                >
                  <Text style={styles.statusText}>{item.estado}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 20, borderBottomWidth: 1, borderColor: '#1e293b' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#60a5fa' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  formContainer: { margin: 16, padding: 14, backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', gap: 10 },
  input: { backgroundColor: '#020617', borderColor: '#334155', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#f8fafc', fontSize: 14 },
  button: { backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#cbd5e1' },
  refreshText: { color: '#60a5fa', fontSize: 13, fontWeight: '500' },
  card: { backgroundColor: '#0f172a', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  codeBadge: { backgroundColor: '#1e293b', color: '#cbd5e1', fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontFamily: 'monospace' },
  cardTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  cardSubtitle: { color: '#94a3b8', fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusOk: { backgroundColor: '#064e3b' },
  statusDanger: { backgroundColor: '#881337' },
  statusWarn: { backgroundColor: '#78350f' },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
});