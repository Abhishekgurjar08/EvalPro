import React from 'react';

const Badge = ({ children, status, variant, className = '' }) => {
  const norm = (status || variant || children || '').toString().toUpperCase();

  let styles = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';

  if (['APPROVED', 'COMPLETED', 'PUBLISHED', 'RESULT_PUBLISHED', 'ACTIVE', 'SUCCESS', 'ACCEPTED', 'ADMIN_REVIEWED', 'REVIEWED'].includes(norm)) {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    dotColor = 'bg-emerald-400';
  } else if (['PENDING', 'SUBMITTED', 'PAPER_SUBMITTED', 'SETTER_ASSIGNED', 'ASSIGNED', 'WARNING'].includes(norm)) {
    styles = 'bg-amber-500/10 text-amber-300 border-amber-500/25';
    dotColor = 'bg-amber-400';
  } else if (['IN_PROGRESS', 'LIVE', 'SCHEDULED', 'EVALUATION', 'DIGITAL', 'AI_ASSISTED', 'AI_EVALUATION', 'AI_EVALUATED', 'EVALUATED'].includes(norm)) {
    styles = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25';
    dotColor = 'bg-indigo-400';
  } else if (['REJECTED', 'PAPER_REJECTED', 'SETTER_REJECTED', 'INACTIVE', 'DANGER', 'TIMED_OUT', 'FAILED'].includes(norm)) {
    styles = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
    dotColor = 'bg-rose-400';
  } else if (['DRAFT', 'MANUAL'].includes(norm)) {
    styles = 'bg-slate-800/60 text-slate-400 border-slate-700/60';
    dotColor = 'bg-slate-500';
  }

  const displayText = (children || status || '').toString().replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight border ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      <span className="capitalize">{displayText.toLowerCase()}</span>
    </span>
  );
};

export default Badge;
