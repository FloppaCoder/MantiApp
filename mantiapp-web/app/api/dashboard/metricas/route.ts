import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Method:GET /api/dashboard/metricas
// Consolida KPIs, alertas y gráfica
export async function GET() {
  try {
    const [assetsRes, ordersRes, plansRes] = await Promise.all([
      supabase.from('assets').select('id, codigo, nombre, estado'),
      supabase.from('work_orders').select('id, estado, codigo_ot, titulo'),
      supabase.from('maintenance_plans').select('id, estado, proxima_fecha, tarea, assets(codigo, nombre)'),
    ]);

    const activos = assetsRes.data || [];
    const ordenes = ordersRes.data || [];
    const planes = plansRes.data || [];

    const totalActivos = activos.length;
    const ordenesEnProgreso = ordenes.filter((o) => o.estado === 'En progreso').length;
    const vencidos = planes.filter((p) => p.estado === 'Vencido').length;
    const programadosSemana = planes.filter((p) => p.estado === 'Programado' || p.estado === 'Próximo').length;

    const alertas = [];
    const activosCriticos = activos.filter((a) => a.estado === 'Fuera de Servicio');
    for (const ac of activosCriticos) {
      alertas.push({
        id: `alerta-${ac.id}`,
        tipo: 'Crítica',
        mensaje: `La máquina ${ac.codigo} (${ac.nombre}) está fuera de servicio.`,
      });
    }

    const planesVencidos = planes.filter((p) => p.estado === 'Vencido');
    for (const pv of planesVencidos) {
      const assetData = Array.isArray(pv.assets) ? pv.assets[0] : pv.assets;
      alertas.push({
        id: `alerta-${pv.id}`,
        tipo: 'Advertencia',
        mensaje: `Mantenimiento vencido: ${pv.tarea} en ${assetData?.codigo || 'Activo'}.`,
      });
    }

    const graficoMensual = [
      { mes: 'Ene', preventivos: 4, correctivos: 1 },
      { mes: 'Feb', preventivos: 5, correctivos: 1 },
      { mes: 'Mar', preventivos: 3, correctivos: 2 },
      { mes: 'Abr', preventivos: 6, correctivos: 1 },
      { mes: 'May', preventivos: 5, correctivos: 1 },
      { mes: 'Jun', preventivos: 7, correctivos: 2 },
      { mes: 'Jul', preventivos: 5, correctivos: 1 },
      { mes: 'Ago', preventivos: 4, correctivos: 2 },
    ];

    return NextResponse.json({
      kpis: {
        total_activos: totalActivos,
        programados_semana: programadosSemana,
        mantenimientos_vencidos: vencidos,
        ordenes_en_progreso: ordenesEnProgreso,
      },
      alertas,
      activos_atencion: activos.filter((a) => a.estado !== 'Operativo'),
      grafico_mensual: graficoMensual,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al generar métricas' }, { status: 500 });
  }
}