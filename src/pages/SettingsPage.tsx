import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Building,
  Key,
  Bell,
  Save,
  Check,
  CreditCard,
} from 'lucide-react';
import { UserProfile } from '../types';
import { AppRole } from '../auth/AuthContext';
import { apiService } from '../services/apiService';

export const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await apiService.getUserProfile();
      setUser(profile);
    } catch (err: any) {
      setError(err?.message || 'Unable to load account profile.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm theme-text-muted">Loading your settings...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 theme-surface rounded-xl border border-theme text-sm theme-text-danger space-y-3">
        <p>{error || 'Profile not available for this account.'}</p>
        <button
          onClick={loadProfile}
          className="px-3 py-1.5 theme-button-primary text-xs rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="theme-surface-card p-5 rounded-xl border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold theme-text-primary tracking-tight">Platform & Account Settings</h2>
          <p className="text-xs theme-text-muted mt-0.5">
            Manage user profile, organization identity, and platform API credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="theme-surface-card p-6 rounded-xl border-theme space-y-4">
          <h3 className="text-xs font-bold theme-text-primary uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 theme-text-primary" />
            User Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
            <label className="block text-xs font-bold theme-text-muted">Full Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium theme-input rounded-lg focus:outline-none"
            />
            </div>

            <div className="space-y-1.5">
            <label className="block text-xs font-bold theme-text-muted">Email Address</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium theme-input rounded-lg focus:outline-none"
            />
            </div>

            <div className="space-y-1.5">
            <label className="block text-xs font-bold theme-text-muted">Role Title</label>
              <select
                value={user.role}
                onChange={(e) => setUser({ ...user, role: e.target.value as AppRole })}
                className="w-full px-3 py-2 text-xs font-medium theme-input rounded-lg focus:outline-none"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Developer">Developer</option>
                <option value="User">User</option>
              </select>
            </div>

            <div className="space-y-1.5">
            <label className="block text-xs font-bold theme-text-muted">Organization Name</label>
              <input
                type="text"
                value={user.organizationName}
                onChange={(e) => setUser({ ...user, organizationName: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium theme-input rounded-lg focus:outline-none"
            />
          </div>
        </div>
        </div>

        {/* Plan & Subscription Card */}
      <div className="theme-surface-card p-6 rounded-xl border-theme space-y-4">
          <h3 className="text-xs font-bold theme-text-primary uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 theme-text-primary" />
            Current Subscription Plan
          </h3>

          <div className="p-4 theme-surface-hover border-theme rounded-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold theme-text-primary text-sm">{user.plan}</span>
                <span className="text-[10px] font-bold theme-badge-success px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs theme-text-muted mt-1">
                Includes unlimited forms, custom domain mapping, webhooks, and SOC2 compliance.
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 theme-button-secondary text-xs font-bold rounded-lg transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 theme-button-primary text-xs font-bold rounded-lg transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved Changes</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
