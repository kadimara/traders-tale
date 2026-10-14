import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSessionContext } from '../lib/context/SessionContext';
import { ClientResponseError } from 'pocketbase';
import { pb } from '@lib/database/PocketBaseClient';

function errorMessage(err: unknown) {
  if (err instanceof ClientResponseError) {
    // Prefer field-level messages, e.g. "identity: Cannot be blank."
    const fields = Object.entries(err.response?.data ?? {}).map(
      ([field, detail]) => `${field}: ${(detail as { message: string }).message}`,
    );
    return fields.length ? fields.join(' ') : err.message;
  }
  return String(err);
}

// Sign-in only: public sign-ups are closed; accounts are created in the
// PocketBase dashboard.
export default function Auth() {
  const { user } = useSessionContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: '/' });
  }, [user, navigate]);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await pb.collection('users').authWithPassword(email, password);
    } catch (err) {
      setError(errorMessage(err));
    }
    setLoading(false);
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius)',
    padding: 24,
    minWidth: 280,
  };

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <div className="flex flex-col gap-1" style={cardStyle}>
        <input
          className="border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: 'var(--color-red, #f87171)' }}>{error}</p>}
        <button onClick={handleSignIn} disabled={loading}>
          Sign In
        </button>
      </div>
    </main>
  );
}
