import { LogOut } from 'react-feather';
import { useSessionContext } from './context/SessionContext';
import { useTradesContext } from './context/TradesContext';
import Auth from './features/auth/auth';
import { TradesTable } from './features/tradestable/TradesTable';
import { supabase } from './lib/database/SupabaseClient';

export default function App() {
  const { session, loading } = useSessionContext();

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-center gap-1">
        <h1 className="flex-1">
          Welcome,&nbsp;
          {session.user.user_metadata['display_name'] || session.user.email}
        </h1>
        <button onClick={() => supabase.auth.signOut()}>
          logout <LogOut />
        </button>
      </div>
      <TradesTable />
    </div>
  );
}
