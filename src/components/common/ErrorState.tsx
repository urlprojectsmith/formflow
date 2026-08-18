import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected issue occurred while fetching data. Please try again or refresh the page.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 bg-rose-50/80 border border-rose-200 rounded-2xl text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-100 border border-rose-200 rounded-xl text-rose-600 shrink-0 mt-0.5 sm:mt-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold tracking-tight">{title}</h4>
          <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-300 text-rose-800 text-xs font-bold rounded-xl shadow-2xs hover:bg-rose-100 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
