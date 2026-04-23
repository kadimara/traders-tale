import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSessionContext } from '../lib/context/SessionContext';
import { supabase } from '@lib/database/SupabaseClient';

type Mode = 'signin' | 'signup' | 'confirm';

export default function Auth() {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: '/' });
  }, [session, navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setMode('confirm');
    setLoading(false);
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius)',
    padding: 24,
    minWidth: 280,
  };

  if (mode === 'confirm') {
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
          <p style={{ margin: 0, fontWeight: 600 }}>Check your email</p>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
            A confirmation link has been sent to <strong>{email}</strong>. Click
            it to activate your account, then sign in.
          </p>
          <button onClick={() => switchMode('signin')}>Back to Sign In</button>
        </div>
      </main>
    );
  }

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
        {mode === 'signup' && (
          <input
            className="border p-2"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}
        {error && <p style={{ color: 'var(--color-red, #f87171)' }}>{error}</p>}
        {mode === 'signin' ? (
          <>
            <button onClick={handleSignIn} disabled={loading}>
              Sign In
            </button>
            <p
              style={{
                margin: 0,
                textAlign: 'center',
              }}
            >
              No account?{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => switchMode('signup')}
              >
                Sign up
              </span>
            </p>
          </>
        ) : (
          <>
            <button onClick={handleSignUp} disabled={loading}>
              Sign Up
            </button>
            <p
              style={{
                margin: 0,
                textAlign: 'center',
              }}
            >
              Already have an account?{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => switchMode('signin')}
              >
                Sign in
              </span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
