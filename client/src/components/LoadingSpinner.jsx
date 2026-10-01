import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading system data...', fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-9 h-9 animate-spin text-indigo-500" />
      {text && <p className="text-sm font-medium text-slate-400">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
};

export default LoadingSpinner;
