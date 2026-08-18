import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Inbox,
  TrendingUp,
  Plus,
  Globe,
  Layers,
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
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading FormFlow Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome / Quick Action Bar */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">FormFlow Workspace</h2>
            <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of form performance, inbound leads, and integration health.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/forms/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Form</span>
          </Link>
          <Link
            to="/domains"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 text-slate-500" />
            <span>Connect Domain</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
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

      {/* Main Table: Recent Forms */}
      <RecentFormsTable forms={recentForms} onToggleStatus={toggleFormStatus} />

      {/* Two Column Grid: Submissions Stream & Integration Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSubmissionsCard submissions={recentSubmissions} />
        <IntegrationStatusCard integrations={integrations} />
      </div>
    </div>
  );
};
