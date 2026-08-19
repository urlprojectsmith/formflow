import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Sliders,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Inbox,
  RefreshCw,
  Code,
  History,
  Trash2,
} from 'lucide-react';
import { useForms } from '../hooks/useForms';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-surface-card p-5 rounded-xl border-theme shadow-sm">
        <div>
          <h2 className="text-lg font-bold theme-text-primary tracking-tight">All Forms</h2>
          <p className="text-xs theme-text-muted mt-0.5">
            Manage, publish, and monitor performance across your intake forms.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/forms/stress-50/builder"
            className="flex items-center gap-1.5 px-3 py-2 theme-button-secondary text-xs rounded-lg transition-colors"
          >
            <span>Test 50 Fields</span>
          </Link>
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-3.5 py-2 theme-button-primary rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Form</span>
          </Link>
        </div>
      </div>

      <div className="theme-surface-card p-4 rounded-xl border-theme shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, slug, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium theme-input rounded-lg transition-all"
          />
        </div>

          <div className="flex items-center gap-1 theme-surface-hover p-1 rounded-lg w-full sm:w-auto overflow-x-auto text-xs font-semibold">
          {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${
                statusFilter === st ? 'theme-button-primary font-bold' : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="theme-surface-card rounded-xl border-theme shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 theme-text-primary animate-spin mx-auto" />
            <p className="text-xs font-medium theme-text-muted">Loading form directory...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 theme-text-muted mx-auto" />
            <p className="text-sm font-semibold theme-text-primary">No forms found matching your filter</p>
            <p className="text-xs theme-text-muted max-w-sm mx-auto">
              Try adjusting your search query or status filter above, or create a brand new form.
            </p>
            <Link
              to="/forms/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 theme-button-primary rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="theme-table-head text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Form Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Submissions</th>
                  <th className="py-3.5 px-4 text-right">Views</th>
                  <th className="py-3.5 px-4 text-right">Conv. Rate</th>
                  <th className="py-3.5 px-4">Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-xs">
                {forms.map((form) => {
                  const badge = getFormStatusBadge(form.status);
                  const isCopied = copiedId === form.id;

                  return (
                    <tr key={form.id} className="theme-table-row transition-colors group">
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold theme-text-primary group-hover:text-theme-primary transition-colors">
                          {form.name}
                        </div>
                        <p className="text-[11px] theme-text-muted line-clamp-1 mt-0.5">
                          {form.description}
                        </p>
                        <div className="text-[10px] font-mono theme-text-muted mt-1">/f/{form.id}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.className}`}>
                            {badge.label}
                          </span>
                          {form.publishedVersion && (
                            <span className="text-[10px] font-mono theme-badge-success rounded border border-theme px-1.5 py-0.5">
                              Live v{form.publishedVersion}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold theme-text-primary">
                        {formatNumber(form.submissionsCount)}
                      </td>

                      <td className="py-4 px-4 theme-text-secondary font-medium">
                        {formatNumber(form.viewsCount)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold theme-text-primary">{form.conversionRate}%</span>
                      </td>

                      <td className="py-4 px-4 theme-text-muted text-[11px]">
                        {formatDate(form.updatedAt)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/f/${form.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                            title="Open Public Form Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setEmbedForm({ id: form.id, name: form.name })}
                            className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                            title="Embed or Share Form"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/forms/${form.id}/builder`}
                            className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                            title="Open Form Builder Canvas"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/forms/${form.id}/versions`}
                            className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                            title="View Form Version History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleCopyLink(form.id)}
                            className="p-1.5 theme-text-muted hover:text-theme-primary hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                            title="Copy Public Form Link"
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
                            onClick={() =>
                              updateStatus(
                                form.id,
                                form.status === 'published' ? 'draft' : 'published'
                              )
                            }
                            className="px-2 py-1 text-[11px] font-semibold theme-button-secondary"
                          >
                            {form.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete form "${form.name}"?`)) {
                                deleteForm(form.id);
                              }
                            }}
                            className="p-1.5 text-theme-danger hover:opacity-80 rounded-md transition-colors"
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
