import React from 'react';

const PageHeader = ({ title, subtitle, action, breadcrumb }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        {breadcrumb && (
          <div className="flex items-center space-x-1.5 text-[11px] font-medium text-indigo-400 mb-1 tracking-wide">
            <span>{breadcrumb}</span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center space-x-2.5 shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
