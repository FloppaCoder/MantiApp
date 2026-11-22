// Funciones puras (sin Expo ni Supabase) para el login con Google. Así se pueden probar fácilmente.

// Google devuelve a la app con una dirección como:
//   exp://.../--/auth-callback#access_token=...&refresh_token=...
// o, si algo falló:
//   exp://.../--/auth-callback?error=access_denied&error_description=...
// Esta función junta los parámetros de la parte "?" y de la parte "#".
export function paramsFromUrl(url: string) {
  const query = url.split('#')[0].split('?')[1] ?? '';
  const hash = url.split('#')[1] ?? '';
  return new URLSearchParams(`${query}&${hash}`);
}

// Supabase rechaza las direcciones de retorno con IP local (exp://192.168.x.x...), que es lo que
// usa Expo Go en modo normal. En ese caso se usa el esquema propio de la app (mantiapp://).
// Con el modo túnel (nombre de dominio, exp://algo.exp.direct) o con la app compilada, se usa la de Expo.
export function direccionDeRetorno(urlExpo: string) {
  const usaIpLocal = /^exp:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?/.test(urlExpo);
  return usaIpLocal ? 'mantiapp://auth-callback' : urlExpo;
}

// Google entrega el nombre en los datos del usuario. Si no vienen separados,
// se parte el nombre completo: la primera palabra es el nombre y el resto el apellido.
export function nombreDeGoogle(meta: Record<string, unknown> = {}) {
  const completo = String(meta.full_name ?? meta.name ?? '').trim();
  const [primero = '', ...resto] = completo.split(/\s+/);
  return {
    nombre: String(meta.given_name ?? primero).trim(),
    apellido: String(meta.family_name ?? resto.join(' ')).trim(),
  };
}
