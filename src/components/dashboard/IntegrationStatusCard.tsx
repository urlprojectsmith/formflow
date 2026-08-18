import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Zap,
  Webhook,
  FileSpreadsheet,
  Users,
  MessageSquare,
  Database,
  CreditCard,
  Mail,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Integration } from '../../types';
import { formatDate, getIntegrationStatusBadge } from '../../utils/formatters';

interface IntegrationStatusCardProps {
  integrations: Integration[];
}

export const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({
  integrations,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return Zap;
      case 'Webhook':
        return Webhook;
      case 'FileSpreadsheet':
        return FileSpreadsheet;
      case 'Users':
        return Users;
      case 'MessageSquare':
        return MessageSquare;
      case 'Database':
        return Database;
      case 'CreditCard':
        return CreditCard;
      case 'Mail':
        return Mail;
      default:
        return Layers;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Integration Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated sync connectors & Webhook pipelines</p>
        </div>
        <Link
          to="/integrations"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Integration List */}
      <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto">
        {integrations.slice(0, 5).map((item) => {
          const IconComp = getIcon(item.iconName);
          const badge = getIntegrationStatusBadge(item.status);
          const isConnected = item.status === 'connected';

          return (
            <div key={item.id} className="p-3 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${isConnected ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">{item.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isConnected ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Connected to {item.connectedFormsCount} forms
                      </span>
                    ) : (
                      'Not connected'
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}>
                  {badge.label}
                </span>
                {item.lastSync && (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Synced {formatDate(item.lastSync)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
