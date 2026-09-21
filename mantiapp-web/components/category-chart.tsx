'use client';
import { useState } from 'react';
import { Bars, Empty } from './ui';

const colors = ['#365bd8', '#2f9f88', '#e3ad39', '#9674d0', '#df7584', '#4b9ab4'];
export function CategoryChart({ values }: { values: { label: string; count: number }[] }) {
  const [view, setView] = useState<'donut' | 'bars'>('donut');
  const total = values.reduce((sum, item) => sum + item.count, 0);
  const segments = values.map((item, index) => {
    const preceding = values.slice(0, index).reduce((sum, value) => sum + value.count, 0);
    const start = total ? preceding / total * 100 : 0;
    const end = total ? (preceding + item.count) / total * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });
  if (!total) return <Empty description="Registra activos para ver la distribución por categoría."/>;
  return <><div className="chart-view-switch" aria-label="Representación de categorías"><button aria-pressed={view === 'donut'} onClick={() => setView('donut')}>Circular</button><button aria-pressed={view === 'bars'} onClick={() => setView('bars')}>Barras</button></div>{view === 'bars' ? <Bars values={values}/> : <div className="category-chart"><div className="donut-chart" style={{ background: `conic-gradient(${segments.join(',')})` }} aria-hidden="true"><div><strong>{total}</strong><span>activos</span></div></div><ul className="chart-legend" aria-label={`Distribución de ${total} activos`}>{values.map((item, index) => <li key={item.label}><span className="legend-dot" style={{ background: colors[index % colors.length] }}/><span>{item.label}<small>{(item.count / total * 100).toLocaleString('es-SV', { maximumFractionDigits: 1 })}% del inventario</small></span><strong>{item.count}</strong></li>)}</ul></div>}</>;
}
