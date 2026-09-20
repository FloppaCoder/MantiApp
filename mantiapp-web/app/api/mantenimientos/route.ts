import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method: GET /api/mantenimientos
// Lista planes preventivos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    let query = supabase
      .from('maintenance_plans')
      .select('*, assets(id, codigo, nombre)')
      .order('proxima_fecha', { ascending: true });

    if (estado && estado !== 'Todos') {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al obtener mantenimientos' }, { status: 500 });
  }
}

// Method: POST /api/mantenimientos
// Registra un nuevo plan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asset_id, tipo, tarea, frecuencia, proxima_fecha, prioridad } = body;

    if (!asset_id || !tarea || !proxima_fecha) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const hoy = new Date().toISOString().split('T')[0];
    let estadoInicial = 'Programado';
    if (proxima_fecha < hoy) estadoInicial = 'Vencido';
    else if (proxima_fecha === hoy) estadoInicial = 'Próximo';

    const { data, error } = await supabase
      .from('maintenance_plans')
      .insert([{
        asset_id,
        tipo: tipo || 'Preventivo',
        tarea,
        frecuencia: frecuencia || 'Cada 3 meses',
        proxima_fecha,
        prioridad: prioridad || 'Media',
        estado: estadoInicial,
      }])
      .select('*, assets(id, codigo, nombre)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al registrar mantenimiento' }, { status: 500 });
  }
}