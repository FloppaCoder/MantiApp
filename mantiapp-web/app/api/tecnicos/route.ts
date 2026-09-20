import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method: GET /api/tecnicos
// Retorna lista de técnicos con sus métricas calculadas
export async function GET() {
  try {
    const { data: tecnicos, error } = await supabase
      .from('profiles')
      .select('*, work_orders(id, estado)')
      .eq('rol', 'tecnico')
      .order('nombre', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const resultado = (tecnicos || []).map((t) => {
      const ordenes = t.work_orders || [];
      const ordenesActivas = ordenes.filter(
        (o: { estado: string }) => o.estado === 'Asignada' || o.estado === 'En progreso'
      ).length;
      const completadas = ordenes.filter(
        (o: { estado: string }) => o.estado === 'Completada'
      ).length;

      return {
        id: t.id,
        nombre: t.nombre,
        email: t.email,
        especialidad: t.especialidad || 'General',
        telefono: t.telefono || 'Sin registrar',
        ordenes_activas: ordenesActivas,
        completadas_mes: completadas,
      };
    });

    return NextResponse.json(resultado, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al obtener técnicos' }, { status: 500 });
  }
}