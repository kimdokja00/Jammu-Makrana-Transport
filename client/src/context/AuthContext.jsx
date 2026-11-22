import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, googleAuthUser, getMe } from '../lib/api.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'jmt_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    let active = true;

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const res = await getMe(storedToken);
        if (active && res?.user) {
          setUser(res.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initAuth();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password);
    if (res?.token && res?.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res?.error || 'Login failed');
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerUser(data);
    if (res?.token && res?.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res?.error || 'Registration failed');
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await googleAuthUser(credential);
    if (res?.token && res?.user) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res?.error || 'Google login failed');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    isAuthenticated: Boolean(user && token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
