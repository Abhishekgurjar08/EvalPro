import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) => {
  const colorMap = {
    indigo: {
      border: 'border-slate-200 hover:border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      glow: 'from-indigo-50/50 to-transparent'
    },
    emerald: {
      border: 'border-slate-200 hover:border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      glow: 'from-emerald-50/50 to-transparent'
    },
    amber: {
      border: 'border-slate-200 hover:border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      glow: 'from-amber-50/50 to-transparent'
    },
    rose: {
      border: 'border-slate-200 hover:border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      glow: 'from-rose-50/50 to-transparent'
    },
    sky: {
      border: 'border-slate-200 hover:border-sky-200',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      glow: 'from-sky-50/50 to-transparent'
    },
    purple: {
      border: 'border-slate-200 hover:border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      glow: 'from-purple-50/50 to-transparent'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden bg-white p-5 rounded-2xl border ${scheme.border} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group`}
    >
      {/* Ambient soft glow on hover */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${scheme.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight font-mono">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${scheme.iconBg} shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate mr-2 font-medium">{subtitle}</span>
          {trend && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;

