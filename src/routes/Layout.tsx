import { Book, LogOut } from 'react-feather';
import { NavLink, Outlet } from 'react-router';
import { useSessionContext } from './context/SessionContext';
import { supabase } from './lib/database/SupabaseClient';
import { TradesProvider } from './context/TradesContext';

export default function Layout() {
  const { session } = useSessionContext();
  return (
    <TradesProvider>
      <header className="flex gap-1 items-center">
        <Book size={32} />
        <NavLink to="/">TRADES</NavLink>
        <NavLink to="/dashboard">DASHBOARD</NavLink>
        {/* <a>PROFILE</a> */}
        <span className="flex-1" />
        {session?.user.user_metadata['display_name'] || session?.user.email}
        <button onClick={() => supabase.auth.signOut()}>
          <LogOut /> Logout
        </button>
      </header>
      <main>{<Outlet />}</main>
      <footer></footer>
    </TradesProvider>
  );
}
