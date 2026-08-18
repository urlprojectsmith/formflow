import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Eye,
  Inbox,
  RefreshCw,
  Sliders,
  History,
  Code,
  Share2,
} from 'lucide-react';
import { useForms } from '../hooks/useForms';
import { FormStatus } from '../types';
import { formatDate, formatNumber, getFormStatusBadge } from '../utils/formatters';
import { FormEmbedModal } from '../components/builder/FormEmbedModal';

export const FormsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';

  const [embedForm, setEmbedForm] = useState<{ id: string; name: string } | null>(null);

  const {
    forms,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    updateStatus,
    deleteForm,
    refresh,
  } = useForms();

  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, setSearchQuery]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/f/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">All Forms</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, publish, and monitor performance across your intake forms.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/forms/stress-50/builder"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Test 50 Fields</span>
          </Link>
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Form</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, slug, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto text-xs font-semibold">
          {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Forms List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-medium">Loading form directory...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No forms found matching your filter</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or status filter above, or create a brand new form.
            </p>
            <Link
              to="/forms/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Form Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Submissions</th>
                  <th className="py-3.5 px-4 text-right">Views</th>
                  <th className="py-3.5 px-4 text-right">Conv. Rate</th>
                  <th className="py-3.5 px-4">Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {forms.map((form) => {
                  const badge = getFormStatusBadge(form.status);
                  const isCopied = copiedId === form.id;

                  return (
                    <tr key={form.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {form.name}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {form.description}
                        </p>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          /f/{form.id}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {form.publishedVersion && (
                            <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Live v{form.publishedVersion}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-slate-900">
                        {formatNumber(form.submissionsCount)}
                      </td>

                      <td className="py-4 px-4 text-right text-slate-600 font-medium">
                        {formatNumber(form.viewsCount)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-slate-800">{form.conversionRate}%</span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {formatDate(form.updatedAt)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/f/${form.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Open Public Form Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setEmbedForm({ id: form.id, name: form.name })}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Embed or Share Form"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/forms/${form.id}/builder`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Open Form Builder Canvas"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/forms/${form.id}/versions`}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Form Version History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleCopyLink(form.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Copy Public Form Link"
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
                            onClick={() =>
                              updateStatus(
                                form.id,
                                form.status === 'published' ? 'draft' : 'published'
                              )
                            }
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            {form.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete form "${form.name}"?`)) {
                                deleteForm(form.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Form"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Embed Modal */}
      {embedForm && (
        <FormEmbedModal
          formId={embedForm.id}
          formName={embedForm.name}
          onClose={() => setEmbedForm(null)}
        />
      )}
    </div>
  );
};
