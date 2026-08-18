import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Eye, ArrowRight, User } from 'lucide-react';
import { FormSubmission } from '../../types';
import { formatDate, getSubmissionStatusBadge } from '../../utils/formatters';
import { SubmissionDetailModal } from './SubmissionDetailModal';

interface RecentSubmissionsCardProps {
  submissions: FormSubmission[];
}

export const RecentSubmissionsCard: React.FC<RecentSubmissionsCardProps> = ({
  submissions,
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Card Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-4 h-4 text-blue-600" />
            Recent Submissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Live activity stream across all active forms</p>
        </div>
        <Link
          to="/submissions"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>Inbox</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Submissions List */}
      <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No submissions recorded yet</div>
        ) : (
          submissions.map((sub) => {
            const badge = getSubmissionStatusBadge(sub.status);

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                        {sub.userName || sub.userEmail || 'Anonymous Lead'}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Submitted to <span className="font-medium text-slate-700">{sub.formName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-medium text-slate-400 block">{formatDate(sub.submittedAt)}</span>
                  <span className="text-[11px] font-semibold text-blue-600 group-hover:underline inline-flex items-center gap-1 mt-0.5">
                    View
                    <Eye className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Inspector */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
};
