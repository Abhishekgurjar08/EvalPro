import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No records found', message = 'There are no items to display at this time.', icon: Icon = Inbox, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center surface-card rounded-xl border border-dashed border-slate-800">
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 mb-3.5">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
