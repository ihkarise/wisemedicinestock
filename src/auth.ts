import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

let cachedAccessToken: string | null = null;
let currentUser: User | null = null;

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
    alert("Supabase integration requires configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, and configure Google auth provider inside Supabase Dashboard.");
    throw new Error('Supabase configuration missing.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
      // Using redirect for OAuth to conform to standard GH pages behavior where popups might get blocked or cross-origin isn't ideal.
    }
  });
  
  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }
  
  // NOTE: This will redirect. The return empty here handles logic post-redirect.
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  currentUser = null;
};
