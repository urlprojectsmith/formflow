import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowRight, User } from 'lucide-react';
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
    <div className="theme-surface-card rounded-xl border-theme shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-theme flex items-center justify-between theme-surface">
        <div>
          <h2 className="text-base font-bold theme-text-primary tracking-tight flex items-center gap-2">
            <Inbox className="w-4 h-4 theme-text-primary" />
            Recent Submissions
          </h2>
          <p className="text-xs theme-text-muted mt-0.5">Live activity stream across all active forms</p>
        </div>
        <Link
          to="/submissions"
          className="flex items-center gap-1 text-xs font-semibold theme-text-primary hover:opacity-80 transition-colors"
        >
          <span>Inbox</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-3 divide-y divide-theme flex-1 overflow-y-auto">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-xs theme-text-muted">No submissions recorded yet</div>
        ) : (
          submissions.map((sub) => {
            const badge = getSubmissionStatusBadge(sub.status);

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className="p-3 hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full theme-badge-success border border-theme flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold theme-text-primary text-xs truncate group-hover:text-theme-primary transition-colors">
                        {sub.userName || sub.userEmail || 'Anonymous Lead'}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-[11px] theme-text-muted truncate mt-0.5">
                      Submitted to <span className="font-medium theme-text-secondary">{sub.formName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-medium theme-text-muted block">{formatDate(sub.submittedAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <SubmissionDetailModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
};
