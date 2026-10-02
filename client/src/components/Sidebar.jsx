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
  Zap
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
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1d]/95 border-r border-slate-800/80 backdrop-blur-xl transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-2xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60 ring-1 ring-white/20">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">
                  Pariksha
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                Exam & Evaluation Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `group relative flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-600/5 text-white border border-indigo-500/30 shadow-sm shadow-indigo-950/50'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-500 shadow-glow-indigo" />
                          )}
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                          {item.highlight && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
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
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Gemini 2.5 Pro</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Active
            </span>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-200 shadow-sm shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Authorized User'}
                </p>
                <p className="text-[10px] text-indigo-400/90 font-mono capitalize truncate">
                  {user?.role?.toLowerCase()?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
