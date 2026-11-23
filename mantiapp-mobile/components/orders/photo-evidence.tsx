import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { colors, Icon, styles } from '../ui';

interface PhotoEvidenceProps {
  draft: { photos: string[] };
  savedPhotos?: string[]; // fotos ya subidas al servidor (orden completada)
  complete: boolean;
  saving: boolean;
  picking: boolean;
  addPhoto: (source: 'camara' | 'galeria') => void;
  removePhoto: (uri: string) => void;
}

export function PhotoEvidence({ draft, savedPhotos = [], complete, saving, picking, addPhoto, removePhoto }: PhotoEvidenceProps) {
  // Orden completada: se muestran las fotos ya subidas. Si no, las del borrador guardadas en el teléfono.
  const photos = complete && savedPhotos.length ? savedPhotos : draft.photos;
  const canAdd = !complete && draft.photos.length < 6;

  // Botón cuadrado para agregar una foto, ya sea con la cámara o desde la galería
  const addButton = (source: 'camara' | 'galeria', icon: 'camera-outline' | 'images-outline', label: string) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={source === 'camara' ? 'Tomar foto con la cámara' : 'Agregar foto desde la galería'}
      onPress={() => addPhoto(source)}
      disabled={picking || saving}
      style={[styles.empty, { width: 92, height: 92, padding: 8, gap: 4 }]}
    >
      {picking ? <ActivityIndicator color={colors.primary} /> : <><Icon name={icon} /><Text style={styles.small}>{label}</Text></>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Evidencia fotográfica</Text>
      <Text style={styles.small}>
        {complete
          ? 'Fotos enviadas con la orden.'
          : 'Toma una foto o elige una de la galería (máximo 6). Se envían al guardar el avance o al completar la orden.'}
      </Text>
      <View style={[styles.row, { flexWrap: 'wrap', gap: 10 }]}>
        {photos.map((uri, i) => (
          <View key={uri} style={{ width: 92, height: 92 }}>
            <Image source={{ uri }} accessibilityLabel={`Evidencia ${i + 1}`} style={{ width: 92, height: 92, borderRadius: 12 }} />
            {!complete && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Eliminar foto ${i + 1}`}
                onPress={() => removePhoto(uri)}
                disabled={saving || picking}
                style={{ position: 'absolute', right: 0, top: 0, backgroundColor: '#fff', padding: 8, borderRadius: 20 }}
              >
                <Icon name="close" color={colors.red} size={16} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {canAdd && addButton('camara', 'camera-outline', 'Cámara')}
        {canAdd && addButton('galeria', 'images-outline', 'Galería')}
      </View>
    </View>
  );
}
