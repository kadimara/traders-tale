import { useEffect, useState } from 'react';
import { navigate } from '../components/Router';
import { useSessionContext } from '../context/SessionContext';
import { supabase } from '../lib/database/SupabaseClient';

export default function Login() {
  const { session } = useSessionContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    session && navigate('');
  }, [session]);

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
    <dialog
      className="flex flex-col gap-1"
      style={{ alignSelf: 'anchor-center' }}
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
    </dialog>
  );
}
