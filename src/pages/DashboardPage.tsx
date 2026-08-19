import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Inbox,
  TrendingUp,
  Plus,
  Globe,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RecentFormsTable } from '../components/dashboard/RecentFormsTable';
import { RecentSubmissionsCard } from '../components/dashboard/RecentSubmissionsCard';
import { IntegrationStatusCard } from '../components/dashboard/IntegrationStatusCard';
import { formatNumber } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { metrics, recentForms, recentSubmissions, integrations, loading, error, refresh, toggleFormStatus } =
    useDashboard();

  if (loading && !metrics) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto theme-text-primary" />
        <p className="text-sm font-semibold theme-text-secondary">Loading FormFlow Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 theme-surface-secondary theme-badge-danger border border-theme rounded-xl text-theme-danger flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 theme-text-primary" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button onClick={refresh} className="px-3 py-1.5 theme-button-primary rounded-lg text-xs font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 theme-surface-card rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold theme-text-primary tracking-tight">FormFlow Workspace</h2>
            <span className="theme-badge-success text-[11px] font-bold px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-xs theme-text-muted mt-0.5">
            Overview of form performance, inbound leads, and integration health.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-3.5 py-2 theme-button-primary rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Form</span>
          </Link>
          <Link
            to="/domains"
            className="flex items-center gap-1.5 px-3.5 py-2 theme-button-secondary rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 theme-text-muted" />
            <span>Connect Domain</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Forms"
          value={metrics ? formatNumber(metrics.totalForms) : 0}
          changePct={metrics?.formsChangePct}
          icon={FileText}
          description="Total active and draft form definitions"
        />
        <MetricCard
          title="Published Forms"
          value={metrics ? formatNumber(metrics.publishedForms) : 0}
          icon={CheckCircle2}
          description={`${metrics?.draftForms || 0} drafts remaining`}
        />
        <MetricCard
          title="Total Submissions"
          value={metrics ? formatNumber(metrics.totalSubmissions) : 0}
          changePct={metrics?.submissionsChangePct}
          icon={Inbox}
          description="Inbound lead and request submissions"
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics ? `${metrics.conversionRate}%` : '0%'}
          changePct={metrics?.conversionChangePct}
          icon={TrendingUp}
          description="Form view to submission ratio"
        />
      </div>

      <RecentFormsTable forms={recentForms} onToggleStatus={toggleFormStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSubmissionsCard submissions={recentSubmissions} />
        <IntegrationStatusCard integrations={integrations} />
      </div>
    </div>
  );
};
