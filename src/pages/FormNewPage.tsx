import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Layers,
  Check,
  Plus,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../services/apiService';
import { TenantAccount } from '../types';

const TEMPLATES = [
  {
    id: 'contact_template',
    title: 'Contact Form Template',
    description: 'Name, email, phone number, subject line, and multi-line message input fields.',
    fieldsCount: 5,
    icon: FileText,
    recommendedFor: 'Inbound Inquiries',
  },
  {
    id: 'lead_gen_template',
    title: 'Lead Generation & Qualification',
    description: 'Multi-step qualifier capturing company size, role, budget range, and timeframe.',
    fieldsCount: 8,
    icon: Sparkles,
    recommendedFor: 'B2B Sales & Agencies',
  },
  {
    id: 'service_request_template',
    title: 'Service Request & Support Intake',
    description: 'Issue categorization, priority level, attachment, and client details.',
    fieldsCount: 6,
    icon: Layers,
    recommendedFor: 'Client Support & Operations',
  },
  {
    id: 'blank_template',
    title: 'Blank Custom Form',
    description: 'Start from scratch with an empty form canvas.',
    fieldsCount: 0,
    icon: Plus,
    recommendedFor: 'Custom Workflows',
  },
];

const normalizeRole = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const FormNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin =
    normalizeRole(user?.role) === 'super admin' ||
    String(user?.email || '').trim().toLowerCase() === 'superadmin@formflow.io';

  const [formName, setFormName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('contact_template');
  const [domain, setDomain] = useState<string>('forms.company.com');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tenants, setTenants] = useState<TenantAccount[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [isTenantLoading, setIsTenantLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      setTenants([]);
      setTenantId('');
      return;
    }

    let cancelled = false;

    const loadTenants = async () => {
      setIsTenantLoading(true);
      try {
        const data = await apiService.getTenants();
        if (!cancelled) {
          setTenants(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setTenants([]);
        }
      } finally {
        if (!cancelled) {
          setIsTenantLoading(false);
        }
      }
    };

    void loadTenants();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin && tenants.length === 1 && !tenantId) {
      setTenantId(tenants[0].id);
    }
  }, [isSuperAdmin, tenants, tenantId]);

  const slug = formName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (isSuperAdmin && !tenantId) {
      alert('Please select an agency account.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await apiService.createForm({
        name: formName.trim(),
        slug: slug || 'new-form',
        description: description.trim() || 'New form created in FormFlow',
        status: 'draft',
        fieldsCount: TEMPLATES.find((t) => t.id === selectedTemplate)?.fieldsCount || 4,
        domain: domain,
        ...(isSuperAdmin && tenantId ? { tenantId } : {}),
      });

      navigate(`/forms/${created.id}/builder`);
    } catch (err) {
      alert('Failed to create form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/forms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forms Directory
        </Link>
        <span className="text-xs text-slate-400 font-medium">Step 1 of 2: Setup Details</span>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create New Form</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose a starting template and configure initial form properties.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="formName" className="block text-xs font-bold text-slate-700">
                Form Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="formName"
                type="text"
                required
                placeholder="e.g. Q4 Growth Partner Application"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="formSlug" className="block text-xs font-bold text-slate-700">
                URL Slug / Subpath
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 text-xs text-slate-400 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg font-mono">
                  /s/
                </span>
                <input
                  id="formSlug"
                  type="text"
                  readOnly
                  value={slug || 'form-slug'}
                  className="w-full px-3 py-2 text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-r-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="description" className="block text-xs font-bold text-slate-700">
                Description / Purpose
              </label>
              <input
                id="description"
                type="text"
                placeholder="Brief internal summary of what this form collects"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="domain" className="block text-xs font-bold text-slate-700">
                Primary Domain
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="forms.company.com">forms.company.com (Default)</option>
                  <option value="app.leadsflow.io">app.leadsflow.io</option>
                </select>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="space-y-1.5">
                <label htmlFor="tenantId" className="block text-xs font-bold text-slate-700">
                  Agency Account
                </label>
                <select
                  id="tenantId"
                  required
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="">
                    {isTenantLoading ? 'Loading accounts...' : 'Select an agency account'}
                  </option>
                  {tenants.length === 0 && !isTenantLoading && <option disabled>No active accounts available</option>}
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              Select Form Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 mt-3">{tmpl.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{tmpl.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>{tmpl.fieldsCount} Pre-configured Fields</span>
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                        {tmpl.recommendedFor}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/forms"
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formName.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Form & Launch Builder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
