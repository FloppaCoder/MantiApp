import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { especialidadPorDefecto, Technician, telefonoSinRegistrar } from '../lib/domain';
import { esTelefonoValido, limiteEspecialidad } from '../lib/validation';
import { saveProfile } from '../lib/technician-api';
import { PageHeading } from './page-heading';
import { Button, colors, styles } from './ui';

// Pantalla para que el técnico cambie su especialidad y su teléfono.
export function EditProfilePage({ profile, onBack, onSaved }: { profile: Technician; onBack: () => void; onSaved: (profile: Technician) => void }) {
  // La API muestra textos por defecto cuando no hay datos: en el formulario esos campos empiezan vacíos
  const [especialidad, setEspecialidad] = useState(profile.especialidad === especialidadPorDefecto ? '' : profile.especialidad);
  const [telefono, setTelefono] = useState(profile.telefono === telefonoSinRegistrar ? '' : profile.telefono);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    if (especialidad.trim().length > limiteEspecialidad) {
      setError(`La especialidad no puede pasar de ${limiteEspecialidad} caracteres.`);
      return;
    }
    if (!esTelefonoValido(telefono)) {
      setError('Ingresa un teléfono válido (8 a 15 dígitos, ejemplo: 7000-0000).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onSaved(await saveProfile(especialidad.trim(), telefono.trim()));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo guardar el perfil.');
      setSaving(false);
    }
  };

  return <>
    <PageHeading title="Editar perfil" onBack={onBack} />
    <View style={styles.content}>
      <View style={styles.card}>
        <Text style={styles.small}>El administrador verá estos datos en el directorio de técnicos.</Text>
        <Text style={styles.cardTitle}>Especialidad</Text>
        <TextInput accessibilityLabel="Especialidad" value={especialidad} onChangeText={setEspecialidad} maxLength={limiteEspecialidad} editable={!saving} style={styles.input} placeholder="Ej. Refrigeración y climatización" placeholderTextColor={colors.muted} />
        <Text style={styles.cardTitle}>Teléfono</Text>
        <TextInput accessibilityLabel="Teléfono" value={telefono} onChangeText={setTelefono} maxLength={20} keyboardType="phone-pad" editable={!saving} style={styles.input} placeholder="7000-0000" placeholderTextColor={colors.muted} />
      </View>
      {error ? <View style={styles.error}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text></View> : null}
      <Button title="Guardar cambios" loading={saving} onPress={guardar} />
      <Button secondary title="Cancelar" disabled={saving} onPress={onBack} />
    </View>
  </>;
}
