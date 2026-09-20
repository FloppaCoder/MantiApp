"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('tecnico');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError("Error al crear la cuenta: " + (authError?.message || "Usuario no generado."));
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: email,
          nombre: nombre,
          apellido: apellido,
          rol: rol
        }
      ]);

    if (dbError) {
      setError("La cuenta se creó, pero hubo un error al guardar el perfil.");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-10">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Crear Cuenta</h1>
          <p className="text-slate-400 mt-2 text-sm">Únete a MantiApp</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
              placeholder="juan@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña (Mín. 6 caracteres)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
              placeholder="••••••••"
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
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>

          <div className="text-center text-sm text-slate-400 pt-2">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Inicia sesión
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}