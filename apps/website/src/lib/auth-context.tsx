'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: { email?: string; phone?: string; password: string; fullName: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      api.get<any>('/auth/me', storedToken)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setLoading(false);
    };
    window.addEventListener('banco-auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('banco-auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (identifier: string, password: string) => {
    const value = identifier.trim();
    const credentials = value.includes('@') ? { email: value, password } : { phone: value, password };
    const result = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', credentials);
    setUser(result.user);
    setToken(result.accessToken);
    localStorage.setItem('token', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
  };

  const register = async (input: { email?: string; phone?: string; password: string; fullName: string }) => {
    const result = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', input);
    setUser(result.user);
    setToken(result.accessToken);
    localStorage.setItem('token', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) {
      throw new Error('Login is required');
    }
    await api.patch<null>('/auth/change-password', { currentPassword, newPassword }, token);
    setUser(previous => previous ? { ...previous, mustChangePassword: false } : previous);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, changePassword, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
