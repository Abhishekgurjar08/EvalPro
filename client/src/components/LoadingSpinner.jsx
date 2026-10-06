import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const LoadingSpinner = ({ text = 'Gathering platform telemetry...', fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
        </div>
        <Loader2 className="absolute -inset-1.5 w-15 h-15 animate-spin text-indigo-500/40" />
      </div>
      {text && <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-tight">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
};

export default LoadingSpinner;

