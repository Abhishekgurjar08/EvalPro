import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) => {
  const colorMap = {
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      glow: 'from-indigo-600/10 to-transparent'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      glow: 'from-emerald-600/10 to-transparent'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      glow: 'from-amber-600/10 to-transparent'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      glow: 'from-rose-600/10 to-transparent'
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-500/40',
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      glow: 'from-sky-600/10 to-transparent'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      glow: 'from-purple-600/10 to-transparent'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden surface-card surface-hover p-5 rounded-2xl border ${scheme.border} flex flex-col justify-between group`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${scheme.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight font-mono">
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
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate mr-2 font-medium">{subtitle}</span>
          {trend && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
