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
  Plus,
  X,
  UserPlus,
} from 'lucide-react';
import { TenantAccount, TenantStatus, UserProfile } from '../types';
import { initialTenants, initialTenantUsers } from '../services/mockData';

const SUPER_AGENCY_STORE_KEY = 'formflow_super_agency_store_v1';

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

const nowISO = () => new Date().toISOString();

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SUPER_AGENCY_STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { tenants?: TenantAccount[]; users?: UserProfile[] };
        if (Array.isArray(saved.tenants)) {
          setTenants(saved.tenants);
        } else {
          setTenants([...initialTenants]);
        }
        if (Array.isArray(saved.users)) {
          setUsers(saved.users);
        } else {
          setUsers([...initialTenantUsers]);
        }
        return;
      }
    } catch {
      // ignore invalid storage state and bootstrap defaults
    }
    setTenants([...initialTenants]);
    setUsers([...initialTenantUsers]);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SUPER_AGENCY_STORE_KEY, JSON.stringify({ tenants, users }));
    } catch {
      // no-op
    }
  }, [tenants, users]);

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

  const onCreateOrUpdateTenant = (event: FormEvent) => {
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
      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === editingTenantId
            ? {
                ...tenant,
                name: tenantForm.name.trim(),
                slug: normalizedSlug,
                status: tenantForm.status,
                plan: tenantForm.plan,
                adminName: tenantForm.adminName.trim(),
                adminEmail: tenantForm.adminEmail.trim(),
                updatedAt: nowISO(),
              }
            : tenant
        )
      );
      setTenantStatusMessage(`Account ${tenantForm.name} updated.`);
    } else {
      const newTenant: TenantAccount = {
        id: `tenant_${Date.now()}`,
        name: tenantForm.name.trim(),
        slug: normalizedSlug,
        status: tenantForm.status,
        plan: tenantForm.plan,
        createdAt: nowISO(),
        adminName: tenantForm.adminName.trim(),
        adminEmail: tenantForm.adminEmail.trim(),
      };
      setTenants((current) => [newTenant, ...current]);
      setSelectedTenantId(newTenant.id);
      setTenantStatusMessage(`Account ${tenantForm.name} created.`);
    }

    setTenantForm(defaultTenantForm());
    setEditingTenantId(null);
  };

  const onDeleteTenant = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) return;
    if (!window.confirm(`Delete account "${tenant.name}" and remove all its users?`)) return;

    const remainingTenants = tenants.filter((item) => item.id !== tenantId);
    setTenants(remainingTenants);
    setUsers((current) =>
      current.filter(
        (item) =>
          item.tenantId !== tenantId &&
          !(Array.isArray(item.tenantIds) && item.tenantIds.includes(tenantId))
      )
    );
    if (selectedTenantId === tenantId) {
      setSelectedTenantId(remainingTenants[0]?.id || '');
    }
    setTenantStatusMessage(`Account ${tenant.name} deleted.`);
    setEditingTenantId(null);
    setTenantForm(defaultTenantForm());
    syncUserTenantContext(remainingTenants[0] || null);
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

  const onSubmitUser = (event: FormEvent) => {
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
      const passwordPatch = trimmedPassword || undefined;
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                name: trimmedName,
                email: trimmedEmail,
                role: userForm.role,
                tenantIds: tenantAssignments,
                tenantId: tenantAssignments[0],
                organizationName: selectedTenant.name,
                ...(passwordPatch ? { password: passwordPatch } : {}),
              }
            : user
        )
      );
      setUserStatusMessage(`User ${userForm.name} updated.`);
    } else {
      if (!trimmedPassword) {
        setUserStatusMessage('Password is required for new users.');
        return;
      }
      const emailExists = users.some(
        (user) =>
          user.email.toLowerCase() === trimmedEmail &&
          tenantAssignments.some(
            (tenantId) => user.tenantId === tenantId || (Array.isArray(user.tenantIds) && user.tenantIds.includes(tenantId))
          )
      );
      if (emailExists) {
        setUserStatusMessage('This email already exists in the selected account.');
        return;
      }

      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: userForm.name.trim(),
        email: trimmedEmail,
        role: userForm.role,
        tenantId: tenantAssignments[0],
        tenantIds: tenantAssignments,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userForm.email.trim())}`,
        organizationName: selectedTenant.name,
        password: trimmedPassword,
        plan: userForm.role === 'Admin' || userForm.role === 'Developer' ? 'Growth Plan' : 'Starter',
      };
      setUsers((current) => [newUser, ...current]);
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

  const onDeleteUser = (userId: string) => {
    if (!window.confirm('Delete this user from this account?')) return;
    if (!selectedTenant) return;
    setUsers((current) =>
      current
        .map((user) => {
          if (user.id !== userId) return user;
          const remainingAssignments = Array.isArray(user.tenantIds)
            ? user.tenantIds.filter((tenantId) => tenantId !== selectedTenant.id)
            : [];
          if (remainingAssignments.length === 0) {
            return null;
          }
          return {
            ...user,
            tenantIds: remainingAssignments,
            tenantId: remainingAssignments[0],
          };
        })
        .filter((user): user is UserProfile => user !== null)
    );
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
      <header className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-[0.25em]">Super Agency Control</p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Super Admin Agency Console</h1>
            <p className="text-sm text-slate-500 mt-1">
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

      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Agency Accounts Setup</p>
              <h2 className="text-lg font-black text-slate-900 mt-1">Manage all agency accounts</h2>
              <p className="text-xs text-slate-500 mt-1">Create, edit, and delete account entries. Select an account to manage scoped users.</p>
            </div>
            <button
              type="button"
              onClick={onClearTenantEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
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
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              value={tenantForm.slug}
              onChange={(event) => setTenantForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="account-slug"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <select
              value={tenantForm.status}
              onChange={(event) =>
                setTenantForm((current) => ({ ...current, status: event.target.value as TenantStatus }))
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
            <select
              value={tenantForm.plan}
              onChange={(event) => setTenantForm((current) => ({ ...current, plan: event.target.value as TenantAccount['plan'] }))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              {PLAN_OPTIONS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
            <button className="px-3 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              {editingTenantId ? 'Update Account' : 'Add Account'}
            </button>
            <input
              value={tenantForm.adminName}
              onChange={(event) => setTenantForm((current) => ({ ...current, adminName: event.target.value }))}
              placeholder="Primary admin name"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg md:col-span-2"
            />
            <input
              value={tenantForm.adminEmail}
              onChange={(event) => setTenantForm((current) => ({ ...current, adminEmail: event.target.value }))}
              placeholder="Primary admin email"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg md:col-span-2"
            />
            <span className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 md:col-span-5">
              {tenantStatusMessage || 'Tip: leave admin fields blank if assigned later.'}
            </span>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
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
                    className={`border-b border-slate-100 cursor-pointer ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/70'}`}
                    onClick={() => onSelectTenant(tenant.id)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{tenant.name}</p>
                        <p className="text-[11px] text-slate-500">{tenant.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{tenant.plan}</td>
                    <td className="px-4 py-3 text-slate-700">{tenant.status}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {tenantUserCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{tenant.adminName || '--'}</p>
                      <p className="text-[11px] text-slate-500">{tenant.adminEmail || '--'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditTenant(tenant);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteTenant(tenant.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1"
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
                  <td className="px-4 py-6 text-slate-500 text-sm" colSpan={6}>
                    No accounts configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Account User Management: {selectedTenant ? selectedTenant.name : 'Select an Account'}
            </h2>
            <p className="text-xs text-slate-500">Only users for this account are shown and managed here.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedTenant && (
              <button
                type="button"
                onClick={() => onSelectTenant(selectedTenant.id)}
                className="text-xs font-bold text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
              >
                Refresh User Scope
              </button>
            )}
            <Link to="/agency-dashboard" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
            Open agency workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <form onSubmit={onSubmitUser} className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-6 gap-2.5">
          <div className="md:col-span-2">
            <input
              value={userForm.name}
              onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="User full name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <input
              value={userForm.email}
              onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <select
            value={userForm.role}
            onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as TenantFormRole }))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            {ROLE_OPTIONS.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
          <div className="md:col-span-3 border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <p className="text-[11px] font-bold text-slate-600 mb-1">Assign to agency account(s)</p>
            <div className="flex flex-wrap gap-2">
              {tenants.map((tenant) => {
                const checked = userForm.tenantIds.includes(tenant.id);
                return (
                  <label key={tenant.id} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
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
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {editingUserId ? 'Update User' : 'Add User'}
          </button>
          <button
            type="button"
            onClick={onClearUserForm}
            className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 md:col-span-6"
          >
            Clear user form
          </button>
          <p className="md:col-span-6 text-xs text-slate-500">{userStatusMessage || 'Only users with matching tenant scope are visible here.'}</p>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedTenant ? (
                selectedTenantUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      {user.tenantId === selectedTenant?.id
                        ? selectedTenant?.name
                        : Array.isArray(user.tenantIds)
                          ? user.tenantIds
                              .map((tenantId) => tenants.find((tenant) => tenant.id === tenantId)?.name)
                              .filter(Boolean)
                              .join(', ')
                          : user.organizationName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{user.role}</td>
                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditUser(user)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-500 text-sm" colSpan={4}>
                    Select an agency account to view scoped users.
                  </td>
                </tr>
              )}
              {selectedTenant && selectedTenantUsers.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500 text-sm" colSpan={4}>
                    No users for this account yet. Add a user using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Super Admin Quick Checks</h2>
          <p className="text-xs text-slate-500 mt-1">
            Open workspace for a scoped tenant dashboard view and monitor onboarding tasks.
          </p>
          <div className="mt-3">
            <Link to="/agency-dashboard" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
              Open agency workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

const Metric = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; subtitle: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{title}</p>
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <p className="text-2xl font-black text-slate-900 mt-3">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
  </div>
);
