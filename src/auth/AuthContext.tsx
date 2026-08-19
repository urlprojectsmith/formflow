import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { UserProfile } from '../types';

export type AppRole = 'Super Admin' | 'Admin' | 'Developer' | 'User';

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthUser extends UserProfile {
  role: AppRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<boolean>;
  logout: () => void;
  canAccess: (roles?: AppRole[]) => boolean;
}

const STORAGE_KEY = 'formflow_auth_user';
const STORAGE_TOKEN_KEY = 'formflow_auth_token';
const API_BASE = (() => {
  const raw = String(import.meta.env.VITE_API_BASE_URL || '/api').trim();
  if (!raw) {
    return '/api';
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const path = (parsed.pathname || '/').replace(/\/+$/, '');
      if (!path || path === '') {
        return `${parsed.origin}/api`;
      }
      if (path === '/api') {
        return `${parsed.origin}/api`;
      }
      return `${parsed.origin}${path}/api`;
    } catch {
      return '/api';
    }
  }

  if (raw.startsWith('/')) {
    const path = raw.replace(/\/+$/, '');
    if (!path || path === '/') {
      return '/api';
    }
    if (path === '/api') {
      return '/api';
    }
    return `${path}/api`;
  }

  return `${raw.replace(/\/+$/, '')}/api`;
})();

interface ApiError {
  ok: false;
  error: string;
}

interface ApiOk {
  ok: true;
  data: {
    token: string;
    user: AuthUser;
    expiresAt: number;
  };
}

const defaultContext: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  login: () => Promise.resolve(false),
  logout: () => undefined,
  canAccess: () => false,
};

const AuthContext = createContext<AuthContextValue>(defaultContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      return parsed;
    } catch {
      return null;
    }
  });

  const login = async ({ email, password }: LoginInput): Promise<boolean> => {
    const cleanedEmail = String(email || '').toLowerCase().trim();
    const cleanedPassword = String(password || '').trim();

    if (!cleanedEmail || !cleanedPassword) {
      return false;
    }

    try {
      const requestBodies = JSON.stringify({ email: cleanedEmail, password: cleanedPassword });
      const endpoints = [API_BASE ? `${API_BASE}/auth/login` : '', '/api/auth/login'];
      let res: Response | null = null;
      let raw: ApiOk | ApiError | null = null;

      for (const endpoint of endpoints) {
        if (!endpoint) continue;
        try {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBodies,
          });
          raw = (await res.json().catch(() => null)) as ApiOk | ApiError | null;
          if (res.ok || (raw && raw.ok === false && res.status === 401)) {
            break;
          }
        } catch {
          res = null;
          raw = null;
        }
      }

      if (!res || !raw || raw.ok !== true || !raw.data?.token || !raw.data?.user) {
        return false;
      }
      const authData = raw as ApiOk;
      const profile = authData.data.user;
      setUser(profile);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      window.localStorage.setItem(STORAGE_TOKEN_KEY, authData.data.token || '');
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      canAccess: (roles?: AppRole[]) => {
        if (!user) return false;
        if (!roles || roles.length === 0) return true;
        return roles.includes(user.role);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
