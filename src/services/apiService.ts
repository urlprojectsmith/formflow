import {
  Form,
  FormSubmission,
  Integration,
  Domain,
  DashboardMetrics,
  UserProfile,
  NotificationItem,
  FormStatus,
  IntegrationStatus,
  FormDefinition,
  FormVersion,
  FormField,
  FieldType,
  ActionExecutionStatus,
} from '../types';
import { createDefaultField } from '../utils/formBuilderUtils';
import {
  initialForms,
  initialSubmissions,
  initialIntegrations,
  initialDomains,
  initialUserProfile,
  initialNotifications,
} from './mockData';

// Local storage keys or in-memory mutable cache for prototype responsiveness
class FormFlowDataStore {
  private forms: Form[] = [...initialForms];
  private submissions: FormSubmission[] = [...initialSubmissions];
  private integrations: Integration[] = [...initialIntegrations];
  private domains: Domain[] = [...initialDomains];
  private user: UserProfile = { ...initialUserProfile };
  private notifications: NotificationItem[] = [...initialNotifications];
  private formDefinitions: Map<string, FormDefinition> = new Map();
  private formVersions: Map<string, FormVersion[]> = new Map();

  // Helper delay simulation
  private async delay(ms = 120): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper to ensure version list exists for a form
  private ensureFormVersionsInitialized(id: string): FormVersion[] {
    if (this.formVersions.has(id)) {
      return this.formVersions.get(id)!;
    }

    const form = this.forms.find((f) => f.id === id);
    const formName = form ? form.name : id === 'stress-50' ? 'Enterprise 50-Field Survey' : 'New Intake Form';
    const isPublished = form ? form.status === 'published' : false;

    let initialFields: FormField[] = [];

    if (id === 'stress-50' || formName.toLowerCase().includes('stress')) {
      const fieldTypes: FieldType[] = [
        'heading', 'text', 'email', 'phone', 'number', 'textarea',
        'select', 'multiselect', 'radio', 'checkbox', 'date', 'time',
        'file', 'hidden', 'paragraph', 'divider', 'image', 'html'
      ];
      for (let i = 0; i < 50; i++) {
        const type = fieldTypes[i % fieldTypes.length];
        const newFld = createDefaultField(type, initialFields);
        newFld.label = `${newFld.label} #${i + 1}`;
        initialFields.push(newFld);
      }
      initialFields.push(createDefaultField('submit', initialFields));
    } else {
      const f1 = createDefaultField('heading', initialFields);
      initialFields.push(f1);
      const f2 = createDefaultField('text', initialFields);
      initialFields.push(f2);
      const f3 = createDefaultField('email', initialFields);
      initialFields.push(f3);
      if (formName.toLowerCase().includes('lead')) {
        const fPhone = createDefaultField('phone', initialFields);
        initialFields.push(fPhone);
        const fSelect = createDefaultField('select', initialFields);
        initialFields.push(fSelect);
      }
      const f4 = createDefaultField('textarea', initialFields);
      initialFields.push(f4);
      const f5 = createDefaultField('submit', initialFields);
      initialFields.push(f5);
    }

    const baseDef: FormDefinition = {
      id,
      name: formName,
      description: form ? form.description : 'Standard form definition',
      status: isPublished ? 'published' : 'draft',
      version: 1,
      publishedVersion: isPublished ? 1 : undefined,
      fields: initialFields,
      settings: {
        submitButtonText: 'Submit Response',
        successMessage: 'Thank you! Your submission has been recorded.',
      },
      theme: {
        primaryColor: '#2563eb',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
      },
      createdAt: form ? form.createdAt : new Date().toISOString(),
      updatedAt: form ? form.updatedAt : new Date().toISOString(),
    };

    const v1: FormVersion = {
      id: `ver_${id}_v1`,
      formId: id,
      versionNumber: 1,
      status: isPublished ? 'published' : 'draft',
      definition: JSON.parse(JSON.stringify(baseDef)),
      createdAt: form ? form.createdAt : new Date().toISOString(),
      createdBy: 'Admin User',
      publishedAt: isPublished ? (form ? form.createdAt : new Date().toISOString()) : undefined,
      notes: 'Initial version',
    };

    if (form && isPublished) {
      form.publishedVersion = 1;
    }

    const versions = [v1];
    this.formVersions.set(id, versions);
    this.formDefinitions.set(id, JSON.parse(JSON.stringify(baseDef)));
    return versions;
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await this.delay();
    const totalForms = this.forms.length;
    const publishedForms = this.forms.filter((f) => f.status === 'published').length;
    const draftForms = this.forms.filter((f) => f.status === 'draft').length;
    const totalSubmissions = this.forms.reduce((acc, f) => acc + f.submissionsCount, 0);
    const totalViews = this.forms.reduce((acc, f) => acc + f.viewsCount, 0);
    const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;

    return {
      totalForms,
      publishedForms,
      draftForms,
      totalSubmissions,
      conversionRate: Math.round(conversionRate * 10) / 10,
      formsChangePct: 12.5,
      submissionsChangePct: 18.2,
      conversionChangePct: 3.4,
    };
  }

  // Forms
  async getForms(query?: string, status?: FormStatus | 'all'): Promise<Form[]> {
    await this.delay();
    let result = [...this.forms];

    if (status && status !== 'all') {
      result = result.filter((f) => f.status === status);
    }

    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.slug.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getFormById(id: string): Promise<Form | undefined> {
    await this.delay();
    return this.forms.find((f) => f.id === id);
  }

  // Form Versions
  async getFormVersions(formId: string): Promise<FormVersion[]> {
    await this.delay(80);
    const versions = this.ensureFormVersionsInitialized(formId);
    return JSON.parse(JSON.stringify(versions)).sort(
      (a: FormVersion, b: FormVersion) => b.versionNumber - a.versionNumber
    );
  }

  // Get currently published form definition (for public standalone form)
  async getPublishedFormDefinition(formId: string): Promise<FormDefinition | null> {
    await this.delay(100);
    const versions = this.ensureFormVersionsInitialized(formId);
    const pubVersion = versions.find((v) => v.status === 'published');
    if (!pubVersion) return null;

    const def = JSON.parse(JSON.stringify(pubVersion.definition));
    def.publishedVersion = pubVersion.versionNumber;
    def.version = pubVersion.versionNumber;
    def.status = 'published';
    return def;
  }

  // Get active working draft definition (for builder editing)
  async getFormDefinition(id: string): Promise<FormDefinition> {
    await this.delay();
    const versions = this.ensureFormVersionsInitialized(id);
    const form = this.forms.find((f) => f.id === id);
    const currentPublishedNumber = form?.publishedVersion;

    // Look for existing draft
    let draftVersion = versions.find((v) => v.status === 'draft');

    // If no draft exists (e.g. latest version is published), spawn a new draft version for builder editing
    if (!draftVersion) {
      const maxVersionNum = Math.max(...versions.map((v) => v.versionNumber), 0);
      const newVersionNum = maxVersionNum + 1;
      const latestPubOrAny = versions.find((v) => v.status === 'published') || versions[0];

      const clonedDef: FormDefinition = JSON.parse(JSON.stringify(latestPubOrAny.definition));
      clonedDef.version = newVersionNum;
      clonedDef.publishedVersion = currentPublishedNumber;
      clonedDef.status = 'draft';

      draftVersion = {
        id: `ver_${id}_v${newVersionNum}`,
        formId: id,
        versionNumber: newVersionNum,
        status: 'draft',
        definition: clonedDef,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User',
        notes: `Draft working copy based on Version ${latestPubOrAny.versionNumber}`,
      };

      versions.push(draftVersion);
    }

    const def = JSON.parse(JSON.stringify(draftVersion.definition));
    def.publishedVersion = currentPublishedNumber;
    return def;
  }

  // Save active draft definition
  async saveFormDefinition(id: string, definition: FormDefinition): Promise<FormDefinition> {
    await this.delay(150);
    const versions = this.ensureFormVersionsInitialized(id);
    const form = this.forms.find((f) => f.id === id);

    let draftVersion = versions.find((v) => v.status === 'draft');

    if (!draftVersion) {
      const maxVersionNum = Math.max(...versions.map((v) => v.versionNumber), 0);
      const newVersionNum = maxVersionNum + 1;
      draftVersion = {
        id: `ver_${id}_v${newVersionNum}`,
        formId: id,
        versionNumber: newVersionNum,
        status: 'draft',
        definition: JSON.parse(JSON.stringify(definition)),
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User',
        notes: 'New draft version',
      };
      versions.push(draftVersion);
    } else {
      draftVersion.definition = JSON.parse(JSON.stringify(definition));
      draftVersion.definition.version = draftVersion.versionNumber;
      draftVersion.definition.status = 'draft';
    }

    this.formDefinitions.set(id, JSON.parse(JSON.stringify(draftVersion.definition)));

    if (form) {
      form.name = definition.name;
      form.description = definition.description || form.description;
      form.fieldsCount = definition.fields.length;
      form.updatedAt = new Date().toISOString();
    }

    return JSON.parse(JSON.stringify(draftVersion.definition));
  }

  // Publish a version (creates immutable published version, archives previous)
  async publishFormVersion(
    formId: string,
    targetVersionNumber?: number
  ): Promise<{ publishedVersion: FormVersion; formDef: FormDefinition }> {
    await this.delay(200);
    const versions = this.ensureFormVersionsInitialized(formId);
    const form = this.forms.find((f) => f.id === formId);

    let targetVersion: FormVersion | undefined;
    if (targetVersionNumber) {
      targetVersion = versions.find((v) => v.versionNumber === targetVersionNumber);
    } else {
      // Find current draft version or latest version
      targetVersion = versions.find((v) => v.status === 'draft') || versions[versions.length - 1];
    }

    if (!targetVersion) {
      throw new Error('Target version to publish was not found.');
    }

    // Archive all previous published versions
    versions.forEach((v) => {
      if (v.status === 'published') {
        v.status = 'archived';
        v.definition.status = 'archived';
      }
    });

    // Mark target version as published
    targetVersion.status = 'published';
    targetVersion.publishedAt = new Date().toISOString();
    targetVersion.definition.status = 'published';
    targetVersion.definition.publishedVersion = targetVersion.versionNumber;
    targetVersion.definition.version = targetVersion.versionNumber;

    if (form) {
      form.status = 'published';
      form.publishedVersion = targetVersion.versionNumber;
      form.updatedAt = new Date().toISOString();
      form.fieldsCount = targetVersion.definition.fields.length;
    }

    this.formDefinitions.set(formId, JSON.parse(JSON.stringify(targetVersion.definition)));

    return {
      publishedVersion: JSON.parse(JSON.stringify(targetVersion)),
      formDef: JSON.parse(JSON.stringify(targetVersion.definition)),
    };
  }

  // Rollback to an older version (copies old version -> creates new version -> publishes new version)
  async rollbackToVersion(formId: string, targetVersionNumber: number): Promise<FormVersion> {
    await this.delay(250);
    const versions = this.ensureFormVersionsInitialized(formId);
    const target = versions.find((v) => v.versionNumber === targetVersionNumber);

    if (!target) {
      throw new Error(`Version ${targetVersionNumber} not found.`);
    }

    const maxVersionNum = Math.max(...versions.map((v) => v.versionNumber), 0);
    const newVersionNum = maxVersionNum + 1;

    // Archive previous published versions
    versions.forEach((v) => {
      if (v.status === 'published') {
        v.status = 'archived';
        v.definition.status = 'archived';
      }
    });

    const clonedDef: FormDefinition = JSON.parse(JSON.stringify(target.definition));
    clonedDef.version = newVersionNum;
    clonedDef.publishedVersion = newVersionNum;
    clonedDef.status = 'published';

    const newPublishedVersion: FormVersion = {
      id: `ver_${formId}_v${newVersionNum}`,
      formId,
      versionNumber: newVersionNum,
      status: 'published',
      definition: clonedDef,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
      publishedAt: new Date().toISOString(),
      notes: `Rolled back from Version ${targetVersionNumber}`,
    };

    versions.push(newPublishedVersion);

    const form = this.forms.find((f) => f.id === formId);
    if (form) {
      form.status = 'published';
      form.publishedVersion = newVersionNum;
      form.updatedAt = new Date().toISOString();
      form.fieldsCount = clonedDef.fields.length;
    }

    this.formDefinitions.set(formId, JSON.parse(JSON.stringify(clonedDef)));

    return JSON.parse(JSON.stringify(newPublishedVersion));
  }

  async createForm(newForm: Omit<Form, 'id' | 'createdAt' | 'updatedAt' | 'submissionsCount' | 'viewsCount' | 'conversionRate'>): Promise<Form> {
    await this.delay(200);
    const created: Form = {
      ...newForm,
      id: `form_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionsCount: 0,
      viewsCount: 0,
      conversionRate: 0.0,
    };
    this.forms.unshift(created);
    return created;
  }

  async updateFormStatus(id: string, status: FormStatus): Promise<Form> {
    await this.delay();
    const index = this.forms.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Form not found');
    this.forms[index] = {
      ...this.forms[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    return this.forms[index];
  }

  async deleteForm(id: string): Promise<boolean> {
    await this.delay();
    const initialLen = this.forms.length;
    this.forms = this.forms.filter((f) => f.id !== id);
    return this.forms.length < initialLen;
  }

  async recordFormView(formId: string): Promise<void> {
    const form = this.forms.find((f) => f.id === formId);
    if (form) {
      form.viewsCount = (form.viewsCount || 0) + 1;
      form.conversionRate =
        form.viewsCount > 0
          ? Math.round(((form.submissionsCount || 0) / form.viewsCount) * 1000) / 10
          : 0;
    }
  }

  // Submissions
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
    await this.delay(250);

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Extract potential email and name from submittedData
    let userEmail: string | undefined;
    let userName: string | undefined;

    Object.entries(params.submittedData).forEach(([key, val]) => {
      if (typeof val === 'string') {
        const lowerKey = key.toLowerCase();
        if (!userEmail && (lowerKey.includes('email') || val.includes('@'))) {
          userEmail = val;
        }
        if (!userName && (lowerKey.includes('name') || lowerKey.includes('full_name'))) {
          userName = val;
        }
      }
    });

    const submission: FormSubmission = {
      id: submissionId,
      formId: params.formId,
      formVersionId: params.metadata?.formVersion || 1,
      formName: params.formName,
      submittedAt: new Date().toISOString(),
      status: 'new',
      userEmail: userEmail || 'anonymous@visitor.com',
      userName: userName || 'Anonymous Visitor',
      fields: params.submittedData,
      data: params.submittedData,
      userLocation: 'United States',
      ipAddress: '192.168.1.1',
      metadata: {
        formId: params.formId,
        formVersion: params.metadata?.formVersion || 1,
        submissionId: submissionId,
        referrer: params.metadata?.referrer || '',
        sourceUrl: params.metadata?.sourceUrl || '',
        utmParameters: params.metadata?.utmParameters || {},
        visitorId: `vis_${submissionId}`,
        sessionId: `sess_${submissionId}`,
      },
    };

    this.submissions.unshift(submission);

    // Update form stats
    const form = this.forms.find((f) => f.id === params.formId);
    if (form) {
      form.submissionsCount = (form.submissionsCount || 0) + 1;
      form.viewsCount = Math.max(form.viewsCount || 1, form.submissionsCount);
      form.conversionRate =
        form.viewsCount > 0
          ? Math.round((form.submissionsCount / form.viewsCount) * 1000) / 10
          : 100;
      form.updatedAt = new Date().toISOString();
    }

    return submission;
  }

  async getSubmissions(formId?: string, query?: string): Promise<FormSubmission[]> {
    await this.delay();
    let result = [...this.submissions];

    if (formId) {
      result = result.filter((s) => s.formId === formId);
    }

    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.formName.toLowerCase().includes(q) ||
          (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
          (s.userName && s.userName.toLowerCase().includes(q)) ||
          JSON.stringify(s.data).toLowerCase().includes(q)
      );
    }

    return result;
  }

  async updateSubmissionActionStatus(
    submissionId: string,
    actionStatuses: ActionExecutionStatus[]
  ): Promise<FormSubmission> {
    await this.delay(100);
    const sub = this.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');
    sub.actionExecutionStatus = actionStatuses;
    return JSON.parse(JSON.stringify(sub));
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    await this.delay();
    return [...this.integrations];
  }

  async toggleIntegrationStatus(id: string, status: IntegrationStatus): Promise<Integration> {
    await this.delay();
    const idx = this.integrations.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Integration not found');
    this.integrations[idx] = {
      ...this.integrations[idx],
      status,
      lastSync: status === 'connected' ? new Date().toISOString() : this.integrations[idx].lastSync,
    };
    return this.integrations[idx];
  }

  // Domains
  async getDomains(): Promise<Domain[]> {
    await this.delay();
    return [...this.domains];
  }

  async addDomain(domainName: string): Promise<Domain> {
    await this.delay(250);
    const newDom: Domain = {
      id: `dom_${Date.now()}`,
      domainName: domainName.toLowerCase().trim(),
      status: 'pending_dns',
      connectedFormsCount: 0,
      sslEnabled: false,
      createdAt: new Date().toISOString(),
      isDefault: false,
      cnameRecord: 'ingress.formflow.io',
    };
    this.domains.push(newDom);
    return newDom;
  }

  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    await this.delay();
    return { ...this.user };
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    await this.delay();
    return [...this.notifications];
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.delay(50);
    const n = this.notifications.find((item) => item.id === id);
    if (n) n.read = true;
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.delay(50);
    this.notifications.forEach((n) => (n.read = true));
  }
}

export const apiService = new FormFlowDataStore();
