import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSessionContext } from '../lib/context/SessionContext';
import { supabase } from '@lib/database/SupabaseClient';

export default function Auth() {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: '/' });
  }, [session, navigate]);

  // async function handleSignUp() {
  //   setLoading(true);
  //   const { error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //   });
  //   if (error) alert(error.message);
  //   else alert('Check your email for confirmation!');
  //   setLoading(false);
  // }

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
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
    <div
        className="flex flex-col gap-1"
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          padding: 24,
          minWidth: 280,
        }}
      >
      <input
        className="border p-2"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignIn} disabled={loading}>
        Sign In
      </button>
      {/* <button onClick={handleSignUp} disabled={loading}>
        Sign Up
      </button> */}
    </div>
    </main>
  );
}
