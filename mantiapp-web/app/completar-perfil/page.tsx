"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AuthLogo from '@/components/auth-logo';

// Pantalla para cuentas nuevas (por ejemplo, las que entran con Google) que todavía no tienen perfil.
export default function CompletarPerfilPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rol, setRol] = useState('tecnico');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.replace('/login');
        return;
      }

      // Si ya tiene perfil no hay nada que completar: /login se encarga de llevarlo a su pantalla
      const { data: perfil } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (perfil) {
        router.replace('/login');
        return;
      }

      // Google entrega el nombre en user_metadata; si no viene separado, se parte el nombre completo
      const meta = user.user_metadata ?? {};
      const completo = String(meta.full_name ?? meta.name ?? '').trim();
      const [primero = '', ...resto] = completo.split(/\s+/);

      setUserId(user.id);
      setEmail(user.email ?? '');
      setNombre(meta.given_name ?? primero);
      setApellido(meta.family_name ?? resto.join(' '));
    }
    void cargar();
  }, [router]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !apellido.trim()) {
      setError("El nombre y el apellido son obligatorios.");
      return;
    }

    setLoading(true);
    const { error: dbError } = await supabase
      .from('profiles')
      .insert([{ id: userId, email, nombre: nombre.trim(), apellido: apellido.trim(), rol }]);

    if (dbError) {
      setError("No se pudo guardar el perfil: " + dbError.message);
      setLoading(false);
      return;
    }

    if (rol === 'administrador') {
      router.push('/');
    } else {
      await supabase.auth.signOut();
      alert("Cuenta de Técnico creada exitosamente. Por favor, inicia sesión en la aplicación móvil.");
      router.push('/login');
    }
  };

  // Por si entró con la cuenta de Google equivocada
  const usarOtraCuenta = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-10">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">

        <div className="text-center mb-8">
          <AuthLogo />
          <h1 className="text-3xl font-bold text-blue-400">Completa tu perfil</h1>
          <p className="text-slate-400 mt-2 text-sm">Un último paso para entrar a MantiApp</p>
        </div>

        <form onSubmit={handleGuardar} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Apellido</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 opacity-70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rol en el sistema</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none"
            >
              <option value="tecnico">Técnico (App Móvil)</option>
              <option value="administrador">Administrador (Panel Web)</option>
            </select>
          </div>

          {error && (
            <div className="bg-rose-500/20 text-rose-400 border border-rose-500/30 p-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>

          <div className="text-center text-sm text-slate-400 pt-2">
            ¿Cuenta equivocada?{' '}
            <button type="button" onClick={usarOtraCuenta} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Usar otra cuenta
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
