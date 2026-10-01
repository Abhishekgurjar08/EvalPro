import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) => {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="surface-card surface-hover p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-tight">{title}</p>
          <h3 className="text-2xl font-semibold text-white mt-1.5 tracking-tight font-mono">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg border ${scheme} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate mr-2">{subtitle}</span>
          {trend && <span className="font-medium text-emerald-400 shrink-0">{trend}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
