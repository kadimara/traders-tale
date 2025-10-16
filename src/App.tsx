import { Book, LogOut } from 'react-feather';
import { useSessionContext } from './context/SessionContext';
import { TradesProvider } from './context/TradesContext';
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
    <TradesProvider>
      <header className="flex gap-1 items-center">
        <Book size={32} />
        <a style={{ fontWeight: 600 }}>TRADES</a>
        <a>DASHBOARD</a>
        {/* <a>PROFILE</a> */}
        <span className="flex-1" />
        {session?.user.user_metadata['display_name'] || session?.user.email}
        <button onClick={() => supabase.auth.signOut()}>
          <LogOut /> Logout
        </button>
      </header>
      <main>
        <TradesTable />
      </main>
      <footer></footer>
    </TradesProvider>
  );
}
