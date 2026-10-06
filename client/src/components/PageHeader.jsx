import React from 'react';

const PageHeader = ({ title, subtitle, action, breadcrumb }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        {breadcrumb && (
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-semibold text-indigo-700 mb-2 tracking-wide">
            <span>{breadcrumb}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center space-x-2.5 shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;

