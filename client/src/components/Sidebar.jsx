import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileCheck,
  FileText,
  Layers,
  Award,
  BarChart3,
  ShieldAlert,
  UserCheck,
  FolderKanban,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const role = user?.role;

  let navItems = [];

  if (role === 'ADMIN') {
    navItems = [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Examinations', path: '/admin/examinations', icon: Calendar },
      { label: 'Setters & Assignment', path: '/admin/setters', icon: Users },
      { label: 'Evaluators', path: '/admin/evaluators', icon: UserCheck },
      { label: 'Copy Assignment', path: '/admin/copy-assignment', icon: FolderKanban },
      { label: 'Question Papers', path: '/admin/question-papers', icon: FileText },
      { label: 'Answer Copies', path: '/admin/answer-copies', icon: FileCheck },
      { label: 'Results & Publish', path: '/admin/results', icon: Award },
      { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert }
    ];
  } else if (role === 'EXAM_SETTER') {
    navItems = [
      { label: 'Dashboard', path: '/setter/dashboard', icon: LayoutDashboard },
      { label: 'My Examinations', path: '/setter/examinations', icon: Calendar },
      { label: 'Question Bank', path: '/setter/questions', icon: HelpCircle },
      { label: 'Question Papers', path: '/setter/question-papers', icon: FileText }
    ];
  } else if (role === 'EVALUATOR') {
    navItems = [
      { label: 'Dashboard', path: '/evaluator/dashboard', icon: LayoutDashboard },
      { label: 'Assigned Copies', path: '/evaluator/assigned-copies', icon: FileCheck },
      { label: 'Evaluation History', path: '/evaluator/history', icon: Clock }
    ];
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-30 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-2xl lg:shadow-none`}
      >
        <div className="h-16 px-6 flex items-center border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 tracking-tight flex items-center gap-1">
                Eval<span className="text-indigo-400 font-extrabold">Pro</span>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 ml-1">v2.4</span>
              </span>
              <p className="text-[10px] text-slate-400">Enterprise Evaluation</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Evaluation Modes Notice */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Evaluation Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Automated rubric scoring, keyword matching & confidence checks.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
