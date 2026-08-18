import React from 'react';
import { LucideIcon, Plus, FileText, Inbox, Layers, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      {(actionText && (actionLink || onActionClick)) && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
