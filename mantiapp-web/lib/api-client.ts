'use client';
import { useCallback, useEffect, useState } from 'react';
export class ApiError extends Error {
    constructor(message: string, public status: number) { super(message); }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
        response = await fetch(path, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options.headers } });
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError')
            throw error;
        throw new ApiError('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.', 0);
    }
    if (response.status === 401)
        window.dispatchEvent(new Event('manti:session-expired'));
    if (!response.ok) {
        // Keep database internals out of the product interface.
        const message = response.status === 401 ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.'
            : response.status === 403 ? 'No tienes permiso para realizar esta acción.'
                : response.status === 404 ? 'No encontramos el registro solicitado.'
                    : response.status === 400 ? 'Revisa los datos del formulario e inténtalo de nuevo.'
                        : response.status === 409 ? 'El registro está en uso o ya existe. Revisa sus datos.'
                            : 'No se pudo completar la solicitud. Inténtalo nuevamente.';
        throw new ApiError(message, response.status);
    }
    try {
        return await response.json() as T;
    }
    catch {
        throw new ApiError('La respuesta no pudo leerse. Vuelve a intentarlo.', response.status);
    }
}
export function useResource<T>(path: string) {
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<{
        key: string;
        data?: T;
        error?: string;
    }>({ key: '' });
    const key = `${path}:${revision}`;
    useEffect(() => {
        const controller = new AbortController();
        request<T>(path, { signal: controller.signal }).then(data => {
            if (!controller.signal.aborted)
                setResult({ key, data });
        }).catch(error => {
            if (!controller.signal.aborted)
                setResult({ key, error: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
        });
        return () => controller.abort();
    }, [path, key]);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    return { data: result.key === key ? result.data : undefined, error: result.key === key ? result.error : undefined, loading: result.key !== key, reload };
}
export function useDebounced(value: string, delay = 300) {
    const [settled, setSettled] = useState(value);
    useEffect(() => { const timer = setTimeout(() => setSettled(value), delay); return () => clearTimeout(timer); }, [value, delay]);
    return settled;
}
