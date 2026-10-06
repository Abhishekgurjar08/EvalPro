import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  title = 'No records found',
  message = 'There are no items to display at this time.',
  icon: Icon = Inbox,
  action
}) => {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm my-2">
      {/* Soft radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="relative z-10 text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="relative z-10 text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md leading-relaxed">
        {message}
      </p>

      {action && <div className="relative z-10 mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;

