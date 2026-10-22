import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export class MobileApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function technicianContext(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw new MobileApiError('Se requiere una sesión.', 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new MobileApiError('El servidor no está configurado.', 500);
  // A client per request, using the caller's token. Never share auth between users.
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new MobileApiError('La sesión no es válida.', 401);
  const account = await db.from('users').select('*').eq('id', data.user.id).single();
  if (account.error) throw new MobileApiError('No se pudieron verificar los permisos.', 403);
  if (account.data?.rol !== 'tecnico') throw new MobileApiError('Acceso exclusivo para técnicos.', 403);
  return { db, user: data.user, account: account.data };
}
export function mobileFailure(failure: unknown) {
  const status = failure instanceof MobileApiError ? failure.status : 500;
  const error = failure instanceof MobileApiError ? failure.message : 'No se pudo completar la solicitud.';
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function mobileJson(data: unknown) {
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
export const orderSelection = '*, assets(codigo, nombre, ubicacion)';
export function mobileOrder(row: Record<string, unknown>) {
  return { ...row, assets: Array.isArray(row.assets) ? row.assets[0] ?? null : row.assets };
}
