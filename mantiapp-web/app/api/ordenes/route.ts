import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method: GET /api/ordenes
// Lista órdenes de trabajo (admite ?tecnico_id=... para móvil)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tecnicoId = searchParams.get('tecnico_id');
    const estado = searchParams.get('estado');

    let query = supabase
      .from('work_orders')
      .select('*, assets(id, codigo, nombre, ubicacion), profiles(id, nombre, email)')
      .order('created_at', { ascending: false });

    if (tecnicoId) query = query.eq('tecnico_id', tecnicoId);
    if (estado) query = query.eq('estado', estado);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

// Method: POST /api/ordenes
// Crea una nueva orden y cambia el activo a "En Mantenimiento"
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asset_id, tecnico_id, titulo, descripcion, prioridad, fecha_vencimiento, instrucciones_seguridad } = body;

    if (!asset_id || !titulo || !descripcion) {
      return NextResponse.json({ error: 'asset_id, titulo y descripcion son obligatorios' }, { status: 400 });
    }

    const codigo_ot = `OT-${Math.floor(100 + Math.random() * 900)}`;

    const { data, error } = await supabase
      .from('work_orders')
      .insert([{
        codigo_ot,
        asset_id,
        tecnico_id: tecnico_id || null,
        titulo,
        descripcion,
        prioridad: prioridad || 'Media',
        estado: tecnico_id ? 'Asignada' : 'Pendiente',
        fecha_vencimiento: fecha_vencimiento || new Date().toISOString().split('T')[0],
        instrucciones_seguridad: instrucciones_seguridad || 'Seguir directrices estándar de seguridad.',
        checklist: [
          { tarea: 'Verificar condiciones de seguridad', completada: false },
          { tarea: 'Inspeccionar componentes principales', completada: false },
          { tarea: 'Ejecutar tarea de mantenimiento', completada: false },
          { tarea: 'Limpiar área de trabajo', completada: false },
        ],
      }])
      .select('*, assets(*), profiles(*)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Regla de Negocio: Activo pasa a 'En Mantenimiento'
    await supabase.from('assets').update({ estado: 'En Mantenimiento' }).eq('id', asset_id);

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al registrar orden' }, { status: 500 });
  }
}