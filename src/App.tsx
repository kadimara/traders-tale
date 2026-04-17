import { RouterProvider } from '@tanstack/react-router';
import { SessionProvider } from './lib/context/SessionContext';
import { router } from './router';

export default function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
