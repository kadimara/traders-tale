import { supabase } from '@lib/database/SupabaseClient';
import { Book, LogOut } from 'react-feather';
import MonthHeader from '../lib/components/MonthHeader';
import { Link } from '@tanstack/react-router';
import { useSessionContext } from '../lib/context/SessionContext';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { session } = useSessionContext();
  return (
    <>
      <header className="flex gap-1 align-items-center">
        <Book size={24} />
        <Link to="/">DASHBOARD</Link>
        <Link to="/spot">SPOT</Link>
        <Link to="/futures">FUTURES</Link>
        {/* <a>PROFILE</a> */}
        <span className="flex-1" />
        <span>{session?.user.user_metadata['display_name'] || session?.user.email}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          title="logout"
          aria-label="logout"
        >
          <LogOut />
        </button>
      </header>
      <MonthHeader />
      {children}
      <footer></footer>
    </>
  );
}
