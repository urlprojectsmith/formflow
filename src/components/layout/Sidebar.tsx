import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
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
}

export const Sidebar: React.FC<SidebarProps> = ({ user, mobileOpen, onCloseMobile }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Forms', path: '/forms', icon: FileText },
    { name: 'Submissions', path: '/submissions', icon: Inbox },
    { name: 'Integrations', path: '/integrations', icon: Layers },
    { name: 'Domains', path: '/domains', icon: Globe },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Header / Brand Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
        <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={onCloseMobile}>
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-lg tracking-tight">FormFlow</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 font-medium">Form Automation Platform</p>
          </div>
        </NavLink>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
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
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Workspace / Org Badge */}
      <div className="px-3 py-2 mx-3 my-2 rounded-lg bg-slate-50 border border-slate-200/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 truncate">{user?.organizationName || 'Acme Corp'}</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
            PRO
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>SOC2 & GDPR Compliant</span>
        </div>
      </div>

      {/* Bottom User & Settings Area */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
        >
          <div className="flex items-center gap-2.5 truncate">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="truncate text-left">
              <div className="font-semibold text-slate-900 text-xs truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email || 'user@company.com'}</div>
            </div>
          </div>
        </NavLink>

        <div className="pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 px-1">
          <NavLink to="/settings" className="hover:text-slate-800 transition-colors" onClick={onCloseMobile}>
            Settings
          </NavLink>
          <button
            onClick={() => alert('Logged out successfully.')}
            className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors"
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30">{sidebarContent}</aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
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
