import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { UserProfile } from '../types';
import { getApiBaseCandidates } from '../config/apiBase';

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
const API_BASES = getApiBaseCandidates();

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

const COOKIE_NAME = 'formflow_auth_token';

const AuthContext = createContext<AuthContextValue>(defaultContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const token = window.localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!stored) return null;
    if (!token) return null;
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
    if (!cleanedEmail || !cleanedPassword) return false;

    const payload = JSON.stringify({
      email: cleanedEmail,
      password: cleanedPassword,
    });

    const authEndpoints = Array.from(
      new Set(
        API_BASES.flatMap((base) => {
          const trimmedBase = String(base || '').replace(/\/+$/, '');
          if (!trimmedBase) return [];
          const candidates = new Set<string>();
          candidates.add(`${trimmedBase}/auth/login`);
          if (!trimmedBase.endsWith('/api')) {
            candidates.add(`${trimmedBase}/api/auth/login`);
          } else {
            candidates.add(trimmedBase.replace(/\/api$/, '/api') + '/auth/login');
          }
          return Array.from(candidates);
        })
      )
    );

    const endpoints = authEndpoints.length ? authEndpoints : ['/api/auth/login'];
    let response: Response | null = null;
    let raw: ApiOk | ApiError | null = null;

    for (const endpoint of endpoints) {
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: payload,
        });
        raw = (await response.json().catch(() => null)) as ApiOk | ApiError | null;

        if (response.ok) {
          break;
        }

        if (response.status === 404) {
          response = null;
          raw = null;
          continue;
        }

        break;
      } catch {
        response = null;
        raw = null;
      }
    }

    if (!response || !raw || raw.ok !== true || !raw.data?.token || !raw.data?.user) {
      return false;
    }

    const authData = raw as ApiOk;
    const profile = authData.data.user;
    const token = authData.data.token || '';
    setUser(profile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=86400; SameSite=Lax${
      window.location.protocol === 'https:' ? '; Secure' : ''
    }`;
    return true;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
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
