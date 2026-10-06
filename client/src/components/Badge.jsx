import React from 'react';

const Badge = ({ children, status, variant, className = '' }) => {
  const norm = (status || variant || children || '').toString().toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
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
      'REVIEWED',
      'FINALIZED'
    ].includes(norm)
  ) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
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
      'ADMIN_REVIEW',
      'AI_EVALUATED'
    ].includes(norm)
  ) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (
    [
      'IN_PROGRESS',
      'LIVE',
      'SCHEDULED',
      'EVALUATION',
      'DIGITAL',
      'AI_ASSISTED',
      'AI_EVALUATION',
      'EVALUATED',
      'AI_APPROVED',
      'AI_PROCESSING'
    ].includes(norm)
  ) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-600';
  } else if (
    ['REJECTED', 'PAPER_REJECTED', 'SETTER_REJECTED', 'INACTIVE', 'DANGER', 'TIMED_OUT', 'FAILED', 'AI_FAILED'].includes(norm)
  ) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['DRAFT', 'MANUAL', 'UNASSIGNED', 'SCANNED'].includes(norm)) {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (norm === 'ADMIN') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
    dotColor = 'bg-purple-500';
  } else if (norm === 'EXAM_SETTER' || norm === 'SETTER') {
    styles = 'bg-sky-50 text-sky-700 border-sky-200 font-bold';
    dotColor = 'bg-sky-500';
  } else if (norm === 'EVALUATOR') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
    dotColor = 'bg-emerald-500';
  }

  const displayText = (children || status || '').toString().replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`}></span>
      <span className="capitalize">{displayText.toLowerCase()}</span>
    </span>
  );
};

export default Badge;

