import * as WebBrowser from 'expo-web-browser';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { nombreDeGoogle, paramsFromUrl } from './google-parse';

// Necesario para que el navegador de autenticación se cierre solo al volver a la app.
WebBrowser.maybeCompleteAuthSession();

// Inicia sesión con Google. Devuelve un mensaje de error para mostrar en el formulario,
// o null si todo salió bien (o si el usuario cerró la ventana de Google sin terminar).
export async function signInWithGoogle(): Promise<string | null> {
  // 1. Pedir a Supabase la dirección de Google.
  //    Dirección fija con el esquema de la app (app.json). Supabase rechaza las direcciones con IP
  //    local (exp://192.168.x.x...), así que no se usa la que construye Expo Go.
  const redirectTo = 'mantiapp://auth-callback';
  console.log('[Google] redirectTo:', redirectTo); // TEMPORAL: diagnóstico
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';

  // 2. Abrir Google en el navegador del sistema y esperar a que devuelva a la app
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  // TEMPORAL: diagnóstico (los tokens se ocultan para no exponerlos en la terminal)
  console.log('[Google] navegador:', result.type, 'url' in result ? result.url.replace(/(token=)[^&]+/g, '$1***') : '');
  if (result.type !== 'success') return null;

  const params = paramsFromUrl(result.url);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    return params.get('error_description') ?? 'Google no devolvió la sesión. Inténtalo de nuevo.';
  }

  // 3. Revisar el perfil con una conexión temporal, ANTES de guardar la sesión.
  //    Así, si no puede entrar, no se inicia sesión y el mensaje se ve en el formulario.
  const temporal = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: userData, error: userError } = await temporal.auth.getUser(accessToken);
  if (userError || !userData.user) return 'No se pudo verificar tu cuenta de Google.';
  const user = userData.user;

  const { data: perfil, error: perfilError } = await temporal
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();
  if (perfilError) return 'Error al obtener los permisos. Contacte a soporte.';

  if (perfil?.rol === 'administrador') return 'Acceso denegado: El administrador debe usar la web.';
  if (perfil && perfil.rol !== 'tecnico') return 'Rol no reconocido.';

  // Cuenta nueva: en el móvil solo se crean técnicos (igual que el registro por correo)
  if (!perfil) {
    const { nombre, apellido } = nombreDeGoogle(user.user_metadata);
    const { error: insertError } = await temporal.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      nombre: nombre || (user.email ?? '').split('@')[0],
      apellido: apellido || null,
      rol: 'tecnico',
    });
    if (insertError) return 'No se pudo crear tu perfil: ' + insertError.message;
  }

  // 4. Todo en orden: ahora sí se guarda la sesión y la app entra sola
  const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError) return 'No se pudo iniciar la sesión. Inténtalo de nuevo.';
  return null;
}
