import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function apiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!base || !/^https?:\/\//i.test(base)) {
    throw new ApiError('Configura EXPO_PUBLIC_API_URL con la dirección del servidor web.', 0);
  }
  if (!path.startsWith('/api/')) throw new ApiError('Ruta de API no válida.', 0);
  return `${base}${path}`;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = apiUrl(path);
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new ApiError('Inicia sesión para continuar.', 401);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  let response: Response;
  try { response = await fetch(url, { ...options, headers }); }
  catch (failure) {
    if (failure instanceof Error && failure.name === 'AbortError') throw failure;
    throw new ApiError('No pudimos conectar con la API. Verifica la dirección del servidor y tu conexión.', 0);
  }
  if (!response.ok) {
    const message = response.status === 401 ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.'
      : response.status === 403 ? 'No tienes permiso para realizar esta acción.'
      : response.status === 404 ? 'No encontramos la orden solicitada.'
      : response.status === 409 ? 'La orden cambió. Vuelve al listado y recarga antes de continuar.'
      : response.status === 400 ? 'Revisa los datos y completa las tareas antes de finalizar.'
      : 'No se pudo completar la solicitud. Inténtalo nuevamente.';
    throw new ApiError(message, response.status);
  }
  try { return await response.json() as T; }
  catch { throw new ApiError('La API no devolvió una respuesta JSON válida.', response.status); }
}

// Same resource pattern as the web client; each screen owns its resource lifecycle.
export function useResource<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: T; error?: string }>({ key: '' });
  const key = `${path}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    request<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(failure => {
      if (!controller.signal.aborted) setResult({ key, error: failure instanceof Error ? failure.message : 'Ocurrió un error inesperado.' });
    });
    return () => controller.abort();
  }, [path, key]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const update = useCallback((transform: (value: T) => T) => {
    setResult(value => value.key === key && value.data !== undefined ? { ...value, data: transform(value.data) } : value);
  }, [key]);
  return { data: result.key === key ? result.data : undefined, error: result.key === key ? result.error : undefined, loading: result.key !== key, reload, update };
}
