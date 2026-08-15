import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services';
import { getErrorMessage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tams_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('tams_token');
    localStorage.removeItem('tams_user');
    setUser(null);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login(email, password);
    localStorage.setItem('tams_token', data.access_token);
    const me = await authAPI.getMe();
    localStorage.setItem('tams_user', JSON.stringify(me.data));
    setUser(me.data);
    return me.data;
  };

  useEffect(() => {
    const token = localStorage.getItem('tams_token');
    if (!token) { setLoading(false); return; }
    authAPI.getMe()
      .then(({ data }) => { setUser(data); localStorage.setItem('tams_user', JSON.stringify(data)); })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { getErrorMessage };
