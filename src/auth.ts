import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

let cachedAccessToken: string | null = null;
let currentUser: User | null = null;

// The deployed GitHub Pages URL for redirect after OAuth
const REDIRECT_URL = 'https://ihkarise.github.io/wisemedicinestock/';

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      currentUser = session.user;
      cachedAccessToken = session.provider_token || null;
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(session.user, cachedAccessToken);
      } else if (onAuthFailure) {
        onAuthFailure();
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      cachedAccessToken = session.provider_token || null;
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(session.user, cachedAccessToken);
      } else if (onAuthFailure && !cachedAccessToken) {
        onAuthFailure();
      }
    } else {
      currentUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    alert('Supabase integration requires configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    throw new Error('Supabase configuration missing.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
      redirectTo: REDIRECT_URL,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return null; // OAuth redirect flow, auth state handled by onAuthStateChange
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    cachedAccessToken = session.provider_token;
    return cachedAccessToken;
  }
  return null;
};

export const logout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  currentUser = null;
};
