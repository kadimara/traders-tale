import type { AuthRecord } from 'pocketbase';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { pb } from '@lib/database/PocketBaseClient';
import { router } from '../../router';

type SessionContextType = {
  user: AuthRecord;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function isPublicRoute() {
  return window.location.pathname.startsWith('/trade/');
}

function currentUser() {
  return pb.authStore.isValid ? pb.authStore.record : null;
}

export function SessionProvider({ children }: PropsWithChildren) {
  // The SDK restores the auth token from localStorage synchronously.
  const [user, setUser] = useState<AuthRecord>(currentUser);

  useEffect(() => {
    if (!currentUser() && !isPublicRoute()) router.navigate({ to: '/auth' });

    // Refresh the stored token so an expired or deleted account logs out.
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .catch(() => pb.authStore.clear());
    }

    // Listen for login / logout
    return pb.authStore.onChange(() => {
      const next = currentUser();
      setUser(next);
      if (!next && !isPublicRoute()) router.navigate({ to: '/auth' });
    });
  }, []);

  return (
    <SessionContext.Provider value={{ user }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used inside SessionProvider');
  return ctx;
}
