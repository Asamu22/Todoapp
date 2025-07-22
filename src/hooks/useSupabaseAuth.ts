import { useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[Auth Debug] ${message}`, data || '');
  }
};

// Session storage helper
const SESSION_STORAGE_KEY = 'supabase-session';

const saveSessionToStorage = (session: any) => {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user,
        saved_at: Date.now()
      }));
      debugLog('Session saved to localStorage', { expires_at: session.expires_at });
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      debugLog('Session removed from localStorage');
    }
  } catch (error) {
    debugLog('Failed to save session to localStorage', error);
  }
};

const getSessionFromStorage = () => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      const now = Date.now();
      const savedAt = session.saved_at || 0;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - savedAt > maxAge) {
        debugLog('Stored session expired, removing');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      
      debugLog('Retrieved session from localStorage', { expires_at: session.expires_at });
      return session;
    }
  } catch (error) {
    debugLog('Failed to retrieve session from localStorage', error);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return null;
};

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setLoading(true);
        debugLog('Starting session check...');
        
        // First, try to get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          debugLog('Supabase getSession error', sessionError);
          
          // If Supabase session fails, try localStorage backup
          const storedSession = getSessionFromStorage();
          if (storedSession && storedSession.refresh_token) {
            debugLog('Attempting to refresh session from stored token');
            
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                refresh_token: storedSession.refresh_token
              });
              
              if (refreshError) {
                debugLog('Refresh session failed', refreshError);
                localStorage.removeItem(SESSION_STORAGE_KEY);
                throw refreshError;
              }
              
              if (refreshData.session) {
                debugLog('Session refreshed successfully');
                setUser(refreshData.session.user);
                saveSessionToStorage(refreshData.session);
              }
            } catch (refreshErr) {
              debugLog('Session refresh failed completely', refreshErr);
              setUser(null);
              setError('Session expired. Please sign in again.');
            }
          } else {
            throw sessionError;
          }
        } else {
          debugLog('Got session from Supabase', { 
            hasSession: !!session, 
            userId: session?.user?.id,
            expiresAt: session?.expires_at 
          });
          
          setUser(session?.user ?? null);
          
          // Save valid session to localStorage
          if (session) {
            saveSessionToStorage(session);
          }
        }
      } catch (err) {
        debugLog('Session initialization failed', err);
        setUser(null);
        const errorMessage = err instanceof AuthError ? err.message : 'Failed to initialize session';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setSessionChecked(true);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debugLog('Auth state changed', { 
          event, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            debugLog('User signed in');
            if (session) {
              saveSessionToStorage(session);
            }
            break;
          case 'SIGNED_OUT':
            debugLog('User signed out');
            saveSessionToStorage(null);
            break;
          case 'TOKEN_REFRESHED':
            debugLog('Token refreshed');
            if (session) {
              saveSessionToStorage(session);
            }
            break;
          case 'USER_UPDATED':
            debugLog('User updated');
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user || !sessionChecked) return;
    
    const checkAndRefreshToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.expires_at) {
          const expiresAt = session.expires_at * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
          
          if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
            debugLog('Token expiring soon, refreshing...', { 
              timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + 's' 
            });
            
            const { error } = await supabase.auth.refreshSession();
            if (error) {
              debugLog('Auto-refresh failed', error);
            } else {
              debugLog('Auto-refresh successful');
            }
          }
        }
      } catch (err) {
        debugLog('Token check failed', err);
      }
    };
    
    // Check token every minute
    const interval = setInterval(checkAndRefreshToken, 60 * 1000);
    
    // Initial check
    checkAndRefreshToken();
    
    return () => clearInterval(interval);
  }, [user, sessionChecked]);
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setError(null);
      debugLog('Attempting sign up', { email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0], // Use provided name or email prefix
          }
        }
      });
      
      if (error) {
        debugLog('Sign up error', error);
        throw error;
      }
      
      // Check if user was created successfully
      if (data.user && !data.user.email_confirmed_at) {
        debugLog('Sign up successful - email confirmation required', { userId: data.user?.id });
        // For development, we might want to handle unconfirmed users differently
        return data;
      }
      
      debugLog('Sign up successful', { userId: data.user?.id });
      return data;
    } catch (err) {
      const errorMessage = err instanceof AuthError ? err.message : 'Failed to sign up';
      setError(errorMessage);
      debugLog('Sign up failed', errorMessage);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      debugLog('Attempting sign in', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        debugLog('Sign in error', error);
        throw error;
      }
      
      debugLog('Sign in successful', { userId: data.user?.id });
      
      // Save session immediately after successful sign in
      if (data.session) {
        saveSessionToStorage(data.session);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof AuthError ? err.message : 'Failed to sign in';
      setError(errorMessage);
      debugLog('Sign in failed', errorMessage);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      debugLog('Attempting sign out');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debugLog('Sign out error', error);
        throw error;
      }
      
      debugLog('Sign out successful');
      saveSessionToStorage(null);
    } catch (err) {
      const errorMessage = err instanceof AuthError ? err.message : 'Failed to sign out';
      setError(errorMessage);
      debugLog('Sign out failed', errorMessage);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    sessionChecked
  };
};