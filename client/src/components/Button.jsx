import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg space-x-1.5',
    md: 'px-4 py-2 text-xs font-semibold rounded-xl space-x-2',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl space-x-2.5'
  };

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white border border-indigo-400/30 shadow-md shadow-indigo-950/70',
    ai:
      'bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white shadow-md shadow-purple-950/70 border border-white/20',
    secondary:
      'bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 shadow-sm shadow-slate-950/40 hover:border-slate-600',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border border-emerald-400/30 shadow-md shadow-emerald-950/60',
    danger:
      'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border border-rose-400/30 shadow-md shadow-rose-950/60',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
    outline:
      'bg-slate-900/60 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800/80 text-slate-200 hover:text-white shadow-sm'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
