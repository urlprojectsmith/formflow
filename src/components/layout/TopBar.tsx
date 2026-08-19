import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Plus,
  Menu,
  Check,
  ChevronDown,
  User,
  Settings,
  ShieldCheck,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../../types';
import { apiService } from '../../services/apiService';
import { formatDate } from '../../utils/formatters';
import { ThemeToggle } from '../../theme/ThemeToggle';

interface TopBarProps {
  user: UserProfile | null;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onOpenMobileMenu, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.getNotifications().then(setNotifications);
  }, []);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (path: string) => {
    if (path === '/' || path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/forms/new')) return 'Create New Form';
    if (path.startsWith('/forms')) return 'Form Management';
    if (path.startsWith('/submissions')) return 'Submissions Inbox';
    if (path.startsWith('/integrations')) return 'Integrations & Webhooks';
    if (path.startsWith('/domains')) return 'Custom Domains & SSL';
    if (path.startsWith('/analytics')) return 'Performance Analytics';
    if (path.startsWith('/settings')) return 'Platform Settings';
    if (path === '/super-agency-dashboard') return 'Super Agency Control Center';
    if (path === '/agency-dashboard') return 'Agency Operations';
    return 'Dashboard';
  };

  const title = getPageTitle(location.pathname);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await apiService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/forms?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="theme-topbar sticky top-0 z-20 h-16 px-4 md:px-6 lg:px-8 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 theme-icon-button lg:hidden theme-focus-ring rounded-lg"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg md:text-xl font-bold theme-text-primary tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative items-center w-48 md:w-64">
          <Search className="w-4 h-4 theme-text-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search forms, leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-lg theme-focus-ring transition-all"
          />
        </form>

        <ThemeToggle />

        <Link
          to="/forms/new"
          className="flex items-center gap-1.5 px-3 py-1.5 theme-button-primary rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Create Form</span>
          <span className="md:hidden">New</span>
        </Link>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 theme-icon-button theme-focus-ring rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-theme-success ring-2 ring-[var(--surface)]" />
            )}
          </button>

          {showNotifications && (
            <div className="theme-dropdown absolute right-0 mt-2 w-80 md:w-96 rounded-xl z-50 overflow-hidden select-none">
              <div className="p-3 border-b border-theme flex items-center justify-between theme-surface">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold theme-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold theme-muted-badge px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium theme-text-primary hover:opacity-80"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs theme-text-muted">No recent notifications</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs transition-colors hover:bg-[var(--surface-hover)] ${
                        !item.read ? '' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold theme-text-primary">{item.title}</span>
                        <span className="text-[10px] theme-text-muted whitespace-nowrap">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="theme-text-secondary text-[11px] mt-0.5 leading-snug">{item.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 text-center border-t border-theme theme-surface">
                <Link
                  to="/submissions"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold theme-text-primary hover:opacity-80"
                >
                  View All Submissions Inbox →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-lg theme-icon-button theme-focus-ring transition-colors"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-theme object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full theme-muted-badge flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 theme-text-muted hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div className="theme-dropdown absolute right-0 mt-2 w-56 rounded-xl z-50 py-1 select-none">
              <div className="px-4 py-2.5 border-b border-theme">
                <p className="text-xs font-bold theme-text-primary">{user?.name || 'Alex Rivera'}</p>
                <p className="text-[11px] theme-text-muted truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold theme-badge-success border rounded">
                    {user?.plan || 'Growth Plan'}
                  </span>
                  <span className="text-[10px] font-semibold theme-badge-info px-1.5 py-0.2 rounded flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {user?.role}
                  </span>
                </div>
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium theme-text-secondary hover:bg-[var(--surface-hover)]"
              >
                <Settings className="w-4 h-4 theme-text-muted" />
                Account Settings
              </Link>
              <Link
                to="/domains"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium theme-text-secondary hover:bg-[var(--surface-hover)]"
              >
                <ExternalLink className="w-4 h-4 theme-text-muted" />
                Custom Domains
              </Link>

              <div className="border-t border-theme my-1"></div>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-white theme-danger rounded-md hover:opacity-90"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
