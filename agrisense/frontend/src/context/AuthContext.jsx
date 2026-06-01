import { createContext, useContext, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(!!getToken());

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setToken(data.access_token);
    setAuthenticated(true);
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await api.register(username, password);
    setToken(data.access_token);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
