import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ExternalLink,
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Recent Forms
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active and draft intake forms configured in FormFlow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Form
          </Link>
          <Link
            to="/forms"
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Form Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Submissions</th>
              <th className="py-3 px-4 text-right">Conv. Rate</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {forms.map((form) => {
              const badge = getFormStatusBadge(form.status);
              const isCopied = copiedId === form.id;

              return (
                <tr key={form.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Form Name & Details */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {form.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                      /{form.slug}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>

                  {/* Submissions */}
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                    {formatNumber(form.submissionsCount)}
                  </td>

                  {/* Conversion Rate */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-slate-700">{form.conversionRate}%</span>
                  </td>

                  {/* Updated */}
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {formatDate(form.updatedAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/forms/${form.id}/builder`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit in Visual Form Builder"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={(e) => handleCopyLink(form, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Copy Form Share Link"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link
                        to={`/submissions?formId=${form.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View Submissions"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => onToggleStatus(form.id, form.status)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
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
