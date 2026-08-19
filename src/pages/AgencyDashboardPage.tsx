import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  Layers,
  Users,
  BarChart2,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { DashboardMetrics, Form, FormSubmission, Integration } from '../types';
import { useAuth } from '../auth/AuthContext';

const toInt = (value: unknown) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? Math.max(0, Math.floor(normalized)) : 0;
};

export const AgencyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [metricData, formData, submissionData, integrationData] = await Promise.all([
          apiService.getDashboardMetrics(),
          apiService.getForms(),
          apiService.getSubmissions(),
          apiService.getIntegrations(),
        ]);

        if (!mounted) return;
        setMetrics(metricData);
        setForms(formData);
        setSubmissions(submissionData);
        setIntegrations(integrationData);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load agency dashboard data');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const todaySubmissions = useMemo(() => {
    const today = new Date();
    const dateKey = today.toDateString();
    return submissions.filter((submission) => {
      const submittedDate = new Date(submission.submittedAt);
      if (Number.isNaN(submittedDate.getTime())) return false;
      return submittedDate.toDateString() === dateKey;
    }).length;
  }, [submissions]);

  const activeWorkflows = useMemo(
    () => integrations.filter((integration) => integration.status === 'connected').length,
    [integrations]
  );

  const campaignHealth = useMemo(() => {
    const published = forms.filter((form) => form.status === 'published').length;
    const draft = forms.filter((form) => form.status === 'draft').length;
    const archived = forms.filter((form) => form.status === 'archived').length;

    return [
      {
        title: 'Published Forms',
        status: published > 0 ? `${published} live` : 'No live forms yet',
        health: published > 0 ? 'Positive' : 'Watch',
      },
      {
        title: 'Draft Forms',
        status: draft > 0 ? `${draft} pending review` : 'No drafts pending',
        health: draft > 3 ? 'Watch' : 'Positive',
      },
      {
        title: 'Archived Forms',
        status: archived > 0 ? `${archived} archived` : 'No archived forms',
        health: archived > 5 ? 'Watch' : 'Positive',
      },
    ];
  }, [forms]);

  if (loading && !metrics && !forms.length) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="w-6 h-6 theme-text-primary animate-spin mx-auto" />
        <p className="text-sm theme-text-muted">Loading your agency dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 theme-surface-card border border-theme rounded-xl">
        <p className="text-sm theme-text-danger font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="p-5 theme-surface-card border-theme rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] theme-text-muted">Agency Dashboard</p>
            <h1 className="text-2xl font-black theme-text-primary mt-1">Agency Operations Command</h1>
            <p className="text-xs theme-text-muted mt-1">
              {user?.role === 'Super Admin'
                ? 'Platform command overview across all tenant accounts.'
                : `Tenant workspace for ${user?.organizationName || 'your account'}.`}
            </p>
          </div>
          <Link
            to="/forms/new"
            className="inline-flex items-center gap-1.5 text-sm font-bold theme-button-primary px-3 py-2 rounded-lg"
          >
            <PlusCircle className="w-4 h-4" /> New Form
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AgencyMetric title="Agency Forms" value={toInt(metrics?.totalForms).toString()} icon={Globe} subtitle={`${toInt(metrics?.draftForms)} draft`} />
        <AgencyMetric title="Today Submissions" value={todaySubmissions.toString()} icon={BarChart2} subtitle="for today only" />
        <AgencyMetric title="Active Workflows" value={activeWorkflows.toString()} icon={Layers} subtitle={`${integrations.length - activeWorkflows} not active`} />
        <AgencyMetric
          title="Team Members"
          value="—"
          icon={Users}
          subtitle="Visible to scoped admins and users"
        />
      </div>

      <section className="theme-surface-card border-theme rounded-xl">
        <div className="p-5 border-b border-theme flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold theme-text-primary">Campaign Health</h2>
            <p className="text-xs theme-text-muted">Track active lead streams and operational risk in your scoped tenant data.</p>
          </div>
          <Link
            to="/analytics"
            className="text-xs font-bold theme-text-primary flex items-center gap-1 hover:opacity-80"
          >
            Open analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4 space-y-3">
          {campaignHealth.map((campaign) => (
            <div
              key={campaign.title}
              className="flex items-center justify-between border border-theme rounded-lg p-3 theme-surface-hover"
            >
              <div>
                <p className="text-sm font-semibold theme-text-primary">{campaign.title}</p>
                <p className="text-xs theme-text-muted">Ops status: {campaign.status}</p>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  campaign.health === 'Positive'
                    ? 'theme-badge-success'
                    : 'theme-badge-warning'
                }`}
              >
                {campaign.health}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const AgencyMetric = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="theme-surface-card border-theme rounded-xl p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider theme-text-muted">{title}</p>
      <Icon className="w-4 h-4 theme-text-muted" />
    </div>
    <p className="text-2xl font-black mt-3 theme-text-primary">{value}</p>
    <p className="text-xs theme-text-muted mt-1">{subtitle}</p>
  </div>
);
