import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { supabase } from '@lib/database/SupabaseClient';
import { router } from '../../router';

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function isPublicRoute() {
  return window.location.pathname.startsWith('/traders-tale/trade/');
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session && !isPublicRoute()) router.navigate({ to: '/auth' });
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && !isPublicRoute()) router.navigate({ to: '/auth' });
    });

    return () => subscription.unsubscribe();
  }, []);
  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useTrades must be used inside TradesProvider');
  return ctx;
}
