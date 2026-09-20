import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method: GET /api/activos
// Lista activos (soporta ?categoria=Maquinaria o ?search=Torno)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('search');

    let query = supabase.from('assets').select('*').order('created_at', { ascending: false });

    if (categoria && categoria !== 'Todos') {
      query = query.eq('categoria', categoria);
    }
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Method: POST /api/activos 
// Crea un nuevo activo con validación básica
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, nombre, categoria, ubicacion, estado } = body;

    if (!codigo || !nombre || !categoria || !ubicacion) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: codigo, nombre, categoria, ubicacion' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('assets')
      .insert([{ codigo, nombre, categoria, ubicacion, estado: estado || 'Operativo' }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}