import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Copy,
  Check,
  MoreHorizontal,
  Eye,
  Pencil,
  Inbox,
  ArrowRight,
  Plus,
  Sliders,
} from 'lucide-react';
import { Form } from '../../types';
import { formatDate, formatNumber, getFormStatusBadge } from '../../utils/formatters';

interface RecentFormsTableProps {
  forms: Form[];
  onToggleStatus: (formId: string, currentStatus: 'published' | 'draft' | 'archived') => void;
}

export const RecentFormsTable: React.FC<RecentFormsTableProps> = ({ forms, onToggleStatus }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (form: Form, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://${form.domain || 'forms.company.com'}/s/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="theme-surface-card rounded-xl border-theme shadow-sm overflow-hidden">
      <div className="p-5 border-b border-theme theme-surface">
        <div>
          <h2 className="text-base font-bold theme-text-primary tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 theme-text-primary" />
            Recent Forms
          </h2>
          <p className="text-xs theme-text-muted mt-0.5">
            Active and draft intake forms configured in FormFlow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-3 py-1.5 theme-button-primary rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Form
          </Link>
          <Link
            to="/forms"
            className="flex items-center gap-1 px-3 py-1.5 theme-button-secondary text-xs rounded-lg transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="theme-table-head text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Form Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Submissions</th>
              <th className="py-3 px-4 text-right">Conv. Rate</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme text-xs">
            {forms.map((form) => {
              const badge = getFormStatusBadge(form.status);
              const isCopied = copiedId === form.id;

              return (
                <tr key={form.id} className="theme-table-row transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold theme-text-primary group-hover:text-theme-primary transition-colors">
                      {form.name}
                    </div>
                    <div className="text-[11px] theme-text-muted font-mono mt-0.5 truncate max-w-xs">/{form.slug}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-semibold theme-text-primary">
                    {formatNumber(form.submissionsCount)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold theme-text-primary">{form.conversionRate}%</span>
                  </td>

                  <td className="py-3.5 px-4 theme-text-muted">
                    {formatDate(form.updatedAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/forms/${form.id}/builder`}
                        className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                        title="Edit in Visual Form Builder"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={(e) => handleCopyLink(form, e)}
                        className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                        title="Copy Form Share Link"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 theme-badge-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link
                        to={`/submissions?formId=${form.id}`}
                        className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                        title="View Submissions"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => onToggleStatus(form.id, form.status)}
                        className="px-2 py-1 text-[11px] font-medium theme-button-secondary rounded-md transition-colors"
                      >
                        {form.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
