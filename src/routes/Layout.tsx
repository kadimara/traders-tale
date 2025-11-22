import { Book, LogOut } from 'react-feather';
import { Link } from '../lib/components/Router';
import { useSessionContext } from '../lib/context/SessionContext';
import { TradesProvider } from '../lib/context/TradesContext';
import { supabase } from '@lib/database/SupabaseClient';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { session } = useSessionContext();
  return (
    <TradesProvider>
      <header className="flex gap-1 align-items-center">
        <Book size={24} />
        <Link to="">DASHBOARD</Link>
        <Link to="spot">SPOT</Link>
        <Link to="futures">FUTURES</Link>
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
