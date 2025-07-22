import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Debug logging for Supabase client
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[Supabase Client] ${message}`, data || '');
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try {
          const item = localStorage.getItem(key);
          debugLog(`Storage getItem: ${key}`, item ? 'found' : 'not found');
          return item;
        } catch (error) {
          debugLog(`Storage getItem error for ${key}`, error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          debugLog(`Storage setItem: ${key}`, 'success');
        } catch (error) {
          debugLog(`Storage setItem error for ${key}`, error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          debugLog(`Storage removeItem: ${key}`, 'success');
        } catch (error) {
          debugLog(`Storage removeItem error for ${key}`, error);
        }
      }
    }
  }
});

// Add global error handler for Supabase
supabase.auth.onAuthStateChange((event, session) => {
  debugLog('Global auth state change', { event, hasSession: !!session });
});

// Helper function to get current user
export const getCurrentUser = async () => {
  debugLog('Getting current user...');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    debugLog('Get current user error', error);
    throw error;
  }
  debugLog('Current user retrieved', { userId: user?.id });
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  debugLog('Signing out via helper...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    debugLog('Sign out helper error', error);
    throw error;
  }
  debugLog('Sign out helper successful');
};