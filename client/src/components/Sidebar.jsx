import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileCheck,
  FileText,
  Award,
  BarChart3,
  ShieldAlert,
  UserCheck,
  FolderKanban,
  HelpCircle,
  Clock,
  Sparkles,
  LogOut,
  Scan
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  let sections = [];

  if (role === 'ADMIN') {
    sections = [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
        ]
      },
      {
        title: 'Examination',
        items: [
          { label: 'Examinations', path: '/admin/examinations', icon: Calendar },
          { label: 'Setters & Paper Allocations', path: '/admin/setters', icon: Users },
          { label: 'Question Papers', path: '/admin/question-papers', icon: FileText }
        ]
      },
      {
        title: 'Evaluation',
        items: [
          { label: 'Scanned Copies', path: '/admin/scanned-copies', icon: Scan },
          { label: 'Copy Assignment', path: '/admin/copy-assignment', icon: FolderKanban, highlight: true },
          { label: 'Answer Copies', path: '/admin/answer-copies', icon: FileCheck },
          { label: 'Faculty Evaluators', path: '/admin/evaluators', icon: UserCheck }
        ]
      },
      {
        title: 'Results & Analytics',
        items: [
          { label: 'Results & Publish', path: '/admin/results', icon: Award },
          { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 }
        ]
      },
      {
        title: 'System',
        items: [
          { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert }
        ]
      }
    ];
  } else if (role === 'EXAM_SETTER') {
    sections = [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', path: '/setter/dashboard', icon: LayoutDashboard }
        ]
      },
      {
        title: 'Exam Authoring',
        items: [
          { label: 'My Examinations', path: '/setter/examinations', icon: Calendar },
          { label: 'Question Bank', path: '/setter/questions', icon: HelpCircle },
          { label: 'Question Papers', path: '/setter/question-papers', icon: FileText, highlight: true }
        ]
      }
    ];
  } else if (role === 'EVALUATOR') {
    sections = [
      {
        title: 'Workspace',
        items: [
          { label: 'Dashboard', path: '/evaluator/dashboard', icon: LayoutDashboard },
          { label: 'Assigned Copies', path: '/evaluator/assigned-copies', icon: FileCheck, highlight: true },
          { label: 'Evaluation History', path: '/evaluator/history', icon: Clock }
        ]
      }
    ];
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ES';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-100">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
                  Pariksha
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-1">
                Exam & Evaluation System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-thin">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `group relative flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-50/80 text-indigo-700 border border-indigo-100 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600 shadow-sm" />
                          )}
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.highlight && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Engine Status Badge */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-[11px] shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-700 font-semibold">Gemini 2.5 Pro</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
              Active
            </span>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.name || 'Authorized User'}
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold capitalize truncate">
                  {user?.role?.toLowerCase()?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
