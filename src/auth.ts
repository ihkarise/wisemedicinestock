import { createClient, User, Session } from '@supabase/supabase-js';

// Supports both VITE_ and NEXT_PUBLIC_ prefixes for flexibility
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type AuthUser = User;

// ── Supabase-native auth (Magic Link / Email OTP) ──────────────────────────

/**
 * Send a magic-link email. The user clicks the link and is redirected back.
 * No Google Cloud Console setup required.
 */
export const sendMagicLink = async (email: string): Promise<void> => {
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    alert('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_ variants).');
    throw new Error('Supabase configuration missing.');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  });
  if (error) throw error;
};

/** Sign out the current user. */
export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/** Get the current session (null if not logged in). */
export const getSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export const onAuthChange = (
  callback: (user: User | null) => void
): (() => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};
