"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import GoogleButton from '@/components/google-button';
import AuthLogo from '@/components/auth-logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Revisa el rol de un usuario que ya inició sesión (con contraseña o con Google):
  // el administrador entra al panel y cualquier otro caso se rechaza.
  const entrarSegunRol = async (userId: string) => {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      await supabase.auth.signOut();
      setError("Error al obtener los permisos. Contacte a soporte.");
      setLoading(false);
      return;
    }

    // Cuenta nueva (por ejemplo, de Google) sin perfil: lo completa en otra pantalla
    if (!userData) {
      router.push('/completar-perfil');
      return;
    }

    if (userData.rol === 'tecnico') {
      await supabase.auth.signOut();
      setError("Acceso denegado: Usa la aplicación móvil operativa.");
      setLoading(false);
      return;
    }

    if (userData.rol === 'administrador') {
      router.push('/');
    } else {
      await supabase.auth.signOut();
      setError("Rol no reconocido.");
      setLoading(false);
    }
  };

  // Al cargar la página: si ya hay sesión (por ejemplo, al volver de Google), se revisa el rol.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoading(true);
        void entrarSegunRol(data.session.user.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    await entrarSegunRol(authData.user.id);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        
        <div className="text-center mb-8">
          <AuthLogo />
          <h1 className="text-3xl font-bold text-blue-400">MantiApp</h1>
          <p className="text-slate-400 mt-2 text-sm">Panel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
              placeholder="admin@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-rose-500/20 text-rose-400 border border-rose-500/30 p-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Ingresar al sistema'}
          </button>

          <GoogleButton disabled={loading} onError={setError} />

          <div className="mt-6 text-center text-sm text-slate-400">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Crea una aquí
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}