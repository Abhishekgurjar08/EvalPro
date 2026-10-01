import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, CheckCircle2, AlertTriangle, Info, Layers } from 'lucide-react';
import api from '../services/api';
import Badge from './Badge';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
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

  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-950">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base text-white tracking-tight">
            Eval<span className="text-indigo-400">Pro</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono hidden md:inline-block">
            Enterprise Exam & Evaluation
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-slate-900 rounded-xl border border-slate-800 shadow-xl shadow-black/50 py-2.5 z-50">
              <div className="flex items-center justify-between px-3.5 pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">
                  Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 hover:bg-slate-800/40 transition-colors ${!n.read ? 'bg-indigo-500/5' : ''}`}
                    >
                      <div className="flex items-start space-x-2">
                        {n.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : n.type === 'WARNING' || n.type === 'ACTION_REQUIRED' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* User Profile and Badge */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-800">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-white tracking-tight">{user?.name || 'User'}</p>
            <div className="mt-0.5">
              <Badge status={user?.role}>{user?.role?.replace('_', ' ')}</Badge>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
