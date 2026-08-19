import { getApiBaseCandidates } from '../config/apiBase';
import {
  ActionExecutionStatus,
  DashboardMetrics,
  Form,
  FormDefinition,
  FormField,
  FormStatus,
  FormSubmission,
  FormVersion,
  Integration,
  IntegrationStatus,
  NotificationItem,
  UserProfile,
  Domain,
  FieldType,
} from '../types';
import { createDefaultField } from '../utils/formBuilderUtils';

const STORAGE_TOKEN_KEY = 'formflow_auth_token';

const API_BASES = getApiBaseCandidates();

const STORAGE_KEY_SUBMISSION_ACTIONS = 'formflow_submission_actions_v1';

interface ApiError {
  ok: false;
  error: string;
}

interface ApiOk<T> {
  ok: true;
  data: T;
}

type ApiResponse<T> = ApiOk<T> | ApiError | null;

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | undefined>;
}

type QueryValue = string | number | undefined;

const getCachedToken = () =>
  typeof window === 'undefined' ? '' : window.localStorage.getItem(STORAGE_TOKEN_KEY) || '';

class FormFlowDataStore {
  private actionExecutionStatuses = new Map<string, ActionExecutionStatus[]>();

  private normalizePath(path: string) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  private normalizeQuery(params: Record<string, QueryValue> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value).trim() === '') return;
      query.set(key, String(value));
    });
    return query.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const token = getCachedToken();
    const { query = {}, ...fetchOptions } = options;
    const normalizedPath = this.normalizePath(path);
    const queryString = this.normalizeQuery(query);
    const queryPart = queryString ? `?${queryString}` : '';
    const headers = new Headers(fetchOptions.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let lastError: Error | null = null;
    const endpointSuffix = `${normalizedPath}${queryPart}`;

    for (const base of API_BASES) {
      const endpoint = `${base}${endpointSuffix}`;
      try {
        const response = await fetch(endpoint, {
          ...fetchOptions,
          headers,
        });
        const raw = (await response.json().catch(() => null)) as ApiResponse<T>;

        if (!response.ok) {
          if (response.status === 404) {
            lastError = new Error(`API endpoint not available at ${endpoint}`);
            continue;
          }
          const message = (raw && raw.ok === false ? raw.error : `Request failed (${response.status}) at ${endpoint}`);
          throw new Error(message);
        }

        if (!raw || raw.ok !== true) {
          const message = (raw && raw.ok === false ? raw.error : `Request failed (${response.status}) at ${endpoint}`);
          throw new Error(message);
        }

        return raw.data;
      } catch (error) {
        if (error instanceof TypeError) {
          lastError = error;
          continue;
        }
        if (error instanceof Error && error.message.startsWith('API endpoint not available at')) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('All API endpoints are unavailable');
  }

  private getPersistedSubmissionActions(): Map<string, ActionExecutionStatus[]> {
    if (typeof window === 'undefined') return new Map();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_SUBMISSION_ACTIONS);
      if (!raw) return new Map();
      const parsed = JSON.parse(raw) as Array<[string, ActionExecutionStatus[]]>;
      return new Map(
        Array.isArray(parsed)
          ? parsed.filter((entry) => Array.isArray(entry) && entry.length === 2)
          : []
      );
    } catch {
      return new Map();
    }
  }

  private persistSubmissionActions() {
    if (typeof window === 'undefined') return;
    const snapshot = Array.from(this.actionExecutionStatuses.entries());
    window.localStorage.setItem(STORAGE_KEY_SUBMISSION_ACTIONS, JSON.stringify(snapshot));
  }

  private applyCachedActionExecution(submission: FormSubmission): FormSubmission {
    const cached = this.actionExecutionStatuses.get(submission.id);
    if (!cached) return submission;
    return {
      ...submission,
      actionExecutionStatus: cached,
    };
  }

  private buildFallbackDefinition(form: Form, status: FormStatus = 'draft'): FormDefinition {
    const fields = this.createFallbackFields();
    const fieldNames = new Set<string>();
    for (const field of fields) {
      field.name = field.name || `${field.type}-${fields.indexOf(field) + 1}`;
      if (field.name && fieldNames.has(field.name)) {
        field.name = `${field.name}_${fields.indexOf(field) + 1}`;
      }
      if (field.name) fieldNames.add(field.name);
    }

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      status,
      version: 1,
      publishedVersion: status === 'published' ? 1 : undefined,
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
  }

  private createFallbackFields() {
    const fields: FormField[] = [];
    const ordered: FieldType[] = ['heading', 'text', 'email', 'textarea', 'submit'];
    for (const type of ordered) {
      fields.push(createDefaultField(type, fields));
    }
    return fields;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/dashboard/metrics');
  }

  async getForms(query?: string, status?: FormStatus | 'all'): Promise<Form[]> {
    return this.request<Form[]>('/forms', {
      query: {
        q: query,
        status: status || 'all',
      },
    });
  }

  async getFormById(id: string): Promise<Form | undefined> {
    try {
      return await this.request<Form>(`/forms/${id}`);
    } catch {
      return undefined;
    }
  }

  async getFormVersions(formId: string): Promise<FormVersion[]> {
    return this.request<FormVersion[]>(`/forms/${formId}/versions`);
  }

  async getPublishedFormDefinition(formId: string): Promise<FormDefinition | null> {
    try {
      return await this.request<FormDefinition>(`/public/forms/${formId}`);
    } catch {
      return null;
    }
  }

  async getFormDefinition(id: string): Promise<FormDefinition> {
    try {
      const definition = await this.request<FormDefinition>(`/forms/${id}/definition`);
      return definition;
    } catch {
      const form = await this.getFormById(id);
      if (!form) {
        return this.request<FormDefinition>(`/forms/${id}/definition`);
      }
      const status = form.status === 'published' ? 'published' : 'draft';
      return this.buildFallbackDefinition(form, status);
    }
  }

  async saveFormDefinition(id: string, definition: FormDefinition): Promise<FormDefinition> {
    return this.request<FormDefinition>(`/forms/${id}/definition`, {
      method: 'PUT',
      body: JSON.stringify(definition),
    });
  }

  async publishFormVersion(formId: string, targetVersionNumber?: number): Promise<{ publishedVersion: FormVersion; formDef: FormDefinition }> {
    return this.request<{ publishedVersion: FormVersion; formDef: FormDefinition }>(`/forms/${formId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ targetVersionNumber }),
    });
  }

  async rollbackToVersion(formId: string, targetVersionNumber: number): Promise<FormVersion> {
    return this.request<FormVersion>(`/forms/${formId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetVersionNumber }),
    });
  }

  async createForm(
    newForm: Omit<Form, 'id' | 'createdAt' | 'updatedAt' | 'submissionsCount' | 'viewsCount' | 'conversionRate'>
  ): Promise<Form> {
    const payload = {
      ...newForm,
      publishedVersion: newForm.publishedVersion,
      fieldsCount: newForm.fieldsCount ?? 1,
      submissionsCount: 0,
      viewsCount: 0,
      conversionRate: 0,
    };
    return this.request<Form>('/forms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateFormStatus(id: string, status: FormStatus): Promise<Form> {
    return this.request<Form>(`/forms/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteForm(id: string): Promise<boolean> {
    const result = await this.request<{ success: true }>(`/forms/${id}`, { method: 'DELETE' });
    return result?.success === true;
  }

  async getSubmissions(formId?: string, query?: string): Promise<FormSubmission[]> {
    const submissions = await this.request<FormSubmission[]>('/submissions', {
      query: {
        formId,
        q: query,
      },
    });

    return submissions.map((submission) => this.applyCachedActionExecution(submission));
  }

  async updateSubmissionActionStatus(submissionId: string, actionStatuses: ActionExecutionStatus[]): Promise<FormSubmission> {
    this.actionExecutionStatuses.set(submissionId, actionStatuses);
    this.persistSubmissionActions();
    const all = await this.getSubmissions();
    const target = all.find((submission) => submission.id === submissionId);
    if (!target) {
      throw new Error(`Submission with id ${submissionId} not found.`);
    }
    return {
      ...target,
      actionExecutionStatus: actionStatuses,
    };
  }

  async submitPublicFormResponse(params: {
    formId: string;
    formName: string;
    submittedData: Record<string, any>;
    metadata?: {
      formVersion?: number | string;
      referrer?: string;
      sourceUrl?: string;
      utmParameters?: {
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_term?: string;
        utm_content?: string;
      };
    };
  }): Promise<FormSubmission> {
    const body = {
      formId: params.formId,
      formName: params.formName,
      submittedData: params.submittedData,
      metadata: {
        formVersion: params.metadata?.formVersion || 1,
        referrer: params.metadata?.referrer || '',
        sourceUrl: params.metadata?.sourceUrl || '',
        utmParameters: params.metadata?.utmParameters || {},
      },
    };

    const result = await this.request<{ submission: FormSubmission }>(`/public/forms/${params.formId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return result.submission;
  }

  async getIntegrations(): Promise<Integration[]> {
    return this.request<Integration[]>('/integrations');
  }

  async toggleIntegrationStatus(id: string, status: IntegrationStatus): Promise<Integration> {
    return this.request<Integration>(`/integrations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getDomains(): Promise<Domain[]> {
    return this.request<Domain[]>('/domains');
  }

  async addDomain(domainName: string): Promise<Domain> {
    return this.request<Domain>('/domains', {
      method: 'POST',
      body: JSON.stringify({ domainName }),
    });
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/me');
  }

  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request<{ success: true }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request<{ success: true }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  async recordFormView(formId: string): Promise<void> {
    // Back-end currently tracks views through interactions with forms and submissions.
    void formId;
    return Promise.resolve();
  }

  constructor() {
    this.actionExecutionStatuses = this.getPersistedSubmissionActions();
  }
}

export const apiService = new FormFlowDataStore();



