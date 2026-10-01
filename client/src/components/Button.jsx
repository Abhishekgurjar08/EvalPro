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
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.99] cursor-pointer';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md space-x-1.5',
    md: 'px-3.5 py-2 text-xs font-medium rounded-lg space-x-2',
    lg: 'px-4 py-2.5 text-sm font-medium rounded-lg space-x-2.5'
  };

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/80 shadow-sm shadow-indigo-950/50',
    secondary:
      'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 shadow-sm shadow-slate-950/30',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/80 shadow-sm shadow-emerald-950/50',
    danger:
      'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/80 shadow-sm shadow-rose-950/50',
    ghost:
      'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white',
    outline:
      'bg-slate-900/60 border border-slate-700/80 hover:bg-slate-800 text-slate-200 hover:text-white'
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
