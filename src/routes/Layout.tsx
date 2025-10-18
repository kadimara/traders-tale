import { Book, LogOut } from 'react-feather';
import { Link } from '../components/Router';
import { useSessionContext } from '../context/SessionContext';
import { TradesProvider } from '../context/TradesContext';
import { supabase } from '../lib/database/SupabaseClient';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { session } = useSessionContext();
  return (
    <TradesProvider>
      <header className="flex gap-1 items-center">
        <Book size={24} />
        <Link to="">DASHBOARD</Link>
        <Link to="trades">TRADES</Link>
        {/* <a>PROFILE</a> */}
        <span className="flex-1" />
        Welcome,{' '}
        {session?.user.user_metadata['display_name'] || session?.user.email}
        <span className="flex-1" />
        <button
          onClick={() => supabase.auth.signOut()}
          title="logout"
          aria-label="logout"
        >
          <LogOut />
        </button>
      </header>
      {children}
      <footer></footer>
    </TradesProvider>
  );
}
