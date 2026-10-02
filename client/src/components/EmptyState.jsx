import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  title = 'No records found',
  message = 'There are no items to display at this time.',
  icon: Icon = Inbox,
  action
}) => {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center p-12 text-center surface-card rounded-2xl border border-dashed border-slate-800/90 my-2">
      {/* Soft radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 border border-slate-800/80 text-indigo-400 mb-4 shadow-lg shadow-black/40">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="relative z-10 text-base font-bold text-slate-100 tracking-tight">{title}</h3>
      <p className="relative z-10 text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {message}
      </p>

      {action && <div className="relative z-10 mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
