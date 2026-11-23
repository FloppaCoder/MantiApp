import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabaseClient';

const BUCKET = 'evidencias'; // bucket público de Supabase Storage

// Convierte texto base64 en bytes para subirlos como archivo
function base64ABytes(base64: string) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

// Recibe las fotos del borrador y devuelve la lista completa de direcciones públicas, en el mismo orden.
// - Las que ya son direcciones (empiezan con http) ya están subidas: se dejan tal cual.
// - Las que están en el teléfono se suben al bucket en  <id de la orden>/<fecha>-<número>.jpg
export async function subirFotos(orderId: string, fotos: string[]): Promise<string[]> {
  const direcciones: string[] = [];
  for (const [i, foto] of fotos.entries()) {
    if (foto.startsWith('http')) {
      direcciones.push(foto);
      continue;
    }
    console.log('[Fotos] subiendo foto', i + 1, 'de la orden', orderId);
    const base64 = await FileSystem.readAsStringAsync(foto, { encoding: FileSystem.EncodingType.Base64 });
    const ruta = `${orderId}/${Date.now()}-${i}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, base64ABytes(base64), { contentType: 'image/jpeg' });
    if (error) {
      console.log('[Fotos] error al subir', ruta, '|', error.message);
      throw new Error('No se pudieron subir las fotos. Revisa tu conexión; tu borrador se conserva en este dispositivo.');
    }
    direcciones.push(supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl);
  }
  return direcciones;
}
