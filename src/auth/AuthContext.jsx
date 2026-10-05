import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('topTierToken'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('topTierUser');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [authReady, setAuthReady] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem('topTierToken');
    localStorage.removeItem('topTierUser');
    setToken(null);
    setUser(null);
  }, []);

  const persist = useCallback((newToken, newUser) => {
    localStorage.setItem('topTierToken', newToken);
    localStorage.setItem('topTierUser', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const storedToken = localStorage.getItem('topTierToken');
      if (!storedToken) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        const freshUser = await api.getMyProfile();
        if (active) {
          localStorage.setItem('topTierUser', JSON.stringify(freshUser));
          setUser(freshUser);
          setToken(storedToken);
        }
      } catch (error) {
        if (active && (error.status === 401 || error.status === 403 || error.status === 404)) clearSession();
      } finally {
        if (active) setAuthReady(true);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const signup = useCallback(async (payload) => {
    const data = await api.signup(payload);
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const loginWithGoogle = useCallback(async (referralCode = '') => {
    if (!supabase) throw new Error('Google sign-in is not configured yet.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/?google=1${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}` },
    });
    if (error) throw error;
  }, []);

  const completeGoogleLogin = useCallback(async () => {
    if (!supabase) return false;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;
    const referralCode = params.get('ref') || '';
    const data = await api.googleLogin(session.access_token, referralCode);
    persist(data.token, data.user);
    await supabase.auth.signOut();
    return true;
  }, [persist]);

  const logout = useCallback(() => clearSession(), [clearSession]);

  useEffect(() => {
    let active = true;
    if (!window.location.search.includes('google=1')) return undefined;
    completeGoogleLogin().then((completed) => {
      if (!active) return;
      if (completed) window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      else console.error('[auth] Google sign-in returned without a Supabase session');
    }).catch((error) => {
      if (active) console.error('[auth] Google sign-in failed:', error.message);
    });
    return () => { active = false; };
  }, [completeGoogleLogin]);

  return <AuthContext.Provider value={{ token, user, login, signup, loginWithGoogle, completeGoogleLogin, logout, authReady }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
