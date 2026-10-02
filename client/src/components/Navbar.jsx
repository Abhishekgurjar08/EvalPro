import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, CheckCircle2, AlertTriangle, Info, Zap, Sparkles, Activity } from 'lucide-react';
import api from '../services/api';
import Badge from './Badge';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // silently handle
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ES';

  return (
    <header className="h-16 bg-[#080c16]/85 border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between backdrop-blur-xl">
      {/* Left: Mobile Toggle & Breadcrumb Identity */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-950/60 ring-1 ring-white/10 lg:hidden">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base text-white tracking-tight">
              Pariksha <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">AI</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
              {user?.role === 'ADMIN' ? 'Enterprise Administration' : user?.role === 'EXAM_SETTER' ? 'Paper Setter Workspace' : 'Evaluation Terminal'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: AI Engine Status, Notifications & User Info */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* System AI Operational Status Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gemini AI Connected</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0d1322] rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 py-3 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-100">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3.5 hover:bg-slate-800/30 transition-colors ${
                        !n.read ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        {n.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : n.type === 'WARNING' || n.type === 'ACTION_REQUIRED' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800/80">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-white tracking-tight leading-tight">
              {user?.name || 'Authorized User'}
            </p>
            <div className="mt-0.5">
              <Badge status={user?.role}>{user?.role?.replace('_', ' ')}</Badge>
            </div>
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-950/60 border border-slate-700/80 flex items-center justify-center text-slate-200 font-bold text-xs shadow-sm">
            {userInitials}
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
