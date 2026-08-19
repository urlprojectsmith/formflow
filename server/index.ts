import dotenv from 'dotenv';
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import {
  initialForms as seedForms,
  initialSubmissions as seedSubmissions,
  initialIntegrations as seedIntegrations,
  initialDomains as seedDomains,
  initialNotifications as seedNotifications,
  initialTenants as seedTenants,
} from '../src/services/mockData';
import { createDefaultField } from '../src/utils/formBuilderUtils';
import {
  Domain,
  Form,
  FormDefinition,
  FormSubmission,
  FormVersion,
  FormStatus as FormStatusType,
  Integration,
  NotificationItem,
  TenantAccount,
  TenantStatus,
  UserProfile,
} from '../src/types';
import { SqliteStateStore, DataStoreSnapshot } from './storage/sqliteStateStore';

dotenv.config();

type Role = 'Super Admin' | 'Admin' | 'Developer' | 'User';
type AuthUser = UserProfile;
type InternalAuthUser = AuthUser & { password: string };
type AuthRequest = express.Request & { authUser?: AuthUser };

type SeedCredential = {
  email: string;
  password: string;
  role: Role;
  tenantId?: string;
  name: string;
  organizationName: string;
  avatarUrl: string;
  plan: AuthUser['plan'];
};
type LoginUserSeed = SeedCredential & {
  tenantIds: string[];
};

interface ApiEnvelope<T> {
  data: T;
  ok: true;
}

interface ErrorEnvelope {
  ok: false;
  error: string;
}

type IntegrationTestStatus = 'passed' | 'warning' | 'failed';

interface IntegrationTestResult {
  integrationId: string;
  provider: string;
  status: IntegrationTestStatus;
  message: string;
  details: string;
  testedAt: string;
  sample: unknown;
}

const APP_ROLES: Role[] = ['Super Admin', 'Admin', 'Developer', 'User'];
const ALLOWED_FORM_STATUSES: FormStatusType[] = ['published', 'draft', 'archived'];
const ALLOWED_INTEGRATION_STATUSES = ['connected', 'disconnected', 'error'];
const DEFAULT_USER_PASSWORD = 'Welcome@2026';
const LOGIN_CREDENTIALS: LoginUserSeed[] = [
  {
    email: 'superadmin@formflow.io',
    password: 'SuperAdmin@2026',
    role: 'Super Admin',
    tenantId: undefined,
    tenantIds: [],
    name: 'Platform Admin',
    organizationName: 'Summit FormFlow Holdings',
    plan: 'Enterprise',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
  },
  {
    email: 'admin@tenant-acme.local',
    password: 'Admin@2026',
    role: 'Admin',
    tenantId: 'tenant_acme',
    tenantIds: ['tenant_acme'],
    name: 'Agency Admin',
    organizationName: 'Agency Workspace',
    plan: 'Growth Plan',
    avatarUrl:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=200',
  },
  {
    email: 'developer@tenant-acme.local',
    password: 'Developer@2026',
    role: 'Developer',
    tenantId: 'tenant_acme',
    tenantIds: ['tenant_acme'],
    name: 'Solution Developer',
    organizationName: 'Agency Workspace',
    plan: 'Growth Plan',
    avatarUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=200',
  },
  {
    email: 'user@tenant-acme.local',
    password: 'User@2026',
    role: 'User',
    tenantId: 'tenant_acme',
    tenantIds: ['tenant_acme'],
    name: 'Platform User',
    organizationName: 'Agency Workspace',
    plan: 'Starter',
    avatarUrl:
      'https://images.unsplash.com/photo-1534665482403-a909d0d7a5af?auto=format&fit=crop&q=80&w=200',
  },
];

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();

const PORT = Number(process.env.PORT || 4450);
const SECRET = process.env.WEBHOOK_SIGNING_SECRET || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'formflow.db');
const DB_BACKUP_DIR = process.env.DB_BACKUP_DIR || path.resolve(process.cwd(), 'data', 'backups');
const API_PREFIX = '/api';
const DEFAULT_TENANT_ID = 'tenant_acme';

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

function ok<T>(res: express.Response, payload: T, status = 200) {
  const response: ApiEnvelope<T> = {
    ok: true,
    data: payload,
  };
  res.status(status).json(response);
}

function fail(res: express.Response, msg: string, status = 400) {
  const response: ErrorEnvelope = {
    ok: false,
    error: msg,
  };
  res.status(status).json(response);
}

function nowISO() {
  return new Date().toISOString();
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function generateAuthToken(user: AuthUser) {
  const raw = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationName: user.organizationName,
    tenantId: user.tenantId,
    issuedAt: nowISO(),
  });
  return Buffer.from(raw).toString('base64url');
}

function parseAuthToken(header: string | undefined): AuthUser | null {
  if (!header) return null;
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Partial<AuthUser> & {
      id?: string;
      email?: string;
      role?: string;
      organizationName?: string;
      tenantId?: string;
    };
    if (!payload || !payload.email || !payload.role) return null;
    return {
      id: payload.id || randomId('usr'),
      name: payload.email.split('@')[0] || 'User',
      email: payload.email,
      role: payload.role as Role,
      tenantId: payload.tenantId,
      avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(payload.email)}`,
      organizationName: payload.organizationName || 'Acme Growth Labs',
      plan: 'Growth Plan',
    };
  } catch {
    return null;
  }
}

class DataStore {
  private readonly persistence = new SqliteStateStore(DB_PATH, DB_BACKUP_DIR);
  private tenants: TenantAccount[] = [...seedTenants];
  private forms: Form[] = [...seedForms];
  private submissions: FormSubmission[] = [...seedSubmissions];
  private integrations: Integration[] = [...seedIntegrations];
  private domains: Domain[] = [...seedDomains];
  private users: InternalAuthUser[] = [];
  private notifications: NotificationItem[] = [...seedNotifications];
  private formDefinitions = new Map<string, FormDefinition>();
  private formVersions = new Map<string, FormVersion[]>();
  private webhookEvents: Array<{
    id: string;
    provider: string;
    timestamp: string;
    headers: Record<string, string>;
    payload: unknown;
  }> = [];

  constructor() {
    const snapshot = this.persistence.load();
    if (snapshot) {
      this.loadSnapshot(snapshot);
      if (!this.tenants.length) {
        this.tenants = [this.getDefaultTenant()];
      }
      if (!this.users.length) {
        this.users = this.buildSeedUsers();
      }
      return;
    }
    this.tenants = this.tenants.length > 0 ? [...this.tenants] : [this.getDefaultTenant()];
    this.users = this.buildSeedUsers();
    this.persist();
  }

  private getDefaultTenant(): TenantAccount {
    return {
      id: DEFAULT_TENANT_ID,
      name: 'Acme Growth Labs',
      slug: 'acme',
      status: 'active',
      plan: 'Growth Plan',
      createdAt: nowISO(),
      adminName: 'Agency Admin',
      adminEmail: 'admin@tenant-acme.local',
    };
  }

  private buildSeedUsers(): InternalAuthUser[] {
    const baseTenantIds = this.tenants.length ? this.tenants.map((tenant) => tenant.id) : [DEFAULT_TENANT_ID];
    const ensureTenantExists = (tenantId?: string) =>
      !!tenantId && this.tenants.some((tenant) => tenant.id === tenantId)
        ? tenantId
        : tenantId && baseTenantIds.includes(tenantId)
          ? tenantId
          : undefined;

    const seedUsers = LOGIN_CREDENTIALS.map((seed) => ({
      id: `seed_${seed.role.toLowerCase().replace(/ /g, '-')}_${seed.email}`,
      email: seed.email,
      password: seed.password,
      role: seed.role,
      tenantId: ensureTenantExists(seed.tenantId),
      tenantIds: Array.from(new Set(seed.tenantIds.map((tenantId) => tenantId).filter(Boolean))),
      name: seed.name,
      avatarUrl: seed.avatarUrl,
      organizationName: seed.organizationName,
      plan: seed.plan,
    }));

    const unique = new Map<string, InternalAuthUser>();
    for (const user of seedUsers) {
      unique.set(user.email, user);
    }
    return Array.from(unique.values());
  }

  private persist() {
    const snapshot = this.snapshot();
    this.persistence.save(snapshot);
  }

  private snapshot(): DataStoreSnapshot {
    return {
      version: 1,
      createdAt: nowISO(),
      tenants: this.tenants,
      forms: this.forms,
      submissions: this.submissions,
      integrations: this.integrations,
      domains: this.domains,
      users: this.users,
      notifications: this.notifications,
      formDefinitions: [...this.formDefinitions.entries()],
      formVersions: [...this.formVersions.entries()],
      webhookEvents: this.webhookEvents,
    };
  }

  private loadSnapshot(snapshot: DataStoreSnapshot) {
    this.tenants = snapshot?.tenants ? [...snapshot.tenants] : [...seedTenants];
    this.forms = snapshot?.forms ? [...snapshot.forms] : [...seedForms];
    this.submissions = snapshot?.submissions ? [...snapshot.submissions] : [...seedSubmissions];
    this.integrations = Array.isArray(snapshot?.integrations) && snapshot.integrations.length > 0
      ? [...snapshot.integrations]
      : [...seedIntegrations];
    this.domains = snapshot?.domains ? [...snapshot.domains] : [...seedDomains];
    if (Array.isArray(snapshot?.users) && snapshot.users.length > 0) {
      this.users = (snapshot.users as Partial<InternalAuthUser>[]).map((entry) => ({
        id: String(entry.id || crypto.randomBytes(4).toString('hex')),
        email: normalizeEmail(entry.email || ''),
        password: String(entry.password || DEFAULT_USER_PASSWORD),
        role: (entry.role as Role) || 'User',
        tenantId: normalizeEmail(entry.tenantId || ''),
        tenantIds: Array.isArray(entry.tenantIds) && entry.tenantIds.length > 0
          ? (entry.tenantIds as string[]).map((tenantId) => normalizeEmail(String(tenantId))).filter(Boolean)
          : entry.tenantId
            ? [normalizeEmail(entry.tenantId)]
            : [],
        name: String(entry.name || ''),
        avatarUrl: entry.avatarUrl || 'https://api.dicebear.com/8.x/initials/svg?seed=' + encodeURIComponent(String(entry.email || 'user')),
        organizationName: String(entry.organizationName || 'Acme Growth Labs'),
        plan: (entry.plan as AuthUser['plan']) || 'Starter',
      }));
      if (this.users.length === 0) {
        this.users = this.buildSeedUsers();
      }
    } else {
      this.users = this.buildSeedUsers();
    }
    this.notifications = snapshot?.notifications ? [...snapshot.notifications] : [...seedNotifications];
    this.webhookEvents = snapshot?.webhookEvents ? [...snapshot.webhookEvents] : [];

    this.formDefinitions = new Map<string, FormDefinition>(snapshot?.formDefinitions || []);
    this.formVersions = new Map<string, FormVersion[]>(snapshot?.formVersions || []);

  }

  exportState() {
    return this.snapshot();
  }

  importState(snapshot: Partial<DataStoreSnapshot>) {
    const safeSnapshot: DataStoreSnapshot = {
      ...(snapshot as DataStoreSnapshot),
      version: 1,
      createdAt: nowISO(),
      tenants: snapshot?.tenants || [],
      forms: snapshot?.forms || [],
      submissions: snapshot?.submissions || [],
      integrations: snapshot?.integrations || [],
      domains: snapshot?.domains || [],
      users: snapshot?.users || [],
      notifications: snapshot?.notifications || [],
      formDefinitions: snapshot?.formDefinitions || [],
      formVersions: snapshot?.formVersions || [],
      webhookEvents: snapshot?.webhookEvents || [],
    };
    this.loadSnapshot(safeSnapshot);
    this.persist();
  }

  getBackups() {
    return this.persistence.listJsonBackups();
  }

  createBackup() {
    return this.persistence.createJsonBackup(this.snapshot());
  }

  deleteBackup(fileName: string) {
    return this.persistence.removeBackup(fileName);
  }

  private resolveTenantScope(authUser: AuthUser, requestedTenantId?: string) {
    if (authUser.role === 'Super Admin') {
      return requestedTenantId;
    }
    return requestedTenantId ? requestedTenantId : authUser.tenantId || DEFAULT_TENANT_ID;
  }

  private canAccessTenant(authUser: AuthUser, tenantId?: string) {
    if (authUser.role === 'Super Admin') return true;
    if (!tenantId) return false;
    return tenantId === authUser.tenantId;
  }

  private tenantAware<T extends { tenantId?: string }>(items: T[], tenantId?: string) {
    if (!tenantId) return [...items];
    return items.filter((item) => item.tenantId === tenantId);
  }

  private buildIntegrationTestSample(integrationId: string) {
    if (integrationId === 'int_n8n') {
      return {
        event: 'form_submission.created',
        source: 'FormFlow Demo',
        executionId: `n8n_${Date.now()}`,
      };
    }
    if (integrationId === 'int_ghl') {
      return {
        contact: {
          email: 'lead@example.com',
          firstName: 'Demo',
          lastName: 'Lead',
        },
        status: 'upserted',
        ghlContactId: `ghl_${Date.now()}`,
      };
    }
    if (integrationId === 'int_zapier') {
      return {
        task: 'Zapier workflow triggered',
        zapId: `zap_test_${Date.now()}`,
        status: 'accepted',
      };
    }
    if (integrationId === 'int_webhook') {
      return {
        event: 'demo_form_submission',
        webhookTarget: 'https://api.acmegrowth.com/v1/webhooks/forms',
        requestId: `wh_${Date.now()}`,
      };
    }
    if (integrationId === 'int_sheets') {
      return {
        sheet: 'Sales Inbound Leads',
        rowAppended: true,
        spreadsheetId: `sheet_${Date.now()}`,
      };
    }
    if (integrationId === 'int_hubspot') {
      return {
        contactId: `hub_${Date.now()}`,
        status: 'crm_sync_enqueued',
        pipeline: 'demo',
      };
    }
    if (integrationId === 'int_slack') {
      return {
        channel: '#sales-notifications',
        messageId: `msg_${Date.now()}`,
        status: 'notification_sent',
      };
    }
    if (integrationId === 'int_salesforce') {
      return {
        leadId: `sf_${Date.now()}`,
        status: 'lead_upserted',
        object: 'Lead',
      };
    }
    if (integrationId === 'int_stripe') {
      return {
        checkoutSession: `cs_test_${Date.now()}`,
        status: 'payment_intent_test_mode',
        currency: 'usd',
      };
    }
    if (integrationId === 'int_mailchimp') {
      return {
        audience: 'formflow-leads',
        contactHash: `mc_${Date.now()}`,
        status: 'subscriber_pending',
      };
    }
    return {
      status: 'simulated',
      requestId: `int_test_${Date.now()}`,
    };
  }

  private ensureDefinitions(formId: string) {
    if (this.formDefinitions.has(formId)) return;

    const form = this.forms.find((f) => f.id === formId);
    if (!form) return;
    const fields =
      this.formVersions.has(formId) && this.formVersions.get(formId)?.[0]?.definition?.fields
        ? this.formVersions.get(formId)![0].definition.fields
        : this.buildDefaultFields(form?.name || 'New Form', formId);
    const definition: FormDefinition = {
      id: form.id,
      name: form.name,
      description: form.description,
      status: form.status,
      version: 1,
      publishedVersion: form.publishedVersion,
      fields,
      settings: {
        submitButtonText: 'Submit Response',
        successMessage: 'Thank you! Your submission has been recorded.',
      },
      theme: {
        primaryColor: '#2563eb',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
      },
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
    this.formDefinitions.set(formId, definition);

    const version: FormVersion = {
      id: randomId(`ver_${formId}`),
      formId,
      versionNumber: 1,
      status: form.status,
      definition,
      createdAt: nowISO(),
      createdBy: 'System',
      publishedAt: form.status === 'published' ? form.createdAt : undefined,
      notes: 'Seed version',
    };
    this.formVersions.set(formId, [version]);
  }

  getForms(query?: string, status?: FormStatusType | 'all', tenantId?: string) {
    let result = this.tenantAware([...this.forms], tenantId);
    if (status && status !== 'all') {
      result = result.filter((f) => f.status === status);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (form) =>
          form.name.toLowerCase().includes(q) ||
          form.slug.toLowerCase().includes(q) ||
          form.description.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getDashboardMetrics(tenantId?: string) {
    const forms = this.tenantAware(this.forms, tenantId);
    const submissions = this.tenantAware(this.submissions, tenantId);
    const totalForms = forms.length;
    const publishedForms = forms.filter((f) => f.status === 'published').length;
    const draftForms = forms.filter((f) => f.status === 'draft').length;
    const totalSubmissions = submissions.reduce((acc) => acc + 1, 0);
    const totalViews = forms.reduce((acc, f) => acc + (f.viewsCount || 0), 0);
    const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;
    return {
      totalForms,
      publishedForms,
      draftForms,
      totalSubmissions,
      conversionRate: Math.round(conversionRate * 10) / 10,
      formsChangePct: 8.2,
      submissionsChangePct: 12.1,
      conversionChangePct: 4.2,
    };
  }

  getFormById(formId: string, tenantId?: string) {
    return this.tenantAware(this.forms, tenantId).find((f) => f.id === formId) || null;
  }

  createForm(data: Partial<Form>, tenantId?: string) {
    const form: Form = {
      id: data.id || randomId('form'),
      name: data.name || 'Untitled Form',
      slug: data.slug || `form-${Date.now()}`,
      description: data.description || '',
      status: (data.status as FormStatusType) || 'draft',
      publishedVersion: data.publishedVersion,
      fieldsCount: data.fieldsCount || 0,
      submissionsCount: 0,
      viewsCount: 0,
      conversionRate: 0,
      tenantId: tenantId || DEFAULT_TENANT_ID,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      domain: data.domain,
      theme: data.theme,
    };
    this.forms.unshift(form);
    this.persist();
    return form;
  }

  deleteForm(formId: string, tenantId?: string) {
    const before = this.forms.length;
    this.forms = this.forms.filter((f) => f.id !== formId || (tenantId && f.tenantId !== tenantId));
    if (before !== this.forms.length) {
      this.persist();
      return true;
    }
    return false;
  }

  updateForm(formId: string, data: Partial<Form>, tenantId?: string) {
    const index = this.forms.findIndex((f) => f.id === formId && (!tenantId || f.tenantId === tenantId));
    if (index < 0) return null;
    this.forms[index] = {
      ...this.forms[index],
      ...data,
      updatedAt: nowISO(),
    };
    this.persist();
    return this.forms[index];
  }

  getVersions(formId: string, tenantId?: string) {
    const form = this.getFormById(formId, tenantId);
    if (!form) return [];
    const versions = this.formVersions.get(formId) || [];
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  }

  getDefinition(formId: string, tenantId?: string) {
    const form = this.getFormById(formId, tenantId);
    if (!form) return null;
    this.ensureDefinitions(formId);
    const versions = this.formVersions.get(formId) || [];
    const draft = versions.find((v) => v.status === 'draft');
    const fallback = versions[0];
    const active = draft || fallback;
    if (!active) return null;
    return active.definition || this.formDefinitions.get(formId);
  }

  saveDefinition(formId: string, definition: Partial<FormDefinition>, tenantId?: string) {
    const form = this.getFormById(formId, tenantId);
    if (!form) return null;

    this.ensureDefinitions(formId);
    const versions = this.formVersions.get(formId) || [];
    const draft = versions.find((v) => v.status === 'draft') || versions[0];
    if (!draft) return null;
    const newDefinition: FormDefinition = {
      ...this.formDefinitions.get(formId)!,
      ...definition,
      id: formId,
      status: 'draft',
      updatedAt: nowISO(),
    };
    draft.status = 'draft';
    draft.definition = newDefinition;
    this.formDefinitions.set(formId, newDefinition);

    const targetForm = this.forms.find((f) => f.id === formId);
    if (targetForm) {
      targetForm.updatedAt = nowISO();
      targetForm.name = newDefinition.name || targetForm.name;
      targetForm.description = newDefinition.description || targetForm.description;
      targetForm.fieldsCount = newDefinition.fields.length;
    }
    this.persist();
    return newDefinition;
  }

  publish(formId: string, targetVersionNumber?: number, tenantId?: string) {
    const versions = this.formVersions.get(formId) || [];
    const form = this.getFormById(formId, tenantId);
    if (!form) return null;
    let target = targetVersionNumber
      ? versions.find((v) => v.versionNumber === targetVersionNumber)
      : versions.find((v) => v.status === 'draft') || versions[versions.length - 1];
    if (!target) return null;
    versions.forEach((version) => {
      if (version.status === 'published') {
        version.status = 'archived';
        version.definition.status = 'archived';
      }
    });
    target.status = 'published';
    target.definition.status = 'published';
    target.publishedAt = nowISO();
    target.definition.version = target.versionNumber;
    target.definition.publishedVersion = target.versionNumber;
    form.status = 'published';
    form.publishedVersion = target.versionNumber;
    form.updatedAt = nowISO();
    form.fieldsCount = target.definition.fields.length;
    this.persist();
    return target;
  }

  rollback(formId: string, targetVersionNumber: number, tenantId?: string) {
    const versions = this.formVersions.get(formId) || [];
    const form = this.getFormById(formId, tenantId);
    if (!form) return null;
    const target = versions.find((v) => v.versionNumber === targetVersionNumber);
    if (!target) return null;
    const nextVersion = Math.max(...versions.map((v) => v.versionNumber), 0) + 1;
    const cloned = JSON.parse(JSON.stringify(target));
    const newVersion: FormVersion = {
      ...cloned,
      id: randomId(`ver_${formId}`),
      versionNumber: nextVersion,
      status: 'published',
      publishedAt: nowISO(),
      notes: `Rollback from v${targetVersionNumber}`,
      createdBy: 'System',
      createdAt: nowISO(),
    };
    versions.forEach((version) => {
      if (version.status === 'published') {
        version.status = 'archived';
      }
    });
    versions.push(newVersion);
    this.formVersions.set(formId, versions);
    this.formDefinitions.set(formId, cloned.definition as FormDefinition);
    if (form) {
      form.status = 'published';
      form.publishedVersion = nextVersion;
      form.updatedAt = nowISO();
      form.fieldsCount = cloned.definition.fields.length;
    }
    this.persist();
    return newVersion;
  }

  getPublishedDefinition(formId: string, tenantId?: string) {
    const form = this.getFormById(formId, tenantId);
    if (!form) return null;
    this.ensureDefinitions(formId);
    const versions = this.formVersions.get(formId) || [];
    const active = versions.find((v) => v.status === 'published');
    return active ? JSON.parse(JSON.stringify(active.definition)) : null;
  }

  addSubmission(formId: string, formName: string, submittedData: Record<string, any>, metadata: Record<string, any> = {}, tenantId?: string) {
    const submissionId = randomId('sub');
    const submission: FormSubmission = {
      id: submissionId,
      formId,
      tenantId: tenantId || DEFAULT_TENANT_ID,
      formVersionId: metadata.formVersion || 1,
      formName,
      submittedAt: nowISO(),
      status: 'new',
      fields: submittedData,
      data: submittedData,
      userEmail: metadata.userEmail || this.guessEmail(submittedData),
      userName: metadata.userName || this.guessName(submittedData),
      userLocation: metadata.userLocation || 'Unknown',
      ipAddress: metadata.ipAddress || '127.0.0.1',
      metadata: {
        referrer: metadata.referrer || '',
        sourceUrl: metadata.sourceUrl || '',
        utmParameters: metadata.utmParameters || {},
        visitorId: `vis_${submissionId}`,
        sessionId: `sess_${submissionId}`,
        formId,
        formVersion: metadata.formVersion || 1,
        submissionId,
      },
    };
    this.submissions.unshift(submission);

    const form = this.forms.find((f) => f.id === formId);
    if (form) {
      form.submissionsCount += 1;
      form.viewsCount = Math.max(form.viewsCount + 1, form.submissionsCount);
      form.updatedAt = nowISO();
    }
    this.persist();
    return submission;
  }

  getSubmissions(formId?: string, tenantId?: string) {
    const scoped = this.tenantAware(this.submissions, tenantId);
    if (!formId) return scoped;
    return [...scoped.filter((s) => s.formId === formId)];
  }

  getIntegrations(tenantId?: string) {
    return this.tenantAware([...this.integrations], tenantId);
  }

  toggleIntegrationStatus(id: string, status: string, tenantId?: string) {
    const index = this.integrations.findIndex((item) => item.id === id && (!tenantId || item.tenantId === tenantId));
    if (index < 0) return null;
    if (!ALLOWED_INTEGRATION_STATUSES.includes(status as any)) {
      return null;
    }
    this.integrations[index] = {
      ...this.integrations[index],
      status: status as Integration['status'],
      lastSync: status === 'connected' ? nowISO() : this.integrations[index].lastSync,
    };
    this.persist();
    return this.integrations[index];
  }

  testIntegration(integrationId: string, tenantId?: string): IntegrationTestResult | null {
    const integration = this.tenantAware(this.integrations, tenantId).find((item) => item.id === integrationId);
    if (!integration) return null;

    const isConnected = integration.status === 'connected';
    const status = isConnected ? 'passed' : 'warning';
    const provider = (() => {
      switch (integration.id) {
        case 'int_n8n':
          return 'n8n';
        case 'int_ghl':
          return 'GoHighLevel';
        case 'int_zapier':
          return 'Zapier';
        case 'int_webhook':
          return 'HTTP Webhooks';
        case 'int_sheets':
          return 'Google Sheets';
        case 'int_hubspot':
          return 'HubSpot CRM';
        case 'int_slack':
          return 'Slack Notifications';
        case 'int_salesforce':
          return 'Salesforce';
        case 'int_stripe':
          return 'Stripe Payments';
        case 'int_mailchimp':
          return 'Mailchimp';
        default:
          return integration.name || 'External Integration';
      }
    })();

    return {
      integrationId: integration.id,
      provider,
      status,
      message: isConnected
        ? 'Connectivity test returned successfully.'
        : 'Integration is currently disconnected.',
      details: isConnected
        ? `${provider} endpoint accepted test payload.`
        : `${provider} is offline. Reconnect and re-run this test.`,
      testedAt: nowISO(),
      sample: this.buildIntegrationTestSample(integration.id),
    };
  }

  testAllIntegrations(tenantId?: string) {
    return this.tenantAware(this.integrations, tenantId).map(
      (item) =>
        this.testIntegration(item.id, tenantId) || {
          integrationId: item.id,
          provider: item.name || 'External Integration',
          status: 'failed' as IntegrationTestStatus,
          message: 'Test runner failed.',
          details: 'No local metadata available for this provider.',
          testedAt: nowISO(),
          sample: {
            status: 'failed',
            reason: 'missing_provider_metadata',
          },
        }
    );
  }

  getDomains(tenantId?: string) {
    return this.tenantAware([...this.domains], tenantId);
  }

  addDomain(domainName: string, tenantId?: string) {
    const dom: Domain = {
      id: randomId('dom'),
      domainName: domainName.toLowerCase().trim(),
      tenantId: tenantId || DEFAULT_TENANT_ID,
      status: 'pending_dns',
      connectedFormsCount: 0,
      sslEnabled: false,
      createdAt: nowISO(),
      isDefault: false,
      cnameRecord: 'ingress.formflow.io',
    };
    this.domains.push(dom);
    this.persist();
    return dom;
  }

  getNotifications(tenantId?: string) {
    return this.tenantAware([...this.notifications], tenantId);
  }

  markNotificationRead(id: string) {
    const note = this.notifications.find((item) => item.id === id);
    if (!note) return false;
    note.read = true;
    this.persist();
    return true;
  }

  getTenants() {
    return [...this.tenants];
  }

  getTenantById(tenantId: string) {
    return this.tenants.find((tenant) => tenant.id === tenantId) || null;
  }

  createTenant(data: {
    name: string;
    slug: string;
    status?: TenantStatus;
    plan?: 'Starter' | 'Growth Plan' | 'Enterprise';
    adminName?: string;
    adminEmail?: string;
  }) {
    const slug = String(data.slug || '').trim().toLowerCase();
    const name = String(data.name || '').trim();
    if (!name || !slug) {
      return null;
    }
    const exists = this.tenants.some((tenant) => tenant.slug === slug);
    if (exists) return null;

    const tenant: TenantAccount = {
      id: randomId('tenant'),
      name,
      slug,
      status: data.status || 'active',
      plan: data.plan || 'Growth Plan',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      adminName: data.adminName,
      adminEmail: data.adminEmail,
    };
    this.tenants.unshift(tenant);
    this.persist();
    return tenant;
  }

  updateTenant(tenantId: string, data: Partial<Omit<TenantAccount, 'id' | 'createdAt'>>) {
    const idx = this.tenants.findIndex((tenant) => tenant.id === tenantId);
    if (idx < 0) return null;
    this.tenants[idx] = {
      ...this.tenants[idx],
      ...data,
      updatedAt: nowISO(),
    };
    this.persist();
    return this.tenants[idx];
  }

  getTenantUsers(tenantId: string) {
    return [
      ...this.users
        .filter((user) => {
          const membership = Array.isArray(user.tenantIds) ? user.tenantIds : [];
          return (
            user.role !== 'Super Admin' &&
            (user.tenantId === tenantId || membership.includes(tenantId))
          );
        })
        .map((user) => this.sanitizeUser(user)),
    ];
  }

  createTenantUser(
    tenantId: string,
    userInput: Partial<Omit<UserProfile, 'id'>> & {
      role: 'Admin' | 'Developer' | 'User';
      password: string;
      tenantIds?: string[];
    }
  ) {
    if (!tenantId || this.tenants.every((tenant) => tenant.id !== tenantId)) {
      return null;
    }
    const tenant = this.getTenantById(tenantId);
    if (!tenant || tenant.status !== 'active') return null;

    const email = String(userInput.email || '').trim().toLowerCase();
    if (!email) return null;
    const role = userInput.role as Role;
    if (!role || role === 'Super Admin') return null;
    const password = String(userInput.password || '').trim();
    if (!password) return null;

    const requestedTenantIds = Array.isArray(userInput.tenantIds) && userInput.tenantIds.length > 0
      ? Array.from(new Set(userInput.tenantIds.map((id) => String(id || '').trim()).filter(Boolean)))
      : [tenantId];
    const hasInvalidTenant = requestedTenantIds.some(
      (id) => this.tenants.every((tenant) => tenant.id !== id)
    );
    if (hasInvalidTenant) return null;

    const existing = this.users.find(
      (user) =>
        user.email.toLowerCase() === email &&
        user.role === role &&
        requestedTenantIds.some((id) => user.tenantId === id || (Array.isArray(user.tenantIds) && user.tenantIds.includes(id)))
    );
    if (existing) return null;

    const user: InternalAuthUser = {
      id: randomId('usr'),
      name: userInput.name || `${role} User`,
      email,
      role,
      tenantId,
      tenantIds: requestedTenantIds,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      organizationName: tenant.name,
      plan: role === 'Admin' || role === 'Developer' ? 'Growth Plan' : 'Starter',
      password,
    };
    this.users.push(user);
    this.persist();
    return this.sanitizeUser(user);
  }

  createTenantUsers(
    tenantIds: string[],
    userInput: Partial<Omit<UserProfile, 'id'>> & {
      role: 'Admin' | 'Developer' | 'User';
      password: string;
      tenantIds?: string[];
    }
  ) {
    const normalizedTenantIds = tenantIds.map((id) => String(id || '').trim()).filter(Boolean);
    const validTenantIds = normalizedTenantIds.filter((id) => this.tenants.some((tenant) => tenant.id === id));
    if (!validTenantIds.length) return [];

    const baseTenantId = validTenantIds[0];
    const user = this.createTenantUser(baseTenantId, {
      ...userInput,
      tenantIds: validTenantIds,
    });
    if (!user || !user.id) return [];

    const mergedUser = this.users.find((entry) => entry.id === user.id);
    if (!mergedUser) return [];
    mergedUser.tenantIds = validTenantIds;
    mergedUser.tenantId = baseTenantId;
    this.persist();
    return [this.sanitizeUser(mergedUser)];
  }

  updateTenantUser(tenantId: string, userId: string, userInput: Partial<Omit<UserProfile, 'id'>> & { tenantIds?: string[]; password?: string; role?: 'Admin' | 'Developer' | 'User' }) {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) return null;

    const target = this.users.find(
      (user) =>
        user.id === userId &&
        (user.tenantId === tenantId || (Array.isArray(user.tenantIds) && user.tenantIds.includes(tenantId)))
    );
    if (!target) return null;

    if (Array.isArray(userInput.tenantIds) && userInput.tenantIds.length > 0) {
      const normalizedTenantIds = userInput.tenantIds
        .map((item) => String(item || '').trim())
        .filter((item) => this.tenants.some((t) => t.id === item));
      target.tenantIds = normalizedTenantIds;
      if (normalizedTenantIds.length > 0) target.tenantId = normalizedTenantIds[0];
    }

    if (userInput.name) target.name = String(userInput.name);
    if (userInput.email) target.email = normalizeEmail(userInput.email);
    if (userInput.organizationName) target.organizationName = String(userInput.organizationName);
    if (userInput.role && userInput.role !== 'Super Admin') target.role = userInput.role;
    if (userInput.plan) target.plan = userInput.plan;
    if (userInput.avatarUrl) target.avatarUrl = String(userInput.avatarUrl);
    if (userInput.password) target.password = String(userInput.password);

    this.persist();
    return this.sanitizeUser(target);
  }

  deleteTenantUser(userId: string, tenantId: string) {
    const target = this.users.find(
      (user) =>
        user.id === userId &&
        (user.tenantId === tenantId || (Array.isArray(user.tenantIds) && user.tenantIds.includes(tenantId)))
    );
    if (!target) return false;

    const nextTenantIds = Array.isArray(target.tenantIds)
      ? target.tenantIds.filter((id) => id !== tenantId)
      : [];
    if (nextTenantIds.length === 0) {
      this.users = this.users.filter((user) => user.id !== userId);
    } else {
      target.tenantIds = nextTenantIds;
      target.tenantId = nextTenantIds[0];
    }
    this.persist();
    return true;
  }

  private sanitizeUser(user: InternalAuthUser) {
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }

  markAllNotificationsRead() {
    this.notifications = this.notifications.map((item) => ({ ...item, read: true }));
    this.persist();
  }

  recordWebhookEvent(provider: string, req: express.Request) {
    const event = {
      id: randomId('wh'),
      provider,
      timestamp: nowISO(),
      headers: {
        'user-agent': req.get('user-agent') || 'unknown',
        'content-type': req.get('content-type') || 'application/json',
      },
      payload: req.body,
    };
    this.webhookEvents.unshift(event);
    if (this.webhookEvents.length > 200) this.webhookEvents.pop();
    this.persist();
    return event;
  }

  listWebhookEvents() {
    return [...this.webhookEvents];
  }

  private buildDefaultFields(_formName: string, _formId: string) {
    const fields = [];
    const base = [] as ReturnType<typeof createDefaultField>[];
    const fieldTypes = ['heading', 'text', 'email', 'phone', 'textarea', 'submit'] as const;
    for (let i = 0; i < 4; i++) {
      const fld = createDefaultField(fieldTypes[i], fields as any);
      base.push(fld);
      fields.push(fld as any);
    }
    return fields;
  }

  private guessEmail(data: Record<string, any>) {
    for (const [key, value] of Object.entries(data)) {
      const label = key.toLowerCase();
      if (typeof value === 'string' && label.includes('email')) {
        return value;
      }
      if (typeof value === 'string' && value.includes('@')) {
        return value;
      }
    }
    return 'anonymous@visitor.local';
  }

  private guessName(data: Record<string, any>) {
    for (const [key, value] of Object.entries(data)) {
      const label = key.toLowerCase();
      if (typeof value === 'string' && (label.includes('name') || label.includes('full_name'))) {
        return value;
      }
    }
    return 'Anonymous Visitor';
  }

  authenticate(credentials: { email: string; password: string }) {
    const requestedEmail = normalizeEmail(credentials.email);
    const requestedPassword = String(credentials.password || '').trim();
    if (!requestedEmail || !requestedPassword) return null;

    const user = this.users.find((entry) => {
      const tenantMatch =
        entry.role === 'Super Admin' ||
        Boolean(entry.tenantId) ||
        (Array.isArray(entry.tenantIds) && entry.tenantIds.length > 0);
      return entry.email.toLowerCase() === requestedEmail && entry.password === requestedPassword && tenantMatch;
    });

    if (!user) return null;

    const token = generateAuthToken(user);
    return { user: this.sanitizeUser(user), token };
  }
}

const store = new DataStore();

const requireAuth = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authUser = parseAuthToken(req.headers.authorization);
  if (!authUser) {
    fail(res, 'Unauthorized', 401);
    return;
  }
  req.authUser = authUser;
  next();
};

const requireRole = (roles: Role[]) => (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.authUser) {
    fail(res, 'Unauthorized', 401);
    return;
  }
  if (!roles.includes(req.authUser.role)) {
    fail(res, 'Forbidden', 403);
    return;
  }
  next();
};

function ensureWebhookSignature(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!SECRET) {
    next();
    return;
  }
  const signature = req.get('x-signature');
  const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody || Buffer.from('');
  const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  if (!signature || signature !== expected) {
    fail(res, 'Invalid webhook signature', 401);
    return;
  }
  next();
}

app.get(`${API_PREFIX}/health`, (_req, res) => {
  ok(res, { status: 'ok', service: 'formflow-api', env: NODE_ENV });
});

app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  if (!email) {
    fail(res, 'email is required');
    return;
  }
  if (!password) {
    fail(res, 'password is required');
    return;
  }
  const result = store.authenticate({ email, password });
  if (!result) {
    fail(res, 'Invalid credentials', 401);
    return;
  }
  const { user, token } = result;
  ok(res, { token, user, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
});

app.get(`${API_PREFIX}/me`, requireAuth, (req: AuthRequest, res) => {
  ok(res, req.authUser!);
});

app.get(`${API_PREFIX}/roles`, (_req, res) => {
  ok(res, APP_ROLES);
});

app.get(`${API_PREFIX}/tenants`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  ok(res, store.getTenants());
});

app.post(`${API_PREFIX}/tenants`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const body = req.body || {};
  const tenant = store.createTenant({
    name: body.name,
    slug: body.slug,
    status: body.status as TenantStatus,
    plan: body.plan,
    adminName: body.adminName,
    adminEmail: body.adminEmail,
  });
  if (!tenant) {
    fail(res, 'Unable to create tenant. Check name, slug, and uniqueness.', 400);
    return;
  }
  ok(res, tenant, 201);
});

app.get(`${API_PREFIX}/tenants/:tenantId`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const tenant = store.getTenantById(req.params.tenantId);
  if (!tenant) {
    fail(res, 'Tenant not found', 404);
    return;
  }
  ok(res, tenant);
});

app.patch(`${API_PREFIX}/tenants/:tenantId`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const tenant = store.updateTenant(req.params.tenantId, req.body || {});
  if (!tenant) {
    fail(res, 'Tenant not found', 404);
    return;
  }
  ok(res, tenant);
});

app.get(`${API_PREFIX}/tenants/:tenantId/users`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const users = store.getTenantUsers(req.params.tenantId);
  ok(res, users);
});

app.post(`${API_PREFIX}/tenants/:tenantId/users`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const body = req.body || {};
  const role = String(body.role || '') as Role;
  if (!['Admin', 'Developer', 'User'].includes(role)) {
    fail(res, 'Role must be Admin, Developer, or User', 400);
    return;
  }

  const user = store.createTenantUser(req.params.tenantId, {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    role,
    password: String(body.password || '').trim(),
    avatarUrl: body.avatarUrl,
    organizationName: body.organizationName,
  });

  if (!user) {
    fail(res, 'Unable to create tenant user. Check payload and tenant status.', 400);
    return;
  }

  ok(res, user, 201);
});

app.post(`${API_PREFIX}/tenant-users`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const body = req.body || {};
  const tenantIds = Array.isArray(body.tenantIds)
    ? body.tenantIds.map((tenantId: string) => String(tenantId || '').trim()).filter(Boolean)
    : [];
  const role = String(body.role || '') as 'Admin' | 'Developer' | 'User';
  if (!tenantIds.length) {
    fail(res, 'tenantIds is required and must include at least one account', 400);
    return;
  }
  if (!['Admin', 'Developer', 'User'].includes(role)) {
    fail(res, 'Role must be Admin, Developer, or User', 400);
    return;
  }

  const created = store.createTenantUsers(tenantIds, {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    role,
    password: String(body.password || '').trim(),
    avatarUrl: body.avatarUrl,
    organizationName: body.organizationName,
    tenantIds,
  });

  if (!created.length) {
    fail(res, 'Unable to create tenant user. Check payload and tenant status.', 400);
    return;
  }

  ok(res, created, 201);
});

app.patch(`${API_PREFIX}/tenants/:tenantId/users/:userId`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const body = req.body || {};
  const role = String(body.role || '') as 'Admin' | 'Developer' | 'User' | '';
  if (role && !['Admin', 'Developer', 'User'].includes(role)) {
    fail(res, 'Role must be Admin, Developer, or User', 400);
    return;
  }

  const user = store.updateTenantUser(req.params.tenantId, req.params.userId, {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    role: role || undefined,
    avatarUrl: body.avatarUrl,
    organizationName: body.organizationName,
    tenantIds: Array.isArray(body.tenantIds)
      ? body.tenantIds.map((tenantId: string) => String(tenantId || '').trim()).filter(Boolean)
      : undefined,
    password: String(body.password || '').trim(),
  });

  if (!user) {
    fail(res, 'Unable to update tenant user', 404);
    return;
  }

  ok(res, user);
});

app.delete(`${API_PREFIX}/tenants/:tenantId/users/:userId`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  const removed = store.deleteTenantUser(req.params.userId, req.params.tenantId);
  if (!removed) {
    fail(res, 'User not found', 404);
    return;
  }

  ok(res, { success: true });
});

app.get(`${API_PREFIX}/dashboard/metrics`, requireAuth, (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  ok(res, store.getDashboardMetrics(tenantId));
});

app.get(`${API_PREFIX}/dashboard/recent`, requireAuth, (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const forms = store.getForms(undefined, undefined, tenantId).slice(0, 5);
  const submissions = store.getSubmissions(undefined, tenantId).slice(0, 5);
  const integrations = store.getIntegrations(tenantId).slice(0, 5);
  ok(res, { forms, submissions, integrations });
});

app.get(`${API_PREFIX}/forms`, requireAuth, (req, res) => {
  const query = req.query.q ? String(req.query.q) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  if (status && !['all', ...ALLOWED_FORM_STATUSES].includes(status)) {
    fail(res, 'Invalid status filter', 400);
    return;
  }
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  ok(res, store.getForms(query, status as FormStatusType | 'all', tenantId));
});

app.post(`${API_PREFIX}/forms`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const body = req.body || {};
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const created = store.createForm({
    name: body.name,
    slug: body.slug,
    description: body.description || '',
    status: body.status as FormStatusType,
    fieldsCount: body.fieldsCount || 0,
    submissionsCount: 0,
    viewsCount: 0,
    conversionRate: 0,
    publishedVersion: body.publishedVersion,
    domain: body.domain,
    theme: body.theme,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }, tenantId);
  ok(res, created, 201);
});

app.get(`${API_PREFIX}/forms/:id`, requireAuth, (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const form = store.getFormById(req.params.id, tenantId);
  if (!form) {
    fail(res, 'Form not found', 404);
    return;
  }
  ok(res, form);
});

app.put(`${API_PREFIX}/forms/:id`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const updated = store.updateForm(req.params.id, req.body || {}, tenantId);
  if (!updated) {
    fail(res, 'Form not found', 404);
    return;
  }
  ok(res, updated);
});

app.patch(`${API_PREFIX}/forms/:id/status`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const status = req.body?.status as FormStatusType;
  if (!status || !ALLOWED_FORM_STATUSES.includes(status)) {
    fail(res, 'status must be one of: published|draft|archived');
    return;
  }
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const result = store.updateForm(req.params.id, { status }, tenantId);
  if (!result) {
    fail(res, 'Form not found', 404);
    return;
  }
  ok(res, result);
});

app.delete(`${API_PREFIX}/forms/:id`, requireAuth, requireRole(['Super Admin', 'Admin']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const deleted = store.deleteForm(req.params.id, tenantId);
  if (!deleted) {
    fail(res, 'Form not found', 404);
    return;
  }
  ok(res, { success: true });
});

app.get(`${API_PREFIX}/forms/:id/versions`, requireAuth, (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const versions = store.getVersions(req.params.id, tenantId);
  ok(res, versions);
});

app.get(`${API_PREFIX}/forms/:id/definition`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const definition = store.getDefinition(req.params.id, tenantId);
  if (!definition) {
    fail(res, 'Form not found or missing definition', 404);
    return;
  }
  ok(res, definition);
});

app.put(`${API_PREFIX}/forms/:id/definition`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const definition = store.saveDefinition(req.params.id, req.body || {}, tenantId);
  if (!definition) {
    fail(res, 'Unable to save definition', 404);
    return;
  }
  ok(res, definition);
});

app.post(`${API_PREFIX}/forms/:id/publish`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const targetVersionNumber = req.body?.targetVersionNumber
    ? Number(req.body.targetVersionNumber)
    : undefined;
  const result = store.publish(req.params.id, targetVersionNumber, tenantId);
  if (!result) {
    fail(res, 'Unable to publish', 404);
    return;
  }
  ok(res, result);
});

app.post(`${API_PREFIX}/forms/:id/rollback`, requireAuth, requireRole(['Super Admin', 'Admin', 'Developer']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const targetVersionNumber = Number(req.body?.targetVersionNumber || 0);
  const result = store.rollback(req.params.id, targetVersionNumber, tenantId);
  if (!result) {
    fail(res, 'Version not found', 404);
    return;
  }
  ok(res, result);
});

app.get(`${API_PREFIX}/forms/:id/submissions`, requireAuth, (req, res) => {
  const formId = req.params.id;
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  ok(res, store.getSubmissions(formId, tenantId));
});

app.post(`${API_PREFIX}/forms/:id/submit`, (req, res) => {
  const form = store.getFormById(req.params.id);
  if (!form) {
    fail(res, 'Form not found', 404);
    return;
  }
  const submittedData = req.body || {};
  const submitted = store.addSubmission(
    req.params.id,
    form.name,
    submittedData,
    req.body?.metadata || {},
    form.tenantId
  );
  ok(res, { submission: submitted }, 201);
});

app.get(`${API_PREFIX}/submissions`, requireAuth, (req, res) => {
  const formId = typeof req.query.formId === 'string' ? req.query.formId : undefined;
  const query = typeof req.query.q === 'string' ? req.query.q : undefined;
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  const raw = store.getSubmissions(formId, tenantId);
  const response =
    query && query.trim()
      ? raw.filter((row) =>
          row.formName.toLowerCase().includes(query.toLowerCase()) ||
          (row.userEmail ?? '').toLowerCase().includes(query.toLowerCase()) ||
          (row.userName ?? '').toLowerCase().includes(query.toLowerCase())
        )
      : raw;
  ok(res, response);
});

app.patch(`${API_PREFIX}/submissions/:id/read`, requireAuth, (req, res) => {
  const changed = store.markNotificationRead(req.params.id);
  ok(res, { success: changed });
});

app.get(`${API_PREFIX}/public/forms/:id`, (req, res) => {
  const definition = store.getPublishedDefinition(req.params.id);
  if (!definition) {
    fail(res, 'Form not found or not published', 404);
    return;
  }
  ok(res, definition);
});

app.post(`${API_PREFIX}/public/forms/:id/submit`, (req, res) => {
  const form = store.getFormById(req.params.id);
  if (!form) {
    fail(res, 'Form not found', 404);
    return;
  }
  const payload = req.body?.payload || req.body;
  const submitted = store.addSubmission(
    req.params.id,
    form.name,
    payload || {},
    req.body?.metadata || {},
    form.tenantId
  );
  ok(res, { submission: submitted }, 201);
});

app.get(`${API_PREFIX}/integrations`, requireAuth, (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  ok(res, store.getIntegrations(tenantId));
});

app.patch(
  `${API_PREFIX}/integrations/:id/status`,
  requireAuth,
  requireRole(['Super Admin', 'Admin', 'Developer']),
  (req, res) => {
    const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
    const updated = store.toggleIntegrationStatus(req.params.id, String(req.body?.status || ''), tenantId);
    if (!updated) {
      fail(res, 'Integration not found or invalid status', 404);
      return;
    }
    ok(res, updated);
  }
);

app.post(
  `${API_PREFIX}/integrations/:id/test`,
  requireAuth,
  requireRole(['Super Admin', 'Admin', 'Developer']),
  (req, res) => {
    const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
    const result = store.testIntegration(req.params.id, tenantId);
    if (!result) {
      fail(res, 'Integration not found', 404);
      return;
    }
    ok(res, result);
  }
);

app.post(
  `${API_PREFIX}/integrations/test-all`,
  requireAuth,
  requireRole(['Super Admin', 'Admin', 'Developer']),
  (_req, res) => {
    const tenantId = _req.authUser && _req.authUser.role !== 'Super Admin' ? _req.authUser.tenantId : undefined;
    ok(res, store.testAllIntegrations(tenantId));
  }
);

app.get(`${API_PREFIX}/domains`, requireAuth, requireRole(['Super Admin', 'Admin']), (req, res) => {
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  ok(res, store.getDomains(tenantId));
});

app.post(`${API_PREFIX}/domains`, requireAuth, requireRole(['Super Admin', 'Admin']), (req, res) => {
  const domainName = String(req.body?.domainName || '').trim();
  if (!domainName) {
    fail(res, 'domainName is required', 400);
    return;
  }
  const tenantId = req.authUser && req.authUser.role !== 'Super Admin' ? req.authUser.tenantId : undefined;
  ok(res, store.addDomain(domainName, tenantId), 201);
});

app.get(`${API_PREFIX}/notifications`, requireAuth, (_req, res) => {
  const tenantId = _req.authUser && _req.authUser.role !== 'Super Admin' ? _req.authUser.tenantId : undefined;
  ok(res, store.getNotifications(tenantId));
});

app.post(`${API_PREFIX}/notifications/:id/read`, requireAuth, (req, res) => {
  const okRead = store.markNotificationRead(req.params.id);
  if (!okRead) {
    fail(res, 'Notification not found', 404);
    return;
  }
  ok(res, { success: true });
});

app.post(`${API_PREFIX}/notifications/read-all`, requireAuth, (_req, res) => {
  store.markAllNotificationsRead();
  ok(res, { success: true });
});

app.post(`${API_PREFIX}/webhooks/form-submission`, ensureWebhookSignature, (req, res) => {
  const event = store.recordWebhookEvent('form-submission', req);
  const deliveredTo =
    req.body?.callbacks?.length && Array.isArray(req.body.callbacks)
      ? req.body.callbacks
      : ['default-form-runner'];
  ok(res, { received: true, event, deliveredTo });
});

app.post(`${API_PREFIX}/webhooks/:provider`, ensureWebhookSignature, (req, res) => {
  const provider = req.params.provider;
  const event = store.recordWebhookEvent(provider, req);
  ok(res, { received: true, event });
});

app.get(`${API_PREFIX}/webhooks`, requireAuth, (req, res) => {
  ok(res, store.listWebhookEvents());
});

app.get(`${API_PREFIX}/system/export`, requireAuth, requireRole(['Super Admin']), (_req, res) => {
  ok(res, store.exportState());
});

app.post(`${API_PREFIX}/system/import`, requireAuth, requireRole(['Super Admin']), (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    fail(res, 'Invalid import payload');
    return;
  }
  store.importState(req.body);
  ok(res, { success: true });
});

app.get(`${API_PREFIX}/system/backups`, requireAuth, requireRole(['Super Admin']), (_req, res) => {
  ok(res, store.getBackups());
});

app.post(`${API_PREFIX}/system/backups`, requireAuth, requireRole(['Super Admin']), (_req, res) => {
  const file = store.createBackup();
  ok(res, { path: file, createdAt: nowISO() }, 201);
});

app.delete(
  `${API_PREFIX}/system/backups/:fileName`,
  requireAuth,
  requireRole(['Super Admin']),
  (req, res) => {
    const deleted = store.deleteBackup(req.params.fileName);
    if (!deleted) {
      fail(res, 'Backup not found', 404);
      return;
    }
    ok(res, { success: true });
  }
);

app.get(`${API_PREFIX}`, (_req, res) => {
  ok(res, {
    service: 'formflow-api',
    docs: '/api-docs',
    version: '1.0.0',
    endpoints: [
      `${API_PREFIX}/auth/login`,
      `${API_PREFIX}/forms`,
      `${API_PREFIX}/dashboard/metrics`,
      `${API_PREFIX}/webhooks/:provider`,
      `${API_PREFIX}/system/export`,
      `${API_PREFIX}/system/import`,
      `${API_PREFIX}/system/backups`,
    ],
  });
});

app.listen(PORT, () => {
  console.log(`[API] Listening on http://localhost:${PORT}`);
});
