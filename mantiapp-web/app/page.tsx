'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Asset {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  estado: string;
}

export default function Home() {
  const [activos, setActivos] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');

  // 1. Obtener datos de Supabase al cargar
  const fetchActivos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al traer activos:', error.message);
    } else {
      setActivos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivos();
  }, []);

  // 2. Agregar un activo para probar dinamismo
  const handleCrearActivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoCodigo) return;

    const { error } = await supabase.from('assets').insert([
      {
        codigo: nuevoCodigo,
        nombre: nuevoNombre,
        categoria: 'Maquinaria',
        ubicacion: 'Taller Central',
        estado: 'Operativo',
      },
    ]);

    if (!error) {
      setNuevoNombre('');
      setNuevoCodigo('');
      fetchActivos(); // Refrescar la lista
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold text-blue-400">MantiApp - Prueba Piloto</h1>
          <p className="text-slate-400 text-sm">Conectado exitosamente a Supabase</p>
        </div>

        {/* Formulario simple para agregar */}
        <form onSubmit={handleCrearActivo} className="flex gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <input
            type="text"
            placeholder="Código (ej. A-104)"
            value={nuevoCodigo}
            onChange={(e) => setNuevoCodigo(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Nombre del activo"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-medium text-sm rounded-lg transition"
          >
            + Guardar Activo
          </button>
        </form>

        {/* Tabla / Lista de Activos */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 font-semibold text-slate-300">
            Inventario de Activos en la Nube
          </div>

          {loading ? (
            <p className="p-4 text-slate-400">Cargando datos desde Supabase...</p>
          ) : (
            <div className="divide-y divide-slate-700">
              {activos.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-750">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {item.codigo}
                      </span>
                      <span className="font-semibold text-white">{item.nombre}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.categoria} • {item.ubicacion}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        item.estado === 'Operativo'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : item.estado === 'Fuera de Servicio'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}