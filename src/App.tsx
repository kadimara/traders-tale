import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './features/auth/auth';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="p-4">
      <h1>Welcome,{session.user.email}</h1>
      <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
    </div>
  );
}
