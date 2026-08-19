import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  XCircle,
  ExternalLink,
  Key,
  RefreshCw,
  Sliders,
  Play,
  X,
  Code,
  ShieldCheck,
  AlertCircle,
  Clock,
  Send,
  Building2,
  Lock,
  Workflow,
} from 'lucide-react';
import { Integration, IntegrationCategory, IntegrationStatus, ActionExecutionStatus } from '../types';
import { N8nConfig } from '../types/formBuilder';
import { apiService } from '../services/apiService';
import {
  integrationService,
  GhlConnectionMetadata,
  N8nConfigMetadata,
} from '../services/integrationService';
import { formatDate, getIntegrationStatusBadge } from '../utils/formatters';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal states for n8n & GHL
  const [activeModal, setActiveModal] = useState<'n8n' | 'ghl' | null>(null);

  // n8n State
  const [n8nMeta, setN8nMeta] = useState<N8nConfigMetadata | null>(null);
  const [n8nDraft, setN8nDraft] = useState<N8nConfig>({
    webhookUrl: 'https://n8n.company.com/webhook/formflow-inbound',
    method: 'POST',
    authType: 'bearer',
    authBearerToken: '',
    payloadMode: 'entire_submission',
    customTemplate: JSON.stringify(
      {
        form: {
          id: '{{form.id}}',
          name: '{{form.name}}',
          version: '{{form.version}}',
        },
        submission: {
          id: '{{submission.id}}',
        },
        fields: {
          name: '{{field.name}}',
          email: '{{field.email}}',
        },
      },
      null,
      2
    ),
  });

  const [n8nTestResult, setN8nTestResult] = useState<ActionExecutionStatus | null>(null);
  const [n8nTesting, setN8nTesting] = useState<boolean>(false);

  // GHL State
  const [ghlMeta, setGhlMeta] = useState<GhlConnectionMetadata | null>(null);
  const [ghlLocationInput, setGhlLocationInput] = useState<string>('loc_acme_ghl_902');
  const [ghlApiKeyInput, setGhlApiKeyInput] = useState<string>('');
  const [ghlTestResult, setGhlTestResult] = useState<ActionExecutionStatus | null>(null);
  const [ghlActionLoading, setGhlActionLoading] = useState<boolean>(false);

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, n8nData, ghlData] = await Promise.all([
        apiService.getIntegrations(),
        integrationService.getN8nMetadata(),
        integrationService.getGhlMetadata(),
      ]);

      setIntegrations(Array.isArray(data) ? data : []);
      setN8nMeta(n8nData);
      setGhlMeta(ghlData);
      if (ghlData?.locationId) {
        setGhlLocationInput(ghlData.locationId);
      }
      if (n8nData) {
        setN8nDraft({
          webhookUrl: n8nData.webhookUrl,
          method: n8nData.method,
          authType: n8nData.authType,
          payloadMode: n8nData.payloadMode,
          customTemplate: n8nData.customTemplate || '',
        });
      }
      if (!n8nData) {
        setN8nDraft((prev) => ({
          ...prev,
          payloadMode: prev.payloadMode || 'entire_submission',
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load integrations. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggle = async (id: string, currentStatus: IntegrationStatus) => {
    setError(null);
    try {
      if (id === 'int_n8n') {
        setActiveModal('n8n');
        return;
      }
      if (id === 'int_ghl') {
        setActiveModal('ghl');
        return;
      }

      const nextStatus: IntegrationStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
      await apiService.toggleIntegrationStatus(id, nextStatus);
      await fetchIntegrations();
    } catch (err: any) {
      setError(err?.message || 'Failed to update integration status.');
    }
  };

  // --- n8n Handlers ---
  const handleSaveN8n = async () => {
    setError(null);
    try {
      const updated = await integrationService.saveN8nConfig(n8nDraft);
      setN8nMeta(updated);
      await apiService.toggleIntegrationStatus('int_n8n', 'connected');
      await fetchIntegrations();
      setActiveModal(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to save n8n configuration.');
    }
  };

  const handleTestN8nConnection = async () => {
    setN8nTesting(true);
    setN8nTestResult(null);
    try {
      const res = await integrationService.testN8nConnection(n8nDraft);
      setN8nTestResult(res);
    } catch (err: any) {
      setN8nTestResult({
        actionId: 'test_n8n',
        actionName: 'n8n Connection Test',
        actionType: 'n8n',
        status: 'Failed',
        executedAt: new Date().toISOString(),
        details: err?.message || 'Error testing n8n connection',
      });
    } finally {
      setN8nTesting(false);
    }
  };

  const handleSendN8nTestPayload = async () => {
    setN8nTesting(true);
    setN8nTestResult(null);
    try {
      const res = await integrationService.sendN8nTestPayload(n8nDraft);
      setN8nTestResult(res);
    } catch (err: any) {
      setN8nTestResult({
        actionId: 'test_n8n_payload',
        actionName: 'n8n Test Payload',
        actionType: 'n8n',
        status: 'Failed',
        executedAt: new Date().toISOString(),
        details: err?.message || 'Error sending test payload to n8n',
      });
    } finally {
      setN8nTesting(false);
    }
  };

  // --- GHL Handlers ---
  const handleConnectGhl = async () => {
    setGhlActionLoading(true);
    setError(null);
    try {
      const updated = await integrationService.connectGhl({
        locationId: ghlLocationInput,
        apiKey: ghlApiKeyInput || undefined,
      });
      setGhlMeta(updated);
      await apiService.toggleIntegrationStatus('int_ghl', 'connected');
      await fetchIntegrations();
      setGhlTestResult({
        actionId: 'ghl_conn',
        actionName: 'GoHighLevel Connection',
        actionType: 'ghl',
        status: 'Success',
        executedAt: new Date().toISOString(),
        details: `Connected successfully to GoHighLevel Location ${updated.locationId}.`,
      });
    } catch (err: any) {
      setGhlTestResult({
        actionId: 'ghl_conn',
        actionName: 'GoHighLevel Connection',
        actionType: 'ghl',
        status: 'Failed',
        executedAt: new Date().toISOString(),
        details: err?.message || 'Failed connecting to GoHighLevel',
      });
    } finally {
      setGhlActionLoading(false);
    }
  };

  const handleReconnectGhl = async () => {
    setGhlActionLoading(true);
    setGhlTestResult(null);
    try {
      const updated = await integrationService.reconnectGhl();
      setGhlMeta(updated);
      await apiService.toggleIntegrationStatus('int_ghl', 'connected');
      await fetchIntegrations();
      setGhlTestResult({
        actionId: 'ghl_reconn',
        actionName: 'GoHighLevel Reconnect',
        actionType: 'ghl',
        status: 'Success',
        executedAt: new Date().toISOString(),
        details: `OAuth token refreshed successfully for Location ${updated.locationId}. Expiry: ${updated.tokenExpiry}`,
      });
    } catch (err: any) {
      setGhlTestResult({
        actionId: 'ghl_reconn',
        actionName: 'GoHighLevel Reconnect',
        actionType: 'ghl',
        status: 'Failed',
        executedAt: new Date().toISOString(),
        details: err?.message || 'GoHighLevel token refresh failed',
      });
    } finally {
      setGhlActionLoading(false);
    }
  };

  const handleDisconnectGhl = async () => {
    setGhlActionLoading(true);
    setError(null);
    try {
      const updated = await integrationService.disconnectGhl();
      setGhlMeta(updated);
      await apiService.toggleIntegrationStatus('int_ghl', 'disconnected');
      await fetchIntegrations();
      setActiveModal(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to disconnect GoHighLevel.');
    } finally {
      setGhlActionLoading(false);
      setActiveModal(null);
    }
  };

  const handleTestGhlContactAction = async () => {
    setGhlActionLoading(true);
    setGhlTestResult(null);
    try {
      const result = await integrationService.executeGhlAction(
        {
          locationId: ghlLocationInput,
          actionType: 'create_or_update_contact',
          mappings: {
            firstName: 'Full Name',
            email: 'Work Email',
            phone: 'Phone Number',
          },
        },
        {
          id: `sub_test_${Date.now()}`,
          formId: 'form_lead_02',
          formVersionId: 1,
          formName: 'Lead Generation Form',
          submittedAt: new Date().toISOString(),
          status: 'new',
          userName: 'Michael Chen',
          userEmail: 'm.chen@apexglobal.com',
          userPhone: '+1 (555) 382-9102',
          fields: {
            'Full Name': 'Michael Chen',
            'Work Email': 'm.chen@apexglobal.com',
            'Phone Number': '+1 (555) 382-9102',
            Industry: 'Financial Services',
          },
          metadata: {
            referrer: 'https://linkedin.com',
            sourceUrl: 'https://forms.company.com/lead-gen',
            utmParameters: {},
            visitorId: 'vis_test',
            sessionId: 'sess_test',
          },
        }
      );
      setGhlTestResult(result);
    } catch (err: any) {
      setGhlTestResult({
        actionId: 'ghl_test_action',
        actionName: 'GHL Contact Action Test',
        actionType: 'ghl',
        status: 'Failed',
        executedAt: new Date().toISOString(),
        details: err?.message || 'Error executing GHL contact creation action',
      });
    } finally {
      setGhlActionLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Workflow':
        return Workflow;
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
      case 'Building2':
        return Building2;
      default:
        return Layers;
    }
  };

  const categories = ['all', 'Automation', 'CRM', 'Spreadsheets', 'Notifications', 'Payments', 'Email'];

  const filteredIntegrations = selectedCategory === 'all'
    ? integrations
    : integrations.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchIntegrations()}
            className="px-2.5 py-1.5 bg-rose-100 text-rose-800 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Integrations & Connectors</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect FormFlow inbound responses directly with CRMs, n8n, GoHighLevel, and automated pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {integrations.filter((i) => i.status === 'connected').length} Connected
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Connectors */}
      {loading ? (
        <div className="p-12 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading integrations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((item) => {
            const IconComp = getIcon(item.iconName);
            const badge = getIntegrationStatusBadge(item.status);
            const isConnected = item.status === 'connected';

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg border ${isConnected ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                      </div>
                    </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}>
                            {badge.label}
                          </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {item.description}
                  </p>

                  {item.id === 'int_ghl' && ghlMeta && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-mono text-slate-700">
                        <span>Location ID:</span>
                        <span className="font-bold text-slate-900">{ghlMeta.locationId}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>OAuth Expiry:</span>
                        <span>{ghlMeta.tokenExpiry ? formatDate(ghlMeta.tokenExpiry) : 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  {item.id === 'int_n8n' && n8nMeta && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-mono text-slate-700">
                        <span>Payload Mode:</span>
                        <span className="font-bold text-slate-900 capitalize">
                          {(n8nMeta.payloadMode || n8nDraft.payloadMode || 'entire_submission').replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-slate-500 truncate font-mono">
                        {n8nMeta.webhookUrl}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {isConnected ? `Synced ${formatDate(item.lastSync || '')}` : 'Not configured'}
                  </span>
                  <button
                    onClick={() => handleToggle(item.id, item.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isConnected
                        ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isConnected ? 'Configure' : 'Connect'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- N8N CONFIGURATION MODAL --- */}
      {activeModal === 'n8n' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">n8n Integration Connector</h3>
                  <p className="text-xs text-slate-500">Configure Webhook URL, Auth, and Custom Template Mapping</p>
                </div>
              </div>

              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">n8n Webhook Endpoint URL</label>
                <input
                  type="url"
                  value={n8nDraft.webhookUrl}
                  onChange={(e) => setN8nDraft({ ...n8nDraft, webhookUrl: e.target.value })}
                  placeholder="https://n8n.yourdomain.com/webhook/..."
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HTTP Method</label>
                  <select
                    value={n8nDraft.method}
                    onChange={(e) => setN8nDraft({ ...n8nDraft, method: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Authentication Mode</label>
                  <select
                    value={n8nDraft.authType}
                    onChange={(e) => setN8nDraft({ ...n8nDraft, authType: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="none">None (Public Endpoint)</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">Header API Key</option>
                    <option value="basic">Basic Auth (Username / Password)</option>
                  </select>
                </div>
              </div>

              {/* Auth Credentials Inputs (Masked Inputs) */}
              {n8nDraft.authType === 'bearer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bearer Auth Token (Server-Side Vault)</label>
                  <input
                    type="password"
                    value={n8nDraft.authBearerToken || ''}
                    onChange={(e) => setN8nDraft({ ...n8nDraft, authBearerToken: e.target.value })}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Token is encrypted and stored strictly in server-side storage.</p>
                </div>
              )}

              {n8nDraft.authType === 'api_key' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">API Key Header Name</label>
                    <input
                      type="text"
                      value={n8nDraft.authApiKeyHeader || 'X-N8N-API-KEY'}
                      onChange={(e) => setN8nDraft({ ...n8nDraft, authApiKeyHeader: e.target.value })}
                      placeholder="X-N8N-API-KEY"
                      className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">API Key Value</label>
                    <input
                      type="password"
                      value={n8nDraft.authApiKeyValue || ''}
                      onChange={(e) => setN8nDraft({ ...n8nDraft, authApiKeyValue: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Payload Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Payload Delivery Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setN8nDraft({ ...n8nDraft, payloadMode: 'entire_submission' })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      n8nDraft.payloadMode === 'entire_submission'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">Entire Submission</div>
                    <div className="text-[11px] text-slate-500">Sends full form, submission ID, metadata, and fields array.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setN8nDraft({ ...n8nDraft, payloadMode: 'custom_mapping' })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      n8nDraft.payloadMode === 'custom_mapping'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">Custom JSON Template</div>
                    <div className="text-[11px] text-slate-500">Interpolate form, submission, and field tags into custom JSON.</div>
                  </button>
                </div>
              </div>

              {/* Custom JSON Template Editor */}
              {n8nDraft.payloadMode === 'custom_mapping' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Custom Mapping JSON Template</label>
                    <button
                      type="button"
                      onClick={() =>
                        setN8nDraft({
                          ...n8nDraft,
                          customTemplate: JSON.stringify(
                            {
                              form: {
                                id: '{{form.id}}',
                                name: '{{form.name}}',
                                version: '{{form.version}}',
                              },
                              submission: {
                                id: '{{submission.id}}',
                              },
                              fields: {
                                name: '{{field.name}}',
                                email: '{{field.email}}',
                              },
                            },
                            null,
                            2
                          ),
                        })
                      }
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                    >
                      Insert Example Template
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={n8nDraft.customTemplate || ''}
                    onChange={(e) => setN8nDraft({ ...n8nDraft, customTemplate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-900 text-purple-300 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 font-mono">
                    Available tags: {'{{form.id}}'}, {'{{form.name}}'}, {'{{submission.id}}'}, {'{{field.<fieldName>}}'}
                  </p>
                </div>
              )}

              {/* Action Buttons for Testing */}
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={n8nTesting}
                  onClick={handleTestN8nConnection}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${n8nTesting ? 'animate-spin text-purple-600' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  disabled={n8nTesting}
                  onClick={handleSendN8nTestPayload}
                  className="px-3.5 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Payload</span>
                </button>
              </div>

              {/* Test Output Log Box */}
              {n8nTestResult && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{n8nTestResult.actionName} Output</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n8nTestResult.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {n8nTestResult.httpStatus || 200} {n8nTestResult.status}
                    </span>
                  </div>
                  <p className="text-slate-600 font-sans text-xs">{n8nTestResult.details}</p>
                  {n8nTestResult.responseBody && (
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg max-h-40 overflow-y-auto text-[11px]">
                      {n8nTestResult.responseBody}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveN8n}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                Save n8n Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GOHIGHLEVEL (GHL) CONFIGURATION MODAL --- */}
      {activeModal === 'ghl' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">GoHighLevel (GHL) Integration</h3>
                  <p className="text-xs text-slate-500">OAuth 2.0 & Location API Key Connection Manager</p>
                </div>
              </div>

              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Connection Status Box */}
              {ghlMeta && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase">Status:</span>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                          ghlMeta.status === 'connected'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ghlMeta.status === 'expired'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ghlMeta.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {ghlMeta.tokenExpiry
                        ? `OAuth token valid until ${formatDate(ghlMeta.tokenExpiry)}`
                        : 'No active OAuth session.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={ghlActionLoading}
                      onClick={handleReconnectGhl}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${ghlActionLoading ? 'animate-spin' : ''}`} />
                      <span>Reconnect</span>
                    </button>

                    {ghlMeta.status === 'connected' && (
                      <button
                        type="button"
                        disabled={ghlActionLoading}
                        onClick={handleDisconnectGhl}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Location ID Configuration (Do not hardcode requirement) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GoHighLevel Location ID</label>
                <input
                  type="text"
                  value={ghlLocationInput}
                  onChange={(e) => setGhlLocationInput(e.target.value)}
                  placeholder="loc_abc123456"
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Specify the target sub-account Location ID for contact creation and custom fields mapping.
                </p>
              </div>

              {/* Server-Side Credentials (Masked) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GoHighLevel Access Token / Private Key (Server-Side Storage)
                </label>
                <input
                  type="password"
                  value={ghlApiKeyInput}
                  onChange={(e) => setGhlApiKeyInput(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Credentials remain strictly server-side. Never exposed to browser or client JS.
                </p>
              </div>

              {/* Test Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  disabled={ghlActionLoading}
                  onClick={handleTestGhlContactAction}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Test Create/Update Contact</span>
                </button>
              </div>

              {/* Test Output Log Box */}
              {ghlTestResult && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ghlTestResult.actionName} Output</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ghlTestResult.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {ghlTestResult.httpStatus || 200} {ghlTestResult.status}
                    </span>
                  </div>
                  <p className="text-slate-600 font-sans text-xs">{ghlTestResult.details}</p>
                  {ghlTestResult.responseBody && (
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg max-h-40 overflow-y-auto text-[11px]">
                      {ghlTestResult.responseBody}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={ghlActionLoading}
                onClick={handleConnectGhl}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                Save GHL Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
