import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  FileText,
  Inbox,
  Layers,
  Globe,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  user: UserProfile | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, mobileOpen, onCloseMobile, onLogout }) => {
  const location = useLocation();
  const hasRole = (value: string[]) => user && value.includes(user.role);
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'Super Admin' ? [{ name: 'Super Agency', path: '/super-agency-dashboard', icon: Building2 }] : []),
    ...(user?.role !== 'User' ? [{ name: 'Agency Dashboard', path: '/agency-dashboard', icon: BarChart3 }] : []),
    { name: 'Forms', path: '/forms', icon: FileText },
    { name: 'Submissions', path: '/submissions', icon: Inbox },
    ...(hasRole(['Super Admin', 'Admin', 'Developer']) ? [{ name: 'Integrations', path: '/integrations', icon: Layers }] : []),
    ...(hasRole(['Super Admin', 'Admin']) ? [{ name: 'Domains', path: '/domains', icon: Globe }] : []),
    ...(hasRole(['Super Admin', 'Admin', 'Developer']) ? [{ name: 'Analytics', path: '/analytics', icon: BarChart3 }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="theme-sidebar flex flex-col h-full w-64 select-none">
      <div className="flex items-center justify-between h-16 px-5 border-b border-theme">
        <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={onCloseMobile}>
          <div className="w-9 h-9 rounded-lg bg-theme-primary flex items-center justify-center text-white shadow-sm group-hover:opacity-90 transition-colors">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold theme-text-primary text-lg tracking-tight">FormFlow</span>
              <span className="text-[10px] font-semibold theme-badge-success px-1.5 py-0.5 rounded-full">
                v2.4
              </span>
            </div>
            <p className="text-[11px] theme-text-muted -mt-0.5 font-medium">Form Automation Platform</p>
          </div>
        </NavLink>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 theme-icon-button rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider theme-text-muted uppercase">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'theme-badge-info text-white font-semibold'
                  : 'theme-text-secondary hover:text-theme-primary hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'theme-text-muted'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="px-3 py-2 mx-3 my-2 rounded-lg theme-surface-secondary border border-theme">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold theme-text-secondary truncate">
            {user?.organizationName || 'Acme Corp'}
          </span>
          <span className="text-[10px] font-bold theme-badge-success rounded px-1.5 py-0.5">
            PRO
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] theme-text-muted mt-1">
          <ShieldCheck className="w-3.5 h-3.5 theme-text-primary" />
          <span>SOC2 & GDPR Compliant</span>
        </div>
      </div>

      <div className="p-3 border-t border-theme theme-surface-secondary space-y-2">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface-hover)] theme-text-secondary text-xs font-medium transition-colors"
        >
          <div className="flex items-center gap-2.5 truncate">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-theme object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full theme-muted-badge flex items-center justify-center font-semibold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="truncate text-left">
              <div className="font-semibold theme-text-primary text-xs truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] theme-text-muted truncate">{user?.email || 'user@company.com'}</div>
            </div>
          </div>
        </NavLink>

        <div className="pt-1 flex items-center justify-between text-xs theme-text-muted border-t border-theme px-1">
          <NavLink to="/settings" className="hover:text-theme-primary" onClick={onCloseMobile}>
            Settings
          </NavLink>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 hover:text-rose-500 transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30">{sidebarContent}</aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
