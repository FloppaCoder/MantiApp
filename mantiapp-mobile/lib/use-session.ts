import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { loadProfile } from './technician-api';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    let revision = 0;
    let lastToken: string | undefined;
    const accept = (value: Session | null) => {
      revision++;
      const token = value?.access_token ?? '';
      if (lastToken === token) return;
      lastToken = token;
      if (mounted) { setSession(value); setReady(!value); setAuthorized(false); setError(''); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => accept(value));
    const initialRevision = revision;
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!mounted || revision !== initialRevision) return;
      if (failure) { setError('No se pudo recuperar la sesión.'); setReady(true); }
      else accept(data.session);
    }).catch(() => { if (mounted) { setError('No se pudo recuperar la sesión.'); setReady(true); } });
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => { mounted = false; subscription.unsubscribe(); appState.remove(); };
  }, [attempt]);

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    const check = async () => {
      try {
        await loadProfile();
        if (mounted) setAuthorized(true);
      } catch (failure) { if (mounted) setError(failure instanceof Error ? failure.message : 'No se pudieron verificar tus permisos.'); }
      finally { if (mounted) setReady(true); }
    };
    void check();
    return () => { mounted = false; };
  }, [session, attempt]);

  return { session, ready, authorized, error, setError, retry: () => { setReady(false); setAttempt(value => value + 1); } };
}
