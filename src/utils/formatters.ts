import { FormStatus, SubmissionStatus, DomainStatus, IntegrationStatus } from '../types';

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Example output: Aug 11, 2026 or 2 hours ago if recent
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60 && diffMins >= 0) {
    return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
  }
  if (diffHours < 24 && diffHours >= 0) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7 && diffDays >= 0) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getFormStatusBadge(status: FormStatus): { label: string; className: string } {
  switch (status) {
    case 'published':
      return {
        label: 'Published',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'draft':
      return {
        label: 'Draft',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'archived':
      return {
        label: 'Archived',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
      };
  }
}

export function getSubmissionStatusBadge(status: SubmissionStatus): { label: string; className: string } {
  switch (status) {
    case 'new':
      return {
        label: 'New',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'reviewed':
      return {
        label: 'Reviewed',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'processed':
      return {
        label: 'Processed',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'flagged':
      return {
        label: 'Flagged',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
  }
}

export function getDomainStatusBadge(status: DomainStatus): { label: string; className: string } {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'pending_dns':
      return {
        label: 'Pending DNS',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'ssl_issuing':
      return {
        label: 'Issuing SSL',
        className: 'bg-sky-50 text-sky-700 border-sky-200',
      };
  }
}

export function getIntegrationStatusBadge(status: IntegrationStatus): { label: string; className: string } {
  switch (status) {
    case 'connected':
      return {
        label: 'Connected',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'disconnected':
      return {
        label: 'Disconnected',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    case 'error':
      return {
        label: 'Error',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
  }
}
