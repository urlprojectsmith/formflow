import { FormTheme } from './formBuilder';
export * from './formBuilder';

export type FormStatus = 'published' | 'draft' | 'archived';

export interface Form {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: FormStatus;
  publishedVersion?: number;
  fieldsCount: number;
  submissionsCount: number;
  viewsCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
  domain?: string;
  theme?: FormTheme;
}

export type SubmissionStatus = 'new' | 'reviewed' | 'processed' | 'flagged' | 'spam';

export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface SubmissionMetadata {
  referrer: string;
  sourceUrl: string;
  utmParameters: UtmParameters;
  visitorId: string;
  sessionId: string;
  formId?: string;
  formVersion?: number | string;
  submissionId?: string;
}

export type ActionType = 'email_notification' | 'webhook' | 'crm_sync' | 'auto_responder' | 'rest_api' | 'email' | 'redirect' | 'thank_you' | 'n8n' | 'ghl';

export type ActionExecutionState = 'Pending' | 'Running' | 'Success' | 'Failed' | 'Retrying' | 'skipped' | 'success' | 'failed';

export interface ActionExecutionStatus {
  actionId: string;
  actionName: string;
  actionType: ActionType;
  status: ActionExecutionState;
  executedAt: string;
  durationMs?: number;
  httpStatus?: number;
  responseBody?: string;
  details?: string;
  retryCount?: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formVersionId: string | number;
  formName?: string;
  submittedAt: string;
  fields: Record<string, any>;
  data?: Record<string, any>;
  metadata: SubmissionMetadata;
  status: SubmissionStatus;
  actionExecutionStatus?: ActionExecutionStatus[];
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userLocation?: string;
  ipAddress?: string;
}

export type IntegrationCategory = 'CRM' | 'Automation' | 'Email' | 'Spreadsheets' | 'Payments' | 'Notifications';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  iconName: string;
  status: IntegrationStatus;
  lastSync?: string;
  connectedFormsCount: number;
  webhookUrl?: string;
  apiKeySet?: boolean;
}

export type DomainStatus = 'active' | 'pending_dns' | 'ssl_issuing';

export interface Domain {
  id: string;
  domainName: string;
  status: DomainStatus;
  connectedFormsCount: number;
  sslEnabled: boolean;
  createdAt: string;
  isDefault?: boolean;
  cnameRecord: string;
}

export interface DashboardMetrics {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalSubmissions: number;
  conversionRate: number;
  formsChangePct: number;
  submissionsChangePct: number;
  conversionChangePct: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  organizationName: string;
  plan: 'Growth Plan' | 'Enterprise' | 'Starter';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'submission' | 'domain' | 'integration' | 'system';
}
