import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { nombreCompleto } from '@/lib/domain';
import { businessDate } from '@/lib/scheduling';

// Method: GET /api/tecnicos
// Retorna lista de técnicos con sus métricas calculadas
export async function GET() {
  try {
    const { data: tecnicos, error } = await supabase
      .from('profiles')
      .select('*, work_orders(id, estado, fecha_completada)')
      .eq('rol', 'tecnico')
      .order('nombre', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mesActual = businessDate().slice(0, 7); // AAAA-MM

    const resultado = (tecnicos || []).map((t) => {
      const ordenes = t.work_orders || [];
      const ordenesActivas = ordenes.filter(
        (o: { estado: string }) => o.estado === 'Asignada' || o.estado === 'En progreso'
      ).length;
      // Solo cuentan las completadas en el mes actual (según la fecha en que se completaron)
      const completadas = ordenes.filter(
        (o: { estado: string; fecha_completada: string | null }) =>
          o.estado === 'Completada' &&
          o.fecha_completada &&
          businessDate(new Date(o.fecha_completada)).slice(0, 7) === mesActual
      ).length;

      return {
        id: t.id,
        nombre: nombreCompleto(t),
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