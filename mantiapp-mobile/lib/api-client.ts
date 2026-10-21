import { useEffect, useState } from 'react';

export async function requestJson(
  baseUrl: string, path: string, options: RequestInit = {},
): Promise<unknown> {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abort = () => controller.abort();
  externalSignal?.addEventListener('abort', abort);
  if (externalSignal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(baseUrl + path, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
    });
    if (!response.ok) {
      throw new Error('El API respondió HTTP ' + response.status + '. Inténtalo de nuevo.');
    }
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('La solicitud fue cancelada o superó los 15 segundos.');
    if (error instanceof TypeError) throw new Error('No se pudo conectar con ' + baseUrl + '. Revisa la URL y la conexión.');
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abort);
  }
}

type Resource<T> = { key: string; data?: T; error?: string; loading: boolean };

export function useResource<T>(baseUrl: string, path: string | null, parse: (value: unknown) => T, revision: number) {
  const key = baseUrl + (path ?? '');
  const [result, setResult] = useState<Resource<T>>({ key: '', loading: false });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setResult({ key, loading: true });
    requestJson(baseUrl, path, { signal: controller.signal }).then(parse).then(data => {
      if (!controller.signal.aborted) setResult({ key, data, loading: false });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: error instanceof Error ? error.message : 'No se pudo cargar la información.', loading: false });
    });
    return () => controller.abort();
  }, [baseUrl, path, key, parse, revision]);
  return {
    ...(path && result.key === key ? result : { key, loading: Boolean(path) }),
    update: (fn: (data: T) => T) => setResult(current => current.key === key && current.data !== undefined
      ? { ...current, data: fn(current.data) } : current),
  };
}
