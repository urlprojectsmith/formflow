import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  Users,
  Wallet,
  Crown,
  ArrowRight,
  Trash2,
  Pencil,
  X,
  UserPlus,
} from 'lucide-react';
import { TenantAccount, TenantStatus, UserProfile } from '../types';
import { getApiBaseCandidates } from '../config/apiBase';

const API_BASES = getApiBaseCandidates();

const STORAGE_TOKEN_KEY = 'formflow_auth_token';

interface ApiOk<T> {
  ok: true;
  data: T;
}

interface ApiFail {
  ok: false;
  error: string;
}

type TenantFormRole = 'Admin' | 'Developer' | 'User';

type TenantFormInput = {
  name: string;
  slug: string;
  status: TenantStatus;
  plan: TenantAccount['plan'];
  adminName: string;
  adminEmail: string;
};

type UserFormInput = {
  name: string;
  email: string;
  role: TenantFormRole;
  organizationName: string;
  tenantIds: string[];
  password: string;
};

const ROLE_OPTIONS: TenantFormRole[] = ['Admin', 'Developer', 'User'];
const PLAN_OPTIONS: TenantAccount['plan'][] = ['Starter', 'Growth Plan', 'Enterprise'];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const defaultTenantForm = (): TenantFormInput => ({
  name: '',
  slug: '',
  status: 'active',
  plan: 'Growth Plan',
  adminName: '',
  adminEmail: '',
});

const defaultUserForm = (tenant?: TenantAccount | null): UserFormInput => ({
  name: '',
  email: '',
  role: 'User',
  organizationName: tenant?.name || '',
  tenantIds: tenant?.id ? [tenant.id] : [],
  password: '',
});

const normalizeToken = () => {
  if (typeof window === 'undefined') return '';
  const token = window.localStorage.getItem(STORAGE_TOKEN_KEY) || '';
  if (token) return token;
  const tokenCookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${STORAGE_TOKEN_KEY}=`));
  if (!tokenCookie) return '';
  const value = tokenCookie.substring(tokenCookie.indexOf('=') + 1);
  return decodeURIComponent(value || '').trim();
};

const apiRequest = async <T,>(
  path: string,
  init: RequestInit = {}
): Promise<T | null> => {
  const token = normalizeToken();
  let lastError: Error | null = null;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  const endpointSuffix = normalizedPath;

  for (const base of API_BASES) {
    const endpoint = `${base}${endpointSuffix}`;
    try {
      const response = await fetch(endpoint, {
        ...(init.body ? { body: init.body } : {}),
        method: init.method || 'GET',
        credentials: 'include',
        headers,
        ...init,
      });
      const raw = (await response.json().catch(() => null)) as ApiOk<T> | ApiFail | null;

      if (!response.ok) {
        if (response.status === 404) {
          lastError = new Error(`API endpoint not available at ${endpoint}`);
          continue;
        }
        return null;
      }

      if (!raw || raw.ok !== true) {
        return null;
      }

      return raw.data;
    } catch (error) {
      if (error instanceof TypeError) {
        continue;
      }
      if (error instanceof Error) {
        lastError = error;
        continue;
      }
      continue;
    }
  }

  return null;
};

const mergeUsers = (nextUsers: UserProfile[]) => {
  const indexed = new Map<string, UserProfile>();
  for (const user of nextUsers) {
    const existing = indexed.get(user.id);
    if (!existing) {
      indexed.set(user.id, {
        ...user,
        tenantIds: user.tenantIds || (user.tenantId ? [user.tenantId] : []),
      });
      continue;
    }
    indexed.set(user.id, {
      ...existing,
      ...user,
      tenantIds: Array.from(
        new Set([...(existing.tenantIds || []), ...(Array.isArray(user.tenantIds) ? user.tenantIds : [])])
      ),
    });
  }
  return Array.from(indexed.values());
};

export const SuperAgencyDashboardPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantAccount[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenantForm, setTenantForm] = useState<TenantFormInput>(defaultTenantForm());
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [tenantStatusMessage, setTenantStatusMessage] = useState<string>('');

  const [userForm, setUserForm] = useState<UserFormInput>(defaultUserForm());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userStatusMessage, setUserStatusMessage] = useState<string>('');

  const loadUsersForTenants = async (tenantList: TenantAccount[]) => {
    if (!tenantList.length) {
      setUsers([]);
      return;
    }
    const responses = await Promise.all(
      tenantList.map((tenant) =>
        apiRequest<UserProfile[]>(`/tenants/${tenant.id}/users`)
          .catch(() => null)
          .then((result) => result || [])
      )
    );
    const allUsers = responses.flat();
    const merged = mergeUsers(allUsers);
    setUsers(merged);
  };

  const loadData = async () => {
    const tenantData = await apiRequest<TenantAccount[]>('/tenants');
    const nextTenants = Array.isArray(tenantData) ? tenantData : [];
    setTenants(nextTenants);
    await loadUsersForTenants(nextTenants);
  };

  useEffect(() => {
    loadData().catch(() => {
      setTenantStatusMessage('Unable to load accounts. Please verify login/session.');
    });
  }, []);

  useEffect(() => {
    if (!selectedTenantId && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
      return;
    }
    const current = tenants.find((tenant) => tenant.id === selectedTenantId);
    if (!current && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) || tenants[0] || null,
    [selectedTenantId, tenants]
  );

  const selectedTenantUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.tenantId === selectedTenant?.id || (Array.isArray(user.tenantIds) && user.tenantIds.includes(selectedTenant?.id || ''))
      ),
    [users, selectedTenant]
  );

  const summary = useMemo(() => {
    const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
    const managedUsers = users.filter((user) => user.role !== 'Super Admin').length;
    const enterpriseTenants = tenants.filter((tenant) => tenant.plan === 'Enterprise').length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      managedUsers,
      enterpriseTenants,
    };
  }, [tenants, users]);

  const syncUserTenantContext = (tenant: TenantAccount | null) => {
    if (tenant) {
      setUserForm({
        ...defaultUserForm(tenant),
      });
    } else {
      setUserForm(defaultUserForm(null));
    }
    setEditingUserId(null);
    setUserStatusMessage('');
  };

  const onCreateOrUpdateTenant = async (event: FormEvent) => {
    event.preventDefault();

      if (!tenantForm.name.trim()) {
      setTenantStatusMessage('Tenant name is required.');
      return;
    }

    if (!tenantForm.slug.trim()) {
      setTenantStatusMessage('Tenant slug is required.');
      return;
    }

    const normalizedSlug = slugify(tenantForm.slug);
    const slugConflict = tenants.some(
      (tenant) =>
        tenant.id !== editingTenantId &&
        tenant.slug.toLowerCase() === normalizedSlug.toLowerCase()
    );

    if (slugConflict) {
      setTenantStatusMessage('Slug is already used by another account.');
      return;
    }

    if (editingTenantId) {
      const updated = await apiRequest<TenantAccount>(`/tenants/${editingTenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: tenantForm.name.trim(),
          slug: normalizedSlug,
          status: tenantForm.status,
          plan: tenantForm.plan,
          adminName: tenantForm.adminName.trim(),
          adminEmail: tenantForm.adminEmail.trim(),
        }),
      });
      if (!updated) {
        setTenantStatusMessage('Unable to update account.');
        return;
      }
      setTenants((current) => current.map((tenant) => (tenant.id === updated.id ? updated : tenant)));
      setTenantStatusMessage(`Account ${tenantForm.name} updated.`);
    } else {
      const tenant = await apiRequest<TenantAccount>('/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: tenantForm.name.trim(),
          slug: normalizedSlug,
          status: tenantForm.status,
          plan: tenantForm.plan,
          adminName: tenantForm.adminName.trim(),
          adminEmail: tenantForm.adminEmail.trim(),
        }),
      });
      if (!tenant) {
        setTenantStatusMessage('Unable to create account.');
        return;
      }
      setTenants((current) => [tenant, ...current]);
      setSelectedTenantId(tenant.id);
      setTenantStatusMessage(`Account ${tenantForm.name} created.`);
    }

    setTenantForm(defaultTenantForm());
    setEditingTenantId(null);
    await loadData();
  };

  const onDeleteTenant = async (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) return;
    if (!window.confirm(`Delete account "${tenant.name}" and remove all its users?`)) return;

    const response = await apiRequest<{ success: true }>(`/tenants/${tenantId}`, { method: 'DELETE' });
    if (!response) {
      setTenantStatusMessage('Unable to delete account.');
      return;
    }
    const remainingTenants = tenants.filter((item) => item.id !== tenantId);
    setTenants(remainingTenants);
    await loadData();
    const nextSelected = selectedTenantId === tenantId ? remainingTenants[0]?.id || '' : selectedTenantId;
    setSelectedTenantId(nextSelected);
    setTenantStatusMessage(`Account ${tenant.name} deleted.`);
    setEditingTenantId(null);
    setTenantForm(defaultTenantForm());
    syncUserTenantContext(nextSelected ? tenants.find((tenant) => tenant.id === nextSelected) || null : remainingTenants[0] || null);
  };

  const onSelectTenant = (tenantId: string) => {
    const next = tenants.find((tenant) => tenant.id === tenantId);
    if (next) {
      setSelectedTenantId(tenantId);
      syncUserTenantContext(next);
      setTenantStatusMessage('');
      setEditingTenantId(null);
      setTenantForm(defaultTenantForm());
    }
  };

  const onEditTenant = (tenant: TenantAccount) => {
    setSelectedTenantId(tenant.id);
    setEditingTenantId(tenant.id);
    setTenantForm({
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      adminName: tenant.adminName || '',
      adminEmail: tenant.adminEmail || '',
    });
    setTenantStatusMessage(`Editing account: ${tenant.name}`);
  };

  const onClearTenantEdit = () => {
    setEditingTenantId(null);
    setTenantForm(defaultTenantForm());
    setTenantStatusMessage('');
  };

  const onSubmitUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTenant) {
      setUserStatusMessage('Select an account first.');
      return;
    }
    const trimmedName = userForm.name.trim();
    const trimmedEmail = userForm.email.trim().toLowerCase();
    const trimmedPassword = userForm.password.trim();
    if (!trimmedName || !trimmedEmail) {
      setUserStatusMessage('User name and email are required.');
      return;
    }
    const tenantAssignments = Array.from(new Set(userForm.tenantIds.map((tenantId) => tenantId.trim()).filter(Boolean)));
    if (!tenantAssignments.length) {
      setUserStatusMessage('Select at least one agency account.');
      return;
    }

    if (editingUserId) {
      const updated = await apiRequest<UserProfile>(`/tenants/${selectedTenant.id}/users/${editingUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role: userForm.role,
          tenantIds: tenantAssignments,
          organizationName: selectedTenant.name,
          ...(trimmedPassword ? { password: trimmedPassword } : {}),
        }),
      });
      if (!updated) {
        setUserStatusMessage('Unable to update user.');
        return;
      }
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? { ...user, ...updated, tenantIds: updated.tenantIds || user.tenantIds } : user))
      );
      setUserStatusMessage(`User ${userForm.name} updated.`);
      await loadData();
    } else {
      if (!trimmedPassword) {
        setUserStatusMessage('Password is required for new users.');
        return;
      }
      const created = await apiRequest<UserProfile[]>('/tenant-users', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role: userForm.role,
          password: trimmedPassword,
          tenantIds: tenantAssignments,
          organizationName: selectedTenant.name,
        }),
      });
      if (!created?.length) {
        setUserStatusMessage('Unable to create user.');
        return;
      }
      await loadData();
      setUserStatusMessage(`User ${userForm.name} added.`);
    }

    syncUserTenantContext(selectedTenant);
  };

  const onEditUser = (user: UserProfile) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      role: (user.role === 'Admin' || user.role === 'Developer' || user.role === 'User' ? user.role : 'User'),
      tenantIds:
        Array.isArray(user.tenantIds) && user.tenantIds.length > 0
          ? user.tenantIds.filter(Boolean)
          : [user.tenantId || selectedTenantId || ''],
      organizationName: user.organizationName,
      password: user.password || '',
    });
    setUserStatusMessage(`Editing user: ${user.name}`);
  };

  const onDeleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user from this account?')) return;
    if (!selectedTenant) return;
    const removed = await apiRequest<{ success: true }>(`/tenants/${selectedTenant.id}/users/${userId}`, {
      method: 'DELETE',
    });
    if (!removed) {
      setUserStatusMessage('Unable to remove user from account.');
      return;
    }
    await loadData();
    setUserStatusMessage('User removed.');
    setEditingUserId(null);
    setUserForm(defaultUserForm(selectedTenant));
  };

  const onClearUserForm = () => {
    if (selectedTenant) {
      setUserForm(defaultUserForm(selectedTenant));
    }
    setEditingUserId(null);
    setUserStatusMessage('');
  };

  return (
    <div className="space-y-6">
      <header className="p-5 theme-surface border border-theme rounded-xl shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold theme-text-primary uppercase tracking-[0.25em]">Super Agency Control</p>
            <h1 className="text-2xl font-black theme-text-primary mt-1">Super Admin Agency Console</h1>
            <p className="text-sm theme-text-muted mt-1">
              Monitor every client and agency in one place, then direct operations and support quickly.
            </p>
          </div>
          <div className="hidden md:block">
            <span className="inline-flex items-center gap-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full">
              <Crown className="w-4 h-4" />
              Global Command View
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric title="Managed Accounts" value={summary.totalTenants.toString()} icon={Building2} subtitle="All tenant accounts" />
        <Metric title="Active Accounts" value={summary.activeTenants.toString()} icon={Briefcase} subtitle="Operational and paid accounts" />
        <Metric title="Platform Users" value={summary.managedUsers.toString()} icon={Users} subtitle="Non-platform-owner accounts" />
        <Metric title="Enterprise Accounts" value={summary.enterpriseTenants.toString()} icon={Wallet} subtitle="Accounts on enterprise plan" />
      </div>

      <section className="theme-surface border border-theme rounded-xl shadow-2xs">
        <div className="p-5 border-b border-theme">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] theme-text-muted">Agency Accounts Setup</p>
              <h2 className="text-lg font-black theme-text-primary mt-1">Manage all agency accounts</h2>
              <p className="text-xs theme-text-muted mt-1">Create, edit, and delete account entries. Select an account to manage scoped users.</p>
            </div>
            <button
              type="button"
              onClick={onClearTenantEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-theme theme-text-secondary hover:theme-surface-hover"
            >
              <span className="flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Reset
              </span>
            </button>
          </div>

          <form onSubmit={onCreateOrUpdateTenant} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2.5">
            <input
              value={tenantForm.name}
              onChange={(event) => setTenantForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Account name"
              className="px-3 py-2 text-sm border border-theme rounded-lg"
            />
            <input
              value={tenantForm.slug}
              onChange={(event) => setTenantForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="account-slug"
              className="px-3 py-2 text-sm border border-theme rounded-lg"
            />
            <select
              value={tenantForm.status}
              onChange={(event) =>
                setTenantForm((current) => ({ ...current, status: event.target.value as TenantStatus }))
              }
              className="px-3 py-2 text-sm border border-theme rounded-lg theme-surface"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
            <select
              value={tenantForm.plan}
              onChange={(event) => setTenantForm((current) => ({ ...current, plan: event.target.value as TenantAccount['plan'] }))}
              className="px-3 py-2 text-sm border border-theme rounded-lg theme-surface"
            >
              {PLAN_OPTIONS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
            <button className="px-3 py-2 text-sm font-bold theme-button-primary rounded-lg">
              {editingTenantId ? 'Update Account' : 'Add Account'}
            </button>
            <input
              value={tenantForm.adminName}
              onChange={(event) => setTenantForm((current) => ({ ...current, adminName: event.target.value }))}
              placeholder="Primary admin name"
              className="px-3 py-2 text-sm border border-theme rounded-lg md:col-span-2"
            />
            <input
              value={tenantForm.adminEmail}
              onChange={(event) => setTenantForm((current) => ({ ...current, adminEmail: event.target.value }))}
              placeholder="Primary admin email"
              className="px-3 py-2 text-sm border border-theme rounded-lg md:col-span-2"
            />
            <span className="text-xs px-3 py-2 theme-surface-hover border border-theme rounded-lg theme-text-muted md:col-span-5">
              {tenantStatusMessage || 'Tip: leave admin fields blank if assigned later.'}
            </span>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs theme-text-muted border-b border-theme">
                <th className="px-4 py-3 font-semibold">Agency Account</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Users</th>
                <th className="px-4 py-3 font-semibold">Primary Admin</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
              </thead>
            <tbody>
              {tenants.map((tenant) => {
                const tenantUserCount = users.filter(
                  (user) => user.tenantId === tenant.id || (Array.isArray(user.tenantIds) && user.tenantIds.includes(tenant.id))
                ).length;
                const isSelected = selectedTenantId === tenant.id;
                return (
                  <tr
                    key={tenant.id}
                    className={`border-b border-theme cursor-pointer ${isSelected ? 'theme-surface-hover' : 'hover:theme-surface-hover/70'}`}
                    onClick={() => onSelectTenant(tenant.id)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold theme-text-primary">{tenant.name}</p>
                        <p className="text-[11px] theme-text-muted">{tenant.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 theme-text-secondary">{tenant.plan}</td>
                    <td className="px-4 py-3 theme-text-secondary">{tenant.status}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full theme-surface-hover theme-text-secondary text-[11px] font-bold">
                        {tenantUserCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 theme-text-secondary">
                      <p>{tenant.adminName || '--'}</p>
                      <p className="text-[11px] theme-text-muted">{tenant.adminEmail || '--'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTenant(tenant);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-theme text-xs font-bold theme-text-secondary hover:theme-surface-hover flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTenant(tenant.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-theme text-xs font-bold theme-text-danger hover:theme-surface-hover flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tenants.length === 0 && (
                <tr>
                  <td className="px-4 py-6 theme-text-muted text-sm" colSpan={6}>
                    No accounts configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="theme-surface border border-theme rounded-xl shadow-2xs">
        <div className="p-5 border-b border-theme flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold theme-text-primary">
              Account User Management: {selectedTenant ? selectedTenant.name : 'Select an Account'}
            </h2>
            <p className="text-xs theme-text-muted">Only users for this account are shown and managed here.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedTenant && (
              <button
                type="button"
                onClick={() => onSelectTenant(selectedTenant.id)}
                className="text-xs font-bold theme-text-muted border border-theme px-2.5 py-1.5 rounded-lg hover:theme-surface-hover"
              >
                Refresh User Scope
              </button>
            )}
            <Link to="/agency-dashboard" className="text-xs font-bold theme-text-primary flex items-center gap-1 hover:underline">
            Open agency workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <form onSubmit={onSubmitUser} className="p-5 border-b border-theme grid grid-cols-1 md:grid-cols-6 gap-2.5">
          <div className="md:col-span-2">
            <input
              value={userForm.name}
              onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="User full name"
              className="w-full px-3 py-2 text-sm border border-theme rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <input
              value={userForm.email}
              onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="w-full px-3 py-2 text-sm border border-theme rounded-lg"
            />
          </div>
          <select
            value={userForm.role}
            onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as TenantFormRole }))}
            className="px-3 py-2 text-sm border border-theme rounded-lg"
          >
            {ROLE_OPTIONS.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
          <div className="md:col-span-3 border border-theme rounded-lg px-3 py-2 theme-surface">
            <p className="text-[11px] font-bold theme-text-secondary mb-1">Assign to agency account(s)</p>
            <div className="flex flex-wrap gap-2">
              {tenants.map((tenant) => {
                const checked = userForm.tenantIds.includes(tenant.id);
                return (
                  <label key={tenant.id} className="inline-flex items-center gap-1.5 text-xs theme-text-secondary">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          tenantIds: event.target.checked
                            ? Array.from(new Set([...current.tenantIds, tenant.id]))
                            : current.tenantIds.filter((id) => id !== tenant.id),
                        }))
                      }
                    />
                    {tenant.name}
                  </label>
                );
              })}
            </div>
          </div>
          <input
            value={userForm.password}
            onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder="Set user password"
            className="w-full px-3 py-2 text-sm border border-theme rounded-lg"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm font-bold theme-button-primary rounded-lg flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {editingUserId ? 'Update User' : 'Add User'}
          </button>
          <button
            type="button"
            onClick={onClearUserForm}
            className="px-3 py-2 text-xs font-semibold theme-text-secondary border border-theme rounded-lg hover:theme-surface-hover md:col-span-6"
          >
            Clear user form
          </button>
          <p className="md:col-span-6 text-xs theme-text-muted">{userStatusMessage || 'Only users with matching tenant scope are visible here.'}</p>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs theme-text-muted border-b border-theme">
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedTenant ? (
                selectedTenantUsers.map((user) => (
                    <tr key={user.id} className="border-b border-theme">
                    <td className="px-4 py-3 theme-text-primary font-semibold">
                      {user.tenantId === selectedTenant?.id
                        ? selectedTenant?.name
                        : Array.isArray(user.tenantIds)
                          ? user.tenantIds
                              .map((tenantId) => tenants.find((tenant) => tenant.id === tenantId)?.name)
                              .filter(Boolean)
                              .join(', ')
                          : user.organizationName}
                    </td>
                    <td className="px-4 py-3 theme-text-secondary">{user.role}</td>
                    <td className="px-4 py-3 theme-text-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditUser(user)}
                          className="px-2.5 py-1.5 rounded-lg border border-theme text-xs font-bold theme-text-secondary hover:theme-surface-hover flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-theme text-xs font-bold theme-text-danger hover:theme-surface-hover flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 theme-text-muted text-sm" colSpan={4}>
                    Select an agency account to view scoped users.
                  </td>
                </tr>
              )}
              {selectedTenant && selectedTenantUsers.length === 0 && (
                <tr>
                  <td className="px-4 py-6 theme-text-muted text-sm" colSpan={4}>
                    No users for this account yet. Add a user using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="theme-surface border border-theme rounded-xl shadow-2xs">
        <div className="p-5 border-b border-theme">
          <h2 className="text-lg font-bold theme-text-primary">Super Admin Quick Checks</h2>
          <p className="text-xs theme-text-muted mt-1">
            Open workspace for a scoped tenant dashboard view and monitor onboarding tasks.
          </p>
          <div className="mt-3">
            <Link to="/agency-dashboard" className="text-xs font-bold theme-text-primary flex items-center gap-1 hover:underline">
              Open agency workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const Metric = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; subtitle: string }) => (
  <div className="theme-surface border border-theme rounded-xl p-4 shadow-2xs">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase theme-text-muted tracking-wider">{title}</p>
      <Icon className="w-4 h-4 theme-text-muted" />
    </div>
    <p className="text-2xl font-black theme-text-primary mt-3">{value}</p>
    <p className="text-xs theme-text-muted mt-1">{subtitle}</p>
  </div>
);

