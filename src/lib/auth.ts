import { supabase } from './supabase';

export async function getOrCreateSession(): Promise<string | null> {
  // 1. Check for an existing persisted session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    console.log('[auth] existing session, user:', session.user.id);
    return session.user.id;
  }

  // 2. Sign in anonymously — throw on error so caller captures the real message
  console.log('[auth] no session — calling signInAnonymously');
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('[auth] signInAnonymously error:', error.message, error.status);
    throw new Error(`Anonymous sign-in failed: ${error.message} (status ${error.status ?? 'unknown'})`);
  }

  console.log('[auth] signInAnonymously data.user?.id:', data.user?.id ?? 'null');
  if (data.user?.id) return data.user.id;

  // 3. Fallback: re-read user from auth state
  //    (session may be set on the listener even if data.user is null)
  console.log('[auth] data.user null — calling getUser fallback');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(`getUser fallback failed: ${userError.message}`);
  }
  console.log('[auth] getUser fallback user?.id:', userData.user?.id ?? 'null');
  return userData.user?.id ?? null;
}
