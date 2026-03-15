import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginRes, LicenseInfo } from '../api/client';
import { api } from '../api/client';
import { getComputerId } from '../utils/computerId';

type AuthContextType = {
  user: User | null;
  token: string | null;
  license: LicenseInfo | null;
  computerId: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const computerId = getComputerId();

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    const l = localStorage.getItem('license');
    if (t && u) {
      setToken(t);
      try {
        setUser(JSON.parse(u));
        setLicense(l ? JSON.parse(l) : null);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('license');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginRes>('/auth/login', {
      email,
      password,
      computerId,
    });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.license) {
      localStorage.setItem('license', JSON.stringify(data.license));
      setLicense(data.license);
    }
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('license');
    setToken(null);
    setUser(null);
    setLicense(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, license, computerId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
