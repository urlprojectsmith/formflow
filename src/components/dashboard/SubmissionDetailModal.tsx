import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Copy,
  CheckCircle2,
  AlertCircle,
  Tag,
  Link2,
  Hash,
  Activity,
  UserCheck,
  Phone,
  Zap,
  RefreshCw,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { FormSubmission, SubmissionStatus, ActionExecutionStatus } from '../../types';
import { formatDate, getSubmissionStatusBadge } from '../../utils/formatters';
import { submissionService } from '../../services/submissionService';
import { actionService } from '../../services/actionService';
import { apiService } from '../../services/apiService';

interface SubmissionDetailModalProps {
  submission: FormSubmission | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: SubmissionStatus) => void;
  onActionRetry?: (submissionId: string, updatedStatuses: ActionExecutionStatus[]) => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  onClose,
  onStatusChange,
  onActionRetry,
}) => {
  const [currentStatus, setCurrentStatus] = useState<SubmissionStatus>('new');
  const [updating, setUpdating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [actionLogs, setActionLogs] = useState<ActionExecutionStatus[]>([]);
  const [retryingActionId, setRetryingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      setCurrentStatus(submission.status);
      setActionLogs(submission.actionExecutionStatus || []);
    }
  }, [submission]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (submission) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submission, onClose]);

  if (!submission) return null;

  const fieldsObj = submission.fields || submission.data || {};
  const meta = submission.metadata || {
    referrer: '',
    sourceUrl: '',
    utmParameters: {},
    visitorId: '',
    sessionId: '',
  };
  const utm = meta.utmParameters || {};

  const handleStatusSelect = async (newStatus: SubmissionStatus) => {
    setUpdating(true);
    setCurrentStatus(newStatus);
    try {
      await submissionService.updateSubmissionStatus(submission.id, newStatus);
      if (onStatusChange) {
        onStatusChange(submission.id, newStatus);
      }
    } catch (err) {
      console.error('Failed to update submission status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify({ ...submission, actionExecutionStatus: actionLogs }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetryAction = async (targetAction: ActionExecutionStatus) => {
    if (!submission || retryingActionId) return;
    setRetryingActionId(targetAction.actionId);

    try {
      const updatedResult = await actionService.retrySingleAction(targetAction, submission);
      
      const newLogs = actionLogs.map((log) =>
        log.actionId === targetAction.actionId ? updatedResult : log
      );

      setActionLogs(newLogs);
      await apiService.updateSubmissionActionStatus(submission.id, newLogs);
      
      if (onActionRetry) {
        onActionRetry(submission.id, newLogs);
      }
    } catch (err) {
      console.error('Failed to retry action:', err);
    } finally {
      setRetryingActionId(null);
    }
  };

  const statusBadge = getSubmissionStatusBadge(currentStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                ID: {submission.id}
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Form Version: v{submission.formVersionId || meta.formVersion || 1}
              </span>
            </div>
            <h3 id="modal-title" className="text-lg font-bold text-slate-900 mt-2">
              {submission.formName || submission.formId}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted on {formatDate(submission.submittedAt)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Changer Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">Processing Status:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['new', 'reviewed', 'processed', 'flagged', 'spam'] as SubmissionStatus[]).map(
                (st) => {
                  const active = currentStatus === st;
                  return (
                    <button
                      key={st}
                      disabled={updating}
                      onClick={() => handleStatusSelect(st)}
                      className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                        active
                          ? 'bg-slate-900 text-white shadow-2xs font-bold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Submitter Quick Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Submitter Name</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate">{submission.userName || 'Anonymous'}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">User Email</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate">{submission.userEmail || 'N/A'}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">User Phone</span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate">{submission.userPhone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Submitted Form Fields */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              <span>All Submitted Fields ({Object.keys(fieldsObj).length})</span>
            </h4>
            <div className="space-y-2.5">
              {Object.entries(fieldsObj).map(([fieldKey, fieldValue]) => (
                <div
                  key={fieldKey}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1"
                >
                  <div className="text-[11px] font-bold text-slate-500 tracking-tight">
                    {fieldKey}
                  </div>
                  <div className="text-xs font-medium text-slate-900 whitespace-pre-wrap leading-relaxed break-words">
                    {Array.isArray(fieldValue)
                      ? fieldValue.join(', ')
                      : typeof fieldValue === 'boolean'
                      ? fieldValue
                        ? 'Yes (Checked)'
                        : 'No'
                      : String(fieldValue || '—')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Execution Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Action Execution Logs ({actionLogs.length})</span>
              </span>
            </h4>
            {actionLogs && actionLogs.length > 0 ? (
              <div className="space-y-2.5">
                {actionLogs.map((act) => {
                  const isFailed = act.status?.toLowerCase() === 'failed';
                  const isSuccess = act.status?.toLowerCase() === 'success';
                  const isRetryingThis = retryingActionId === act.actionId;

                  return (
                    <div
                      key={act.actionId}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{act.actionName}</span>
                          <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-bold rounded capitalize font-mono">
                            {act.actionType}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Duration */}
                          {act.durationMs !== undefined && (
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {act.durationMs}ms
                            </span>
                          )}

                          {/* HTTP Status Code */}
                          {act.httpStatus && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                act.httpStatus >= 200 && act.httpStatus < 300
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              HTTP {act.httpStatus}
                            </span>
                          )}

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isSuccess
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isFailed
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {act.status}
                          </span>
                        </div>
                      </div>

                      {/* Execution Details & Response */}
                      {act.details && (
                        <p className="text-[11px] text-slate-600 font-mono leading-relaxed bg-white p-2 rounded-lg border border-slate-200/80">
                          {act.details}
                        </p>
                      )}

                      {/* Retry Action Bar for Failed Actions */}
                      {isFailed && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] text-rose-600 font-medium">
                            {act.retryCount !== undefined ? `Attempted ${act.retryCount + 1} times` : 'Execution failed'}
                          </span>
                          <button
                            onClick={() => handleRetryAction(act)}
                            disabled={isRetryingThis}
                            className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
                          >
                            <RotateCcw className={`w-3 h-3 ${isRetryingThis ? 'animate-spin' : ''}`} />
                            <span>{isRetryingThis ? 'Retrying Action...' : 'Retry Failed Action'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Standard Post-Submission Actions Dispatched</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Email Admin Notification dispatched to admin@company.com • Webhook delivered to
                  https://api.acmegrowth.com/v1/webhooks/forms
                </p>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>Metadata & Tracking</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Referrer</span>
                <div className="font-medium text-slate-800 truncate">
                  {meta.referrer || 'Direct Visit (No referrer)'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Source URL</span>
                <div className="font-medium text-slate-800 truncate">
                  {meta.sourceUrl || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Visitor ID</span>
                <div className="font-mono text-slate-800 text-[11px] truncate">
                  {meta.visitorId || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Session ID</span>
                <div className="font-mono text-slate-800 text-[11px] truncate">
                  {meta.sessionId || 'N/A'}
                </div>
              </div>
            </div>

            {/* UTM Parameters */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">UTM Parameters</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Source:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {utm.utm_source || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Medium:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {utm.utm_medium || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Campaign:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {utm.utm_campaign || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Term:</span>{' '}
                  <span className="font-semibold text-slate-800 font-mono">
                    {utm.utm_term || 'None'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Content:</span>{' '}
                  <span className="font-semibold text-slate-800 font-mono">
                    {utm.utm_content || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy JSON Payload</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
