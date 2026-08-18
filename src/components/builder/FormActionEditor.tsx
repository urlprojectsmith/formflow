import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Play,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Globe,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  ShieldAlert,
  HelpCircle,
  Settings2,
  Sliders,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Lock,
  Code,
  FileJson,
  X,
  Edit2,
  Filter,
  Workflow,
  Building2,
} from 'lucide-react';
import {
  FormField,
  FormPipelineAction,
  PipelineActionType,
  WebhookConfig,
  RestApiConfig,
  EmailConfig,
  RedirectConfig,
  ThankYouConfig,
  HeaderKV,
  QueryParamKV,
  FieldMappingKV,
  HttpMethod,
  ActionCondition,
} from '../../types/formBuilder';
import { actionService } from '../../services/actionService';
import { ActionExecutionStatus } from '../../types';

interface FormActionEditorProps {
  fields: FormField[];
  actionsPipeline?: FormPipelineAction[];
  onUpdateActionsPipeline: (actions: FormPipelineAction[]) => void;
}

export const FormActionEditor: React.FC<FormActionEditorProps> = ({
  fields,
  actionsPipeline = [],
  onUpdateActionsPipeline,
}) => {
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<PipelineActionType>('webhook');

  // Test execution state
  const [testingActionId, setTestingActionId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ActionExecutionStatus | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Draft state when editing an action
  const [draftAction, setDraftAction] = useState<FormPipelineAction | null>(null);

  // Active subtab inside action modal
  const [activeModalTab, setActiveModalTab] = useState<'config' | 'payload' | 'auth' | 'conditions' | 'test'>('config');

  // Default initial actions if empty
  const ensureDefaultPipeline = () => {
    if (actionsPipeline.length === 0) {
      const defaults: FormPipelineAction[] = [
        {
          id: 'act_webhook_1',
          type: 'webhook',
          name: 'Primary Inbound Webhook',
          enabled: true,
          order: 1,
          webhookConfig: {
            url: 'https://api.acmegrowth.com/v1/webhooks/forms',
            method: 'POST',
            payloadType: 'entire_submission',
            headers: [{ key: 'X-Source', value: 'FormFlow-Engine' }],
          },
          retryPolicy: { maxRetries: 2, retryDelayMs: 1000 },
        },
        {
          id: 'act_email_1',
          type: 'email',
          name: 'Admin Email Notification',
          enabled: true,
          order: 2,
          emailConfig: {
            to: 'admin@company.com',
            subject: 'New Form Submission Received',
            body: 'A new form response has been submitted with details.',
          },
        },
      ];
      onUpdateActionsPipeline(defaults);
    }
  };

  const handleCreateNewAction = (type: PipelineActionType) => {
    const newId = `act_${type}_${Date.now()}`;
    let newAction: FormPipelineAction = {
      id: newId,
      type,
      name: `New ${type.replace('_', ' ').toUpperCase()} Action`,
      enabled: true,
      order: actionsPipeline.length + 1,
      retryPolicy: { maxRetries: 2, retryDelayMs: 1000 },
    };

    if (type === 'webhook') {
      newAction.name = 'Ingest Webhook';
      newAction.webhookConfig = {
        url: 'https://api.example.com/webhook',
        method: 'POST',
        payloadType: 'entire_submission',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        fieldMappings: fields.map((f) => ({ formField: f.name, targetField: f.name })),
      };
    } else if (type === 'rest_api') {
      newAction.name = 'CRM Rest API Sync';
      newAction.restApiConfig = {
        url: 'https://api.hubspot.com/crm/v3/objects/contacts',
        method: 'POST',
        authType: 'none',
        headers: [{ key: 'Accept', value: 'application/json' }],
        queryParams: [],
        jsonBody: JSON.stringify(
          Object.fromEntries(fields.map((f) => [f.name, `{{${f.name}}}`])),
          null,
          2
        ),
      };
    } else if (type === 'email') {
      newAction.name = 'Notification Email';
      newAction.emailConfig = {
        to: 'notifications@company.com',
        subject: 'New Form Response: {{full_name}}',
        body: 'Hello Team,\n\nA new response was submitted.\n\nForm Data:\n{{all_fields}}',
      };
    } else if (type === 'redirect') {
      newAction.name = 'Custom Redirect Target';
      newAction.redirectConfig = {
        url: 'https://acmegrowth.com/thank-you',
        passQueryParams: true,
      };
    } else if (type === 'thank_you') {
      newAction.name = 'Thank You Screen';
      newAction.thankYouConfig = {
        title: 'Thank You for Your Submission!',
        message: 'We have received your details and will follow up shortly.',
        showSummary: true,
      };
    } else if (type === 'n8n') {
      newAction.name = 'n8n Workflow Action';
      newAction.n8nConfig = {
        webhookUrl: 'https://n8n.company.com/webhook/formflow-inbound',
        method: 'POST',
        authType: 'none',
        payloadMode: 'entire_submission',
      };
    } else if (type === 'ghl') {
      newAction.name = 'GoHighLevel Contact Sync';
      newAction.ghlConfig = {
        actionType: 'create_or_update_contact',
        mappings: {
          firstName: fields.find((f) => f.name.toLowerCase().includes('first') || f.name.toLowerCase().includes('name'))?.name || '',
          email: fields.find((f) => f.type === 'email' || f.name.toLowerCase().includes('email'))?.name || '',
          phone: fields.find((f) => f.type === 'phone' || f.name.toLowerCase().includes('phone'))?.name || '',
        },
      };
    }

    setDraftAction(newAction);
    setEditingActionId(newId);
    setIsAddModalOpen(false);
    setActiveModalTab('config');
  };

  const handleSaveDraft = () => {
    if (!draftAction) return;

    const existingIndex = actionsPipeline.findIndex((a) => a.id === draftAction.id);
    let updated: FormPipelineAction[];

    if (existingIndex >= 0) {
      updated = [...actionsPipeline];
      updated[existingIndex] = draftAction;
    } else {
      updated = [...actionsPipeline, draftAction];
    }

    onUpdateActionsPipeline(updated);
    setEditingActionId(null);
    setDraftAction(null);
  };

  const handleToggleEnable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = actionsPipeline.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    onUpdateActionsPipeline(updated);
  };

  const handleDeleteAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = actionsPipeline.filter((a) => a.id !== id);
    onUpdateActionsPipeline(updated);
    if (editingActionId === id) {
      setEditingActionId(null);
      setDraftAction(null);
    }
  };

  const handleMoveAction = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= actionsPipeline.length) return;

    const updated = [...actionsPipeline];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Recalculate order numbers
    updated.forEach((a, i) => {
      a.order = i + 1;
    });

    onUpdateActionsPipeline(updated);
  };

  const handleTestAction = async (action: FormPipelineAction) => {
    setTestingActionId(action.id);
    setIsTesting(true);
    setTestResult(null);

    // Build sample payload from form fields
    const sampleFields: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'email') sampleFields[f.name] = 'alex.smith@example.com';
      else if (f.type === 'phone') sampleFields[f.name] = '+1 (555) 019-2831';
      else if (f.type === 'number') sampleFields[f.name] = 2500;
      else sampleFields[f.name] = `Sample ${f.label || f.name}`;
    });

    try {
      const result = await actionService.testPipelineAction(action, sampleFields);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        actionId: action.id,
        actionName: action.name,
        actionType: action.type as any,
        status: 'Failed',
        executedAt: new Date().toISOString(),
        details: err?.message || 'Failed test request execution',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getActionBadgeColor = (type: PipelineActionType) => {
    switch (type) {
      case 'webhook':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'rest_api':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'email':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'redirect':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'thank_you':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'n8n':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ghl':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
  };

  const getActionIcon = (type: PipelineActionType) => {
    switch (type) {
      case 'webhook':
        return <Globe className="w-4 h-4 text-purple-600" />;
      case 'rest_api':
        return <Code className="w-4 h-4 text-blue-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-emerald-600" />;
      case 'redirect':
        return <ExternalLink className="w-4 h-4 text-amber-600" />;
      case 'thank_you':
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      case 'n8n':
        return <Workflow className="w-4 h-4 text-rose-600" />;
      case 'ghl':
        return <Building2 className="w-4 h-4 text-cyan-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Top Header & Pipeline Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4 fill-amber-500/20" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Form Action Engine Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {actionsPipeline.length} Action Steps
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Configure automated post-submission actions (Webhooks, REST APIs, Emails, Redirects) executed in a deterministic pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {actionsPipeline.length === 0 && (
            <button
              onClick={ensureDefaultPipeline}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              Load Default Actions
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Action Step</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Flow Chart */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg overflow-x-auto">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Post-Submission Pipeline Execution Sequence</span>
        </div>

        <div className="flex items-center gap-3 min-w-max">
          {/* Node 1: Submission */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">User Submission</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

          {/* Node 2: Validate & Store */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl">
            <span className="text-xs font-medium text-slate-300">Save Submission & Sanitize</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

          {/* Configured Actions */}
          {actionsPipeline.length === 0 ? (
            <div className="px-4 py-2 rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs italic">
              No custom actions configured. Form will save to database only.
            </div>
          ) : (
            actionsPipeline.map((act, idx) => (
              <React.Fragment key={act.id}>
                <div
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${
                    act.enabled
                      ? 'bg-slate-800/90 border-slate-600 text-white shadow-xs'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500 line-through'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400 font-bold">#{idx + 1}</span>
                  {getActionIcon(act.type)}
                  <span className="text-xs font-bold text-slate-100">{act.name}</span>
                  {!act.enabled && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                      Off
                    </span>
                  )}
                </div>
                {idx < actionsPipeline.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Main Actions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Pipeline Steps ({actionsPipeline.length})
          </h3>
          <span className="text-xs text-slate-500">
            Drag or use arrows to reorder action execution sequence
          </span>
        </div>

        {actionsPipeline.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No Actions Configured</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Add webhooks, REST API syncs, email notifications, or redirects to execute whenever a user submits this form.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors"
            >
              Add First Action
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {actionsPipeline.map((action, index) => (
              <div
                key={action.id}
                onClick={() => {
                  setDraftAction(JSON.parse(JSON.stringify(action)));
                  setEditingActionId(action.id);
                  setActiveModalTab('config');
                }}
                className={`bg-white rounded-2xl border p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  action.enabled ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                {/* Left side info */}
                <div className="flex items-center gap-3.5">
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0 text-slate-400">
                    <button
                      disabled={index === 0}
                      onClick={(e) => handleMoveAction(index, 'up', e)}
                      className="hover:text-slate-900 disabled:opacity-20 p-0.5"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{index + 1}</span>
                    <button
                      disabled={index === actionsPipeline.length - 1}
                      onClick={(e) => handleMoveAction(index, 'down', e)}
                      className="hover:text-slate-900 disabled:opacity-20 p-0.5"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {getActionIcon(action.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{action.name}</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getActionBadgeColor(action.type)}`}>
                        {action.type.replace('_', ' ')}
                      </span>
                      {action.conditions && action.conditions.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Filter className="w-2.5 h-2.5" />
                          Conditional
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 font-mono truncate max-w-md">
                      {action.type === 'webhook' && action.webhookConfig?.url}
                      {action.type === 'rest_api' && `${action.restApiConfig?.method || 'POST'} ${action.restApiConfig?.url}`}
                      {action.type === 'email' && `To: ${action.emailConfig?.to}`}
                      {action.type === 'redirect' && `Target: ${action.redirectConfig?.url}`}
                      {action.type === 'thank_you' && `Title: "${action.thankYouConfig?.title}"`}
                    </div>
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestAction(action);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                    <span>Test Request</span>
                  </button>

                  <button
                    onClick={(e) => handleToggleEnable(action.id, e)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      action.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {action.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    onClick={(e) => handleDeleteAction(action.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Execution Result Banner */}
      {testingActionId && testResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Play className="w-4 h-4 fill-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Test Request Output: {testResult.actionName}
                </h4>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Executed at {new Date(testResult.executedAt).toLocaleTimeString()}</span>
                  {testResult.durationMs !== undefined && (
                    <span className="font-mono text-slate-600">• {testResult.durationMs}ms duration</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                  testResult.status === 'Success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {testResult.status === 'Success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>HTTP {testResult.httpStatus || (testResult.status === 'Success' ? 200 : 500)} {testResult.status}</span>
              </span>

              <button
                onClick={() => setTestingActionId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Log & Payload Summary</div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
              {testResult.details}
            </p>
          </div>

          {testResult.responseBody && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">HTTP Response Body</div>
              <pre className="text-xs bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono overflow-x-auto max-h-60 border border-slate-800">
                {testResult.responseBody}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Add Action Type Selector Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Post-Submission Action</h3>
                  <p className="text-xs text-slate-500">Select pipeline step type</p>
                </div>
              </div>

              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleCreateNewAction('webhook')}
                className="p-4 border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50/40 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Webhook Dispatch</h4>
                <p className="text-[11px] text-slate-500">Send HTTP POST/PUT payload to external URL endpoint.</p>
              </button>

              <button
                onClick={() => handleCreateNewAction('rest_api')}
                className="p-4 border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Code className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">REST API Sync</h4>
                <p className="text-[11px] text-slate-500">Full REST client with auth (Bearer, API Key, Basic) & JSON body.</p>
              </button>

              <button
                onClick={() => handleCreateNewAction('email')}
                className="p-4 border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Email Notification</h4>
                <p className="text-[11px] text-slate-500">Dispatch formatted email to admin or form submitter.</p>
              </button>

              <button
                onClick={() => handleCreateNewAction('redirect')}
                className="p-4 border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50/40 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">URL Redirect</h4>
                <p className="text-[11px] text-slate-500">Redirect submitter to external thank you page with UTM params.</p>
              </button>

              <button
                onClick={() => handleCreateNewAction('n8n')}
                className="p-4 border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50/40 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Workflow className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">n8n Automation</h4>
                <p className="text-[11px] text-slate-500">Trigger n8n node workflows with custom template mapping.</p>
              </button>

              <button
                onClick={() => handleCreateNewAction('ghl')}
                className="p-4 border-2 border-slate-100 hover:border-cyan-500 hover:bg-cyan-50/40 rounded-2xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">GoHighLevel CRM</h4>
                <p className="text-[11px] text-slate-500">Create or update contacts & custom fields in GHL sub-accounts.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Action Modal */}
      {draftAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getActionIcon(draftAction.type)}
                </div>
                <div>
                  <input
                    type="text"
                    value={draftAction.name}
                    onChange={(e) => setDraftAction({ ...draftAction, name: e.target.value })}
                    className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 rounded"
                  />
                  <div className="text-xs text-slate-500 px-1 uppercase font-semibold">
                    Type: {draftAction.type.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setDraftAction(null);
                  setEditingActionId(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveModalTab('config')}
                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'config'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Configuration
              </button>

              {(draftAction.type === 'webhook' || draftAction.type === 'rest_api') && (
                <button
                  onClick={() => setActiveModalTab('payload')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                    activeModalTab === 'payload'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Payload & Mapping
                </button>
              )}

              {draftAction.type === 'rest_api' && (
                <button
                  onClick={() => setActiveModalTab('auth')}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                    activeModalTab === 'auth'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Authentication
                </button>
              )}

              <button
                onClick={() => setActiveModalTab('conditions')}
                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'conditions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Conditions & Retry
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: Config */}
              {activeModalTab === 'config' && (
                <div className="space-y-4">
                  {/* Webhook Config */}
                  {draftAction.type === 'webhook' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Webhook Endpoint URL</label>
                        <input
                          type="url"
                          value={draftAction.webhookConfig?.url || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              webhookConfig: {
                                ...draftAction.webhookConfig!,
                                url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://api.yourdomain.com/v1/webhook"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">HTTP Method</label>
                          <select
                            value={draftAction.webhookConfig?.method || 'POST'}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                webhookConfig: {
                                  ...draftAction.webhookConfig!,
                                  method: e.target.value as any,
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Payload Type</label>
                          <select
                            value={draftAction.webhookConfig?.payloadType || 'entire_submission'}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                webhookConfig: {
                                  ...draftAction.webhookConfig!,
                                  payloadType: e.target.value as any,
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="entire_submission">Send Entire Submission Object</option>
                            <option value="mapped_fields">Custom Form Field Mappings</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* REST API Config */}
                  {draftAction.type === 'rest_api' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">REST Endpoint URL</label>
                        <input
                          type="url"
                          value={draftAction.restApiConfig?.url || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              restApiConfig: {
                                ...draftAction.restApiConfig!,
                                url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://api.crm.com/v3/objects"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">HTTP Method</label>
                        <select
                          value={draftAction.restApiConfig?.method || 'POST'}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              restApiConfig: {
                                ...draftAction.restApiConfig!,
                                method: e.target.value as HttpMethod,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Email Config */}
                  {draftAction.type === 'email' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">To Email Address</label>
                          <input
                            type="text"
                            value={draftAction.emailConfig?.to || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                emailConfig: {
                                  ...draftAction.emailConfig!,
                                  to: e.target.value,
                                },
                              })
                            }
                            placeholder="admin@company.com or {{email}}"
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Reply-To Address (Optional)</label>
                          <input
                            type="text"
                            value={draftAction.emailConfig?.replyTo || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                emailConfig: {
                                  ...draftAction.emailConfig!,
                                  replyTo: e.target.value,
                                },
                              })
                            }
                            placeholder="{{email}}"
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Subject Line</label>
                        <input
                          type="text"
                          value={draftAction.emailConfig?.subject || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              emailConfig: {
                                ...draftAction.emailConfig!,
                                subject: e.target.value,
                              },
                            })
                          }
                          placeholder="New response from {{full_name}}"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Body Content</label>
                        <textarea
                          rows={4}
                          value={draftAction.emailConfig?.body || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              emailConfig: {
                                ...draftAction.emailConfig!,
                                body: e.target.value,
                              },
                            })
                          }
                          placeholder="Hello,\n\nWe received your details:\nEmail: {{email}}"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Redirect Config */}
                  {draftAction.type === 'redirect' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Redirect Target URL</label>
                        <input
                          type="url"
                          value={draftAction.redirectConfig?.url || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              redirectConfig: {
                                ...draftAction.redirectConfig!,
                                url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://company.com/thank-you"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={draftAction.redirectConfig?.passQueryParams ?? true}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              redirectConfig: {
                                ...draftAction.redirectConfig!,
                                passQueryParams: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Pass submission ID and UTM parameters in redirect URL query string</span>
                      </label>
                    </>
                  )}

                  {/* Thank You Screen Config */}
                  {draftAction.type === 'thank_you' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Title Message</label>
                        <input
                          type="text"
                          value={draftAction.thankYouConfig?.title || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              thankYouConfig: {
                                ...draftAction.thankYouConfig!,
                                title: e.target.value,
                              },
                            })
                          }
                          placeholder="Thank You!"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Subtext / Message</label>
                        <textarea
                          rows={3}
                          value={draftAction.thankYouConfig?.message || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              thankYouConfig: {
                                ...draftAction.thankYouConfig!,
                                message: e.target.value,
                              },
                            })
                          }
                          placeholder="Your submission has been recorded."
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={draftAction.thankYouConfig?.showSummary ?? true}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              thankYouConfig: {
                                ...draftAction.thankYouConfig!,
                                showSummary: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Show submission response summary card on completion</span>
                      </label>
                    </>
                  )}

                  {/* n8n Action Config */}
                  {draftAction.type === 'n8n' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">n8n Webhook Endpoint URL</label>
                        <input
                          type="url"
                          value={draftAction.n8nConfig?.webhookUrl || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              n8nConfig: {
                                ...draftAction.n8nConfig!,
                                webhookUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="https://n8n.company.com/webhook/..."
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Method</label>
                          <select
                            value={draftAction.n8nConfig?.method || 'POST'}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                n8nConfig: {
                                  ...draftAction.n8nConfig!,
                                  method: e.target.value as any,
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Payload Delivery Mode</label>
                          <select
                            value={draftAction.n8nConfig?.payloadMode || 'entire_submission'}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                n8nConfig: {
                                  ...draftAction.n8nConfig!,
                                  payloadMode: e.target.value as any,
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="entire_submission">Entire Submission Object</option>
                            <option value="custom_mapping">Custom Template Mapping</option>
                          </select>
                        </div>
                      </div>

                      {draftAction.n8nConfig?.payloadMode === 'custom_mapping' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Custom Mapping Template</label>
                          <textarea
                            rows={6}
                            value={draftAction.n8nConfig?.customTemplate || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                n8nConfig: {
                                  ...draftAction.n8nConfig!,
                                  customTemplate: e.target.value,
                                },
                              })
                            }
                            placeholder='{ "form": { "id": "{{form.id}}" }, "submission": { "id": "{{submission.id}}" } }'
                            className="w-full px-3.5 py-2 text-xs bg-slate-900 text-rose-300 font-mono border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* GoHighLevel (GHL) Action Config */}
                  {draftAction.type === 'ghl' && (
                    <>
                      <div className="bg-cyan-50/60 p-4 rounded-xl border border-cyan-100 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-cyan-900">GoHighLevel Contact Mapping</h4>
                          <p className="text-[11px] text-cyan-700">
                            Maps form fields to GoHighLevel Contact properties in sub-account location.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-1 rounded-md uppercase">
                          Action: Upsert Contact
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Location ID (Optional Override)</label>
                        <input
                          type="text"
                          value={draftAction.ghlConfig?.locationId || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              ghlConfig: {
                                ...draftAction.ghlConfig!,
                                locationId: e.target.value,
                              },
                            })
                          }
                          placeholder="Uses connected integration location if empty"
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">First Name Field</label>
                          <select
                            value={draftAction.ghlConfig?.mappings?.firstName || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                ghlConfig: {
                                  ...draftAction.ghlConfig!,
                                  mappings: {
                                    ...draftAction.ghlConfig?.mappings,
                                    firstName: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="">-- Auto Detect / Default --</option>
                            {fields.map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.label || f.name} ({f.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Last Name Field</label>
                          <select
                            value={draftAction.ghlConfig?.mappings?.lastName || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                ghlConfig: {
                                  ...draftAction.ghlConfig!,
                                  mappings: {
                                    ...draftAction.ghlConfig?.mappings,
                                    lastName: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="">-- Auto Detect / Default --</option>
                            {fields.map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.label || f.name} ({f.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email Field</label>
                          <select
                            value={draftAction.ghlConfig?.mappings?.email || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                ghlConfig: {
                                  ...draftAction.ghlConfig!,
                                  mappings: {
                                    ...draftAction.ghlConfig?.mappings,
                                    email: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="">-- Auto Detect / Default --</option>
                            {fields.map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.label || f.name} ({f.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Phone Field</label>
                          <select
                            value={draftAction.ghlConfig?.mappings?.phone || ''}
                            onChange={(e) =>
                              setDraftAction({
                                ...draftAction,
                                ghlConfig: {
                                  ...draftAction.ghlConfig!,
                                  mappings: {
                                    ...draftAction.ghlConfig?.mappings,
                                    phone: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="">-- Auto Detect / Default --</option>
                            {fields.map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.label || f.name} ({f.name})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: Payload & Mapping */}
              {activeModalTab === 'payload' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Form Field to Endpoint Property Mapping</h4>
                      <p className="text-[11px] text-slate-500">
                        Map form field names (e.g. <code className="text-blue-600">full_name</code>) to target API payload paths (e.g. <code className="text-purple-600">customer.firstName</code>).
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const currentMappings = draftAction.webhookConfig?.fieldMappings || [];
                        const updatedMappings = [
                          ...currentMappings,
                          { formField: fields[0]?.name || 'field_1', targetField: '' },
                        ];
                        setDraftAction({
                          ...draftAction,
                          webhookConfig: {
                            ...draftAction.webhookConfig!,
                            fieldMappings: updatedMappings,
                          },
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Mapping Row</span>
                    </button>
                  </div>

                  {draftAction.type === 'webhook' && draftAction.webhookConfig?.payloadType === 'entire_submission' && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>Payload type is currently set to "Send Entire Submission Object". Mappings below will apply if payload type is changed to "Mapped Fields".</span>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Form Field Source</th>
                          <th className="p-2.5">Target JSON Property Path</th>
                          <th className="p-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(draftAction.webhookConfig?.fieldMappings || []).map((map, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5">
                              <select
                                value={map.formField}
                                onChange={(e) => {
                                  const updated = [...(draftAction.webhookConfig?.fieldMappings || [])];
                                  updated[idx].formField = e.target.value;
                                  setDraftAction({
                                    ...draftAction,
                                    webhookConfig: {
                                      ...draftAction.webhookConfig!,
                                      fieldMappings: updated,
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                              >
                                {fields.map((f) => (
                                  <option key={f.id} value={f.name}>
                                    {f.label || f.name} ({f.name})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2.5">
                              <input
                                type="text"
                                value={map.targetField}
                                onChange={(e) => {
                                  const updated = [...(draftAction.webhookConfig?.fieldMappings || [])];
                                  updated[idx].targetField = e.target.value;
                                  setDraftAction({
                                    ...draftAction,
                                    webhookConfig: {
                                      ...draftAction.webhookConfig!,
                                      fieldMappings: updated,
                                    },
                                  });
                                }}
                                placeholder="customer.email"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </td>

                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => {
                                  const updated = (draftAction.webhookConfig?.fieldMappings || []).filter((_, i) => i !== idx);
                                  setDraftAction({
                                    ...draftAction,
                                    webhookConfig: {
                                      ...draftAction.webhookConfig!,
                                      fieldMappings: updated,
                                    },
                                  });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Authentication (REST API) */}
              {activeModalTab === 'auth' && draftAction.type === 'rest_api' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold block">Secrets Security Protection</strong>
                      API credentials and Bearer tokens are protected and masked in server/execution logs.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Authentication Method</label>
                    <select
                      value={draftAction.restApiConfig?.authType || 'none'}
                      onChange={(e) =>
                        setDraftAction({
                          ...draftAction,
                          restApiConfig: {
                            ...draftAction.restApiConfig!,
                            authType: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">No Authentication</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="api_key">API Key Header</option>
                      <option value="basic">Basic Auth (Username/Password)</option>
                    </select>
                  </div>

                  {draftAction.restApiConfig?.authType === 'bearer' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bearer Auth Token</label>
                      <input
                        type="password"
                        value={draftAction.restApiConfig?.authBearerToken || ''}
                        onChange={(e) =>
                          setDraftAction({
                            ...draftAction,
                            restApiConfig: {
                              ...draftAction.restApiConfig!,
                              authBearerToken: e.target.value,
                            },
                          })
                        }
                        placeholder="sk_live_9028..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {draftAction.restApiConfig?.authType === 'api_key' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Header Name</label>
                        <input
                          type="text"
                          value={draftAction.restApiConfig?.authApiKeyHeader || 'X-API-Key'}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              restApiConfig: {
                                ...draftAction.restApiConfig!,
                                authApiKeyHeader: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">API Key Value</label>
                        <input
                          type="password"
                          value={draftAction.restApiConfig?.authApiKeyValue || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              restApiConfig: {
                                ...draftAction.restApiConfig!,
                                authApiKeyValue: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {draftAction.restApiConfig?.authType === 'basic' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                        <input
                          type="text"
                          value={draftAction.restApiConfig?.authBasicUsername || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              restApiConfig: {
                                ...draftAction.restApiConfig!,
                                authBasicUsername: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Password / Token</label>
                        <input
                          type="password"
                          value={draftAction.restApiConfig?.authBasicPassword || ''}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              restApiConfig: {
                                ...draftAction.restApiConfig!,
                                authBasicPassword: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Conditions & Retry */}
              {activeModalTab === 'conditions' && (
                <div className="space-y-6">
                  {/* Retry Policy */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Failure & Retry Policy
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Max Retry Attempts</label>
                        <select
                          value={draftAction.retryPolicy?.maxRetries || 0}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              retryPolicy: {
                                ...(draftAction.retryPolicy || { maxRetries: 0, retryDelayMs: 1000 }),
                                maxRetries: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value={0}>0 (No retries)</option>
                          <option value={1}>1 Retry</option>
                          <option value={2}>2 Retries</option>
                          <option value={3}>3 Retries</option>
                          <option value={5}>5 Retries</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Retry Delay (ms)</label>
                        <input
                          type="number"
                          value={draftAction.retryPolicy?.retryDelayMs || 1000}
                          onChange={(e) =>
                            setDraftAction({
                              ...draftAction,
                              retryPolicy: {
                                ...(draftAction.retryPolicy || { maxRetries: 0, retryDelayMs: 1000 }),
                                retryDelayMs: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          step={500}
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Execution Conditions (Optional)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Only run this pipeline step if specific form fields meet criteria.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const existing = draftAction.conditions || [];
                          const newCond: ActionCondition = {
                            fieldId: fields[0]?.name || 'field_1',
                            operator: 'equals',
                            value: '',
                          };
                          setDraftAction({
                            ...draftAction,
                            conditions: [...existing, newCond],
                          });
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Condition</span>
                      </button>
                    </div>

                    {(!draftAction.conditions || draftAction.conditions.length === 0) ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                        No conditions configured. This action will always run upon submission.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {draftAction.conditions.map((cond, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <select
                              value={cond.fieldId}
                              onChange={(e) => {
                                const updated = [...(draftAction.conditions || [])];
                                updated[idx].fieldId = e.target.value;
                                setDraftAction({ ...draftAction, conditions: updated });
                              }}
                              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              {fields.map((f) => (
                                <option key={f.id} value={f.name}>
                                  {f.label || f.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={cond.operator}
                              onChange={(e) => {
                                const updated = [...(draftAction.conditions || [])];
                                updated[idx].operator = e.target.value as any;
                                setDraftAction({ ...draftAction, conditions: updated });
                              }}
                              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              <option value="equals">equals</option>
                              <option value="not_equals">not equals</option>
                              <option value="contains">contains</option>
                              <option value="does_not_contain">does not contain</option>
                              <option value="is_empty">is empty</option>
                              <option value="is_not_empty">is not empty</option>
                            </select>

                            <input
                              type="text"
                              value={cond.value || ''}
                              onChange={(e) => {
                                const updated = [...(draftAction.conditions || [])];
                                updated[idx].value = e.target.value;
                                setDraftAction({ ...draftAction, conditions: updated });
                              }}
                              placeholder="Compare value"
                              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white flex-1"
                            />

                            <button
                              onClick={() => {
                                const updated = (draftAction.conditions || []).filter((_, i) => i !== idx);
                                setDraftAction({ ...draftAction, conditions: updated });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleTestAction(draftAction)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>Test Request</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDraftAction(null);
                    setEditingActionId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
