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
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../../types';
import { apiService } from '../../services/apiService';
import { formatDate } from '../../utils/formatters';

interface TopBarProps {
  user: UserProfile | null;
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onOpenMobileMenu }) => {
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

  // Compute page title based on route
  const getPageTitle = (path: string) => {
    if (path === '/' || path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/forms/new')) return 'Create New Form';
    if (path.startsWith('/forms')) return 'Form Management';
    if (path.startsWith('/submissions')) return 'Submissions Inbox';
    if (path.startsWith('/integrations')) return 'Integrations & Webhooks';
    if (path.startsWith('/domains')) return 'Custom Domains & SSL';
    if (path.startsWith('/analytics')) return 'Performance Analytics';
    if (path.startsWith('/settings')) return 'Platform Settings';
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
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 md:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Menu Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Right Controls: Search, New Form CTA, Notifications, User Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative items-center w-48 md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search forms, leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition-all"
          />
        </form>

        {/* Primary CTA: Create Form */}
        <Link
          to="/forms/new"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Create Form</span>
          <span className="md:hidden">New</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden select-none">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No recent notifications</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                        !item.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">{item.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 text-center border-t border-slate-100 bg-slate-50">
                <Link
                  to="/submissions"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View All Submissions Inbox →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                AR
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 select-none">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name || 'Alex Rivera'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                    {user?.plan || 'Growth Plan'}
                  </span>
                </div>
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Account Settings
              </Link>
              <Link
                to="/domains"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <ExternalLink className="w-4 h-4 text-slate-400" />
                Custom Domains
              </Link>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  alert('Logged out.');
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
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
