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
  login: (input: LoginInput) => boolean;
  logout: () => void;
  canAccess: (roles?: AppRole[]) => boolean;
}

const STORAGE_KEY = 'formflow_auth_user';

const ROLE_SEEDS: Record<
  AppRole,
  Pick<AuthUser, 'name' | 'organizationName' | 'plan' | 'avatarUrl'> & { tenantId?: string }
> = {
  'Super Admin': {
    name: 'Platform Admin',
    organizationName: 'Platform Organization',
    plan: 'Enterprise',
    tenantId: undefined,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
  },
  Admin: {
    name: 'Agency Admin',
    organizationName: 'Agency Workspace',
    plan: 'Growth Plan',
    avatarUrl:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=200',
  },
  Developer: {
    name: 'Solution Developer',
    organizationName: 'Agency Workspace',
    plan: 'Growth Plan',
    avatarUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=200',
  },
  User: {
    name: 'Platform User',
    organizationName: 'Agency Workspace',
    plan: 'Starter',
    avatarUrl:
      'https://images.unsplash.com/photo-1534665482403-a909d0d7a5af?auto=format&fit=crop&q=80&w=200',
  },
};

const resolveRoleFromEmail = (email: string): AppRole => {
  const normalized = email.toLowerCase();
  if (normalized.includes('superadmin')) return 'Super Admin';
  if (normalized.includes('admin')) return 'Admin';
  if (normalized.includes('developer')) return 'Developer';
  return 'User';
};

const resolveTenant = (role: AppRole, email: string): string | undefined => {
  if (role === 'Super Admin') return undefined;
  return email.endsWith('@formflow.io') ? 'tenant_acme' : undefined;
};

const seedUser = (email: string): AuthUser => {
  const resolvedRole = resolveRoleFromEmail(email);
  const seed = ROLE_SEEDS[resolvedRole];

  return {
    id: `${resolvedRole.toLowerCase().replace(/ /g, '-')}-user`,
    email,
    role: resolvedRole,
    tenantId: resolveTenant(resolvedRole, email),
    avatarUrl: seed.avatarUrl,
    organizationName: seed.organizationName,
    plan: seed.plan,
    name: seed.name,
  };
};

const defaultContext: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  login: () => false,
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

  const login = ({ email, password }: LoginInput): boolean => {
    const cleanedEmail = String(email || '').toLowerCase().trim();
    const cleanedPassword = String(password || '').trim();

    if (!cleanedEmail || !cleanedPassword) {
      return false;
    }

    const profile = seedUser(cleanedEmail);
    setUser(profile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
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
