"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validar credenciales con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    // 2. Verificar el rol del usuario en la tabla 'usuarios'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('rol')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      await supabase.auth.signOut();
      setError("Error al obtener los permisos del usuario. Contacte a soporte.");
      setLoading(false);
      return;
    }

    // 3. Control de Acceso Basado en Roles (RBAC)
    if (userData.rol === 'tecnico') {
      // Si es técnico, cerramos la sesión y bloqueamos el acceso web
      await supabase.auth.signOut();
      setError("Acceso denegado: Esta plataforma web es exclusiva para administradores. Por favor, utiliza la aplicación móvil operativa.");
      setLoading(false);
      return;
    }

    // Si es administrador, permitimos el acceso al Dashboard
    if (userData.rol === 'administrador') {
      router.push('/');
    } else {
      await supabase.auth.signOut();
      setError("Rol no reconocido.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">MantiApp</h1>
          <p className="text-gray-500 mt-2">Panel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-black"
              placeholder="admin@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-black"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Ingresar al sistema'}
          </button>
          <div className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Crea una aquí
            </Link>
          </div>

        </form>

      </div>
    </div>
  );
}