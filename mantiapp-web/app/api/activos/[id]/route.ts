import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method: PUT /api/activos/[id]
// Actualiza un activo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, categoria, ubicacion, estado } = body;

    const { data, error } = await supabase
      .from('assets')
      .update({ nombre, categoria, ubicacion, estado })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar activo' }, { status: 500 });
  }
}

// Method: DELETE /api/activos/[id]
// Da de baja un activo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Activo eliminado correctamente' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar activo' }, { status: 500 });
  }
}