import React from 'react';

const Badge = ({ children, status, variant, className = '' }) => {
  const norm = (status || variant || children || '').toString().toUpperCase();

  let styles = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';

  if (
    [
      'APPROVED',
      'COMPLETED',
      'PUBLISHED',
      'RESULT_PUBLISHED',
      'ACTIVE',
      'SUCCESS',
      'ACCEPTED',
      'ADMIN_REVIEWED',
      'REVIEWED'
    ].includes(norm)
  ) {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400 shadow-glow-emerald';
  } else if (
    [
      'PENDING',
      'SUBMITTED',
      'PAPER_SUBMITTED',
      'SETTER_ASSIGNED',
      'ASSIGNED',
      'WARNING',
      'AI_PENDING',
      'AI_REVIEW_PENDING',
      'ADMIN_REVIEW'
    ].includes(norm)
  ) {
    styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400 shadow-glow-amber';
  } else if (
    [
      'IN_PROGRESS',
      'LIVE',
      'SCHEDULED',
      'EVALUATION',
      'DIGITAL',
      'AI_ASSISTED',
      'AI_EVALUATION',
      'AI_EVALUATED',
      'EVALUATED',
      'FINALIZED',
      'AI_APPROVED',
      'AI_PROCESSING'
    ].includes(norm)
  ) {
    styles = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    dotColor = 'bg-indigo-400 shadow-glow-indigo';
  } else if (
    ['REJECTED', 'PAPER_REJECTED', 'SETTER_REJECTED', 'INACTIVE', 'DANGER', 'TIMED_OUT', 'FAILED', 'AI_FAILED'].includes(norm)
  ) {
    styles = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    dotColor = 'bg-rose-400';
  } else if (['DRAFT', 'MANUAL', 'UNASSIGNED', 'SCANNED'].includes(norm)) {
    styles = 'bg-slate-800/60 text-slate-400 border-slate-700/60';
    dotColor = 'bg-slate-500';
  } else if (norm === 'ADMIN') {
    styles = 'bg-violet-500/15 text-violet-300 border-violet-500/30 font-semibold';
    dotColor = 'bg-violet-400';
  } else if (norm === 'EXAM_SETTER' || norm === 'SETTER') {
    styles = 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-semibold';
    dotColor = 'bg-sky-400';
  } else if (norm === 'EVALUATOR') {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold';
    dotColor = 'bg-emerald-400';
  }

  const displayText = (children || status || '').toString().replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border backdrop-blur-sm ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`}></span>
      <span className="capitalize">{displayText.toLowerCase()}</span>
    </span>
  );
};

export default Badge;
