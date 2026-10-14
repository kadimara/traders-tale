import { pb } from '@lib/database/PocketBaseClient';
import { Book, LogOut } from 'react-feather';
import { Link } from '@tanstack/react-router';
import { useSessionContext } from '../lib/context/SessionContext';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { user } = useSessionContext();
  return (
    <>
      <header className="flex gap-1 align-items-center">
        <Book size={32} />
        <Link
          to="/"
          activeProps={{
            style: { color: 'var(--color-text)', textDecoration: 'underline' },
          }}
        >
          DASHBOARD
        </Link>
        <Link
          to="/journal"
          activeProps={{
            style: { color: 'var(--color-text)', textDecoration: 'underline' },
          }}
        >
          JOURNAL
        </Link>
        <Link
          to="/playbook"
          activeProps={{
            style: { color: 'var(--color-text)', textDecoration: 'underline' },
          }}
        >
          PLAYBOOK
        </Link>
        {/* <a>PROFILE</a> */}
        <span className="flex-1" />
        <span className="text-muted">
          {user?.name || user?.email}
        </span>
        <button
          onClick={() => pb.authStore.clear()}
          title="logout"
          aria-label="logout"
        >
          <LogOut />
        </button>
      </header>
      {children}
      <footer></footer>
    </>
  );
}
