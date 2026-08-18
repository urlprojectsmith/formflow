import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  CheckCircle2,
  Clock,
  Archive,
  Edit3,
  Eye,
  RotateCcw,
  Send,
  Code2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { FormVersion, Form } from '../types';
import { FormRenderer } from '../components/builder/FormRenderer';

export const FormVersionsPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [previewVersion, setPreviewVersion] = useState<FormVersion | null>(null);
  const [schemaVersion, setSchemaVersion] = useState<FormVersion | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<FormVersion | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<FormVersion | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [formData, versionData] = await Promise.all([
        apiService.getFormById(id),
        apiService.getFormVersions(id),
      ]);
      setForm(formData || null);
      setVersions(versionData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load form version history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handlePublishVersion = async () => {
    if (!confirmPublish) return;
    setActionLoading(true);
    try {
      const { publishedVersion } = await apiService.publishFormVersion(
        id,
        confirmPublish.versionNumber
      );
      showToast(`Version ${publishedVersion.versionNumber} is now published and live!`);
      setConfirmPublish(null);
      await loadData();
    } catch (err: any) {
      showToast(`Error publishing version: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollbackVersion = async () => {
    if (!confirmRollback) return;
    setActionLoading(true);
    try {
      const newVersion = await apiService.rollbackToVersion(
        id,
        confirmRollback.versionNumber
      );
      showToast(
        `Rolled back to Version ${confirmRollback.versionNumber} (published as Version ${newVersion.versionNumber})!`
      );
      setConfirmRollback(null);
      await loadData();
    } catch (err: any) {
      showToast(`Error performing rollback: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Loading Form Version History...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/forms/${id}/builder`}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to Form Builder"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {form ? form.name : 'Form Version History'}
                </h1>
                {form?.publishedVersion ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Published: v{form.publishedVersion}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    No Published Version
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit immutable snapshots, review changes, and rollback to earlier revisions safely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/f/${id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Form Page</span>
            </a>
            <Link
              to={`/forms/${id}/builder`}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open in Builder</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Workflow Explanation banner */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Immutable Version Architecture</span>
              </div>
              <h2 className="text-base font-bold text-white">
                Published forms are permanent & immutable.
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                When you edit a form in the builder, changes are saved to an isolated draft version. The live public page always renders the active published version. Rolling back creates a fresh new version from an earlier snapshot without destroying history.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>{versions.length} Version{versions.length === 1 ? '' : 's'} Logged</span>
            </div>
          </div>
        </div>

        {/* Versions Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Version History Log</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing all versions for form ID: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{id}</code>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-6">Version</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Created By</th>
                  <th className="py-3.5 px-4">Published Date</th>
                  <th className="py-3.5 px-4">Fields Count</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {versions.map((ver) => {
                  const isCurrentPublished = ver.status === 'published';
                  const isDraft = ver.status === 'draft';
                  const isArchived = ver.status === 'archived';

                  return (
                    <tr
                      key={ver.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentPublished ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Version Number */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Version {ver.versionNumber}</span>
                          {isCurrentPublished && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white rounded-md">
                              Live
                            </span>
                          )}
                        </div>
                        {ver.notes && (
                          <div className="text-[11px] font-normal text-slate-500 mt-0.5 line-clamp-1">
                            {ver.notes}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isCurrentPublished && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Published
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Draft
                          </span>
                        )}
                        {isArchived && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <Archive className="w-3.5 h-3.5 text-slate-500" />
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {formatDate(ver.createdAt)}
                      </td>

                      {/* Created By */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {ver.createdBy || 'Admin User'}
                      </td>

                      {/* Published Date */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {formatDate(ver.publishedAt)}
                      </td>

                      {/* Fields Count */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {ver.definition?.fields?.length || 0} fields
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewVersion(ver)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Interactive Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* View Schema Details */}
                          <button
                            onClick={() => setSchemaVersion(ver)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Schema JSON"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>

                          {/* Publish Draft Action */}
                          {isDraft && (
                            <button
                              onClick={() => setConfirmPublish(ver)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                              title="Publish Draft Version"
                            >
                              <Send className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          {/* Rollback Action */}
                          {!isCurrentPublished && (
                            <button
                              onClick={() => setConfirmRollback(ver)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors"
                              title={`Rollback live form to Version ${ver.versionNumber}`}
                            >
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>Rollback</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Interactive Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Preview Version {previewVersion.versionNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Status: <span className="capitalize font-semibold">{previewVersion.status}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewVersion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto">
                <FormRenderer
                  definition={previewVersion.definition}
                  isPreview={true}
                  readOnly={true}
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setPreviewVersion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Schema Modal */}
      {schemaVersion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Version {schemaVersion.versionNumber} Schema Definition
                </h3>
              </div>
              <button
                onClick={() => setSchemaVersion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <pre className="font-mono text-xs text-blue-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                {JSON.stringify(schemaVersion.definition, null, 2)}
              </pre>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSchemaVersion(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {confirmPublish && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Publish Version {confirmPublish.versionNumber}?
                </h3>
                <p className="text-xs text-slate-500">Make this draft live on public runtime</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-6 leading-relaxed">
              Publishing Version {confirmPublish.versionNumber} will create an immutable published snapshot and immediately update the live standalone public form at <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">/f/{id}</code>.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmPublish(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishVersion}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Modal */}
      {confirmRollback && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rollback to Version {confirmRollback.versionNumber}?
                </h3>
                <p className="text-xs text-slate-500">Restore older snapshot safely</p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2 mb-6">
              <p className="font-semibold">How Rollback Works:</p>
              <p className="text-[11px] leading-relaxed">
                We will copy Version {confirmRollback.versionNumber}'s form schema and settings into a <strong>brand-new published version</strong>. Old versions remain immutable and intact in history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmRollback(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRollbackVersion}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Rollback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white max-w-sm">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
