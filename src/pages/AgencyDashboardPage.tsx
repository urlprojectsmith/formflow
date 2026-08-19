import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Layers, Users, BarChart2, ArrowRight, PlusCircle } from 'lucide-react';

const activeCampaigns = [
  { title: 'Q4 Lead Capture Push', status: 'On Track', health: 'Positive' },
  { title: 'Support Escalation Portal', status: 'Needs Review', health: 'Watch' },
  { title: 'Partner Referral Automation', status: 'On Track', health: 'Positive' },
];

export const AgencyDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-[0.22em]">Agency Dashboard</p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Agency Operations Command</h1>
            <p className="text-sm text-slate-500 mt-1">
              Team-level controls for campaign setup, submission health, and campaign routing.
            </p>
          </div>
          <Link
            to="/forms/new"
            className="inline-flex items-center gap-1.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
          >
            <PlusCircle className="w-4 h-4" /> New Form
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AgencyMetric title="Agency Forms" value="47" icon={Globe} subtitle="5 draft, 42 published" />
        <AgencyMetric title="Today Submissions" value="186" icon={BarChart2} subtitle="+14% vs previous day" />
        <AgencyMetric title="Active Workflows" value="9" icon={Layers} subtitle="3 webhooks, 6 automations" />
        <AgencyMetric title="Team Members" value="16" icon={Users} subtitle="2 pending invites" />
      </div>

      <section className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Campaign Health</h2>
            <p className="text-xs text-slate-500">Track active lead streams and operational risks.</p>
          </div>
          <Link
            to="/analytics"
            className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
          >
            Open analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4 space-y-3">
          {activeCampaigns.map((campaign) => (
            <div key={campaign.title} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{campaign.title}</p>
                <p className="text-xs text-slate-500">Ops status: {campaign.status}</p>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  campaign.health === 'Positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
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
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <p className="text-2xl font-black mt-3 text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
  </div>
);
