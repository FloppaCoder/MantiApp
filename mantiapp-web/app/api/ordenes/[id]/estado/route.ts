import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method: PATCH /api/ordenes/[id]/estado
// Movimiento en el Kanban con retorno automático del activo
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nuevo_estado } = await request.json();

    const estadosValidos = ['Pendiente', 'Asignada', 'En progreso', 'Completada'];
    if (!estadosValidos.includes(nuevo_estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const { data: orden, error: fetchErr } = await supabase
      .from('work_orders')
      .select('asset_id')
      .eq('id', id)
      .single();

    if (fetchErr || !orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const { data: ordenActualizada, error: updateErr } = await supabase
      .from('work_orders')
      .update({ estado: nuevo_estado })
      .eq('id', id)
      .select('*, assets(*), profiles(*)')
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Regla de Negocio: Retorno de estado del activo
    if (nuevo_estado === 'Completada') {
      await supabase.from('assets').update({ estado: 'Operativo' }).eq('id', orden.asset_id);
    } else if (nuevo_estado === 'En progreso' || nuevo_estado === 'Asignada') {
      await supabase.from('assets').update({ estado: 'En Mantenimiento' }).eq('id', orden.asset_id);
    }

    return NextResponse.json(ordenActualizada, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error interno al actualizar estado' }, { status: 500 });
  }
}