import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Domain } from '../types';
import { apiService } from '../services/apiService';
import { formatDate, getDomainStatusBadge } from '../utils/formatters';

export const DomainsPage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newDomainName, setNewDomainName] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const fetchDomains = async () => {
    setLoading(true);
    const data = await apiService.getDomains();
    setDomains(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    setIsAdding(true);
    await apiService.addDomain(newDomainName);
    setNewDomainName('');
    setIsAdding(false);
    await fetchDomains();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Custom Domains & SSL</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Host your white-labeled intake forms on your custom subdomains with automated SSL certificates.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Automatic Let's Encrypt SSL</span>
        </div>
      </div>

      {/* Add Domain Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Connect New Subdomain
        </h3>
        <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. intake.yourcompany.com"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !newDomainName.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Verifying...' : 'Add Domain'}</span>
          </button>
        </form>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Active & Pending Custom Domains
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
            <p>Loading domain records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Domain Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">CNAME Target</th>
                  <th className="py-3 px-4 text-right">Forms</th>
                  <th className="py-3 px-4">Added</th>
                  <th className="py-3 px-4 text-right">SSL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {domains.map((dom) => {
                  const badge = getDomainStatusBadge(dom.status);
                  const isCopied = copiedId === dom.id;

                  return (
                    <tr key={dom.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{dom.domainName}</span>
                          {dom.isDefault && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                              DEFAULT
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {dom.cnameRecord}
                          </code>
                          <button
                            onClick={() => copyToClipboard(dom.cnameRecord, dom.id)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Copy CNAME Record"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {dom.connectedFormsCount}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(dom.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {dom.sslEnabled ? (
                          <span className="text-emerald-600 font-bold text-[11px] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px]">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
