import { Form, FormSubmission, Integration, Domain, UserProfile, NotificationItem } from '../types';
import { TenantAccount } from '../types';

export const initialTenants: TenantAccount[] = [];

export const initialUserProfile: UserProfile = {
  id: 'usr_001',
  name: '',
  email: '',
  role: 'User',
  tenantId: undefined,
  avatarUrl: '',
  organizationName: '',
  plan: 'Starter',
};

export const initialTenantUsers: UserProfile[] = [];

export const initialForms: Form[] = [];

export const initialSubmissions: FormSubmission[] = [];

export const initialIntegrations: Integration[] = [
  {
    id: 'int_n8n',
    name: 'n8n',
    description: 'Workflow automation with n8n webhook triggers.',
    category: 'Automation',
    iconName: 'Workflow',
    status: 'disconnected',
    lastSync: '2026-08-18T10:00:00Z',
    connectedFormsCount: 0,
    webhookUrl: 'https://n8n.company.com/webhook/formflow-inbound',
  },
  {
    id: 'int_ghl',
    name: 'GoHighLevel',
    description: 'CRM automation and pipeline sync with GoHighLevel.',
    category: 'CRM',
    iconName: 'Building2',
    status: 'disconnected',
    lastSync: '2026-08-18T09:58:00Z',
    connectedFormsCount: 0,
    apiKeySet: false,
  },
  {
    id: 'int_zapier',
    name: 'Zapier',
    description: 'Push form submissions into Zapier workflows and apps.',
    category: 'Automation',
    iconName: 'Zap',
    status: 'disconnected',
    lastSync: '2026-08-18T09:45:00Z',
    connectedFormsCount: 0,
  },
  {
    id: 'int_webhook',
    name: 'HTTP Webhooks',
    description: 'General webhook endpoint dispatch for form events.',
    category: 'Automation',
    iconName: 'Webhook',
    status: 'disconnected',
    lastSync: '2026-08-18T09:52:00Z',
    connectedFormsCount: 0,
    webhookUrl: 'https://api.acmegrowth.com/v1/webhooks/forms',
  },
  {
    id: 'int_sheets',
    name: 'Google Sheets',
    description: 'Append form leads into Google Sheets worksheets.',
    category: 'Spreadsheets',
    iconName: 'FileSpreadsheet',
    status: 'disconnected',
    lastSync: '2026-08-18T09:50:00Z',
    connectedFormsCount: 0,
  },
  {
    id: 'int_hubspot',
    name: 'HubSpot CRM',
    description: 'Sync contacts and activities into HubSpot CRM.',
    category: 'CRM',
    iconName: 'Users',
    status: 'disconnected',
    lastSync: '2026-08-18T09:47:00Z',
    connectedFormsCount: 0,
  },
  {
    id: 'int_slack',
    name: 'Slack Notifications',
    description: 'Send submission alerts into Slack channels.',
    category: 'Notifications',
    iconName: 'MessageSquare',
    status: 'disconnected',
    lastSync: '2026-08-18T09:40:00Z',
    connectedFormsCount: 0,
  },
  {
    id: 'int_salesforce',
    name: 'Salesforce',
    description: 'Upsert leads and contacts into Salesforce objects.',
    category: 'CRM',
    iconName: 'Database',
    status: 'disconnected',
    lastSync: '2026-08-18T09:42:00Z',
    connectedFormsCount: 0,
  },
  {
    id: 'int_stripe',
    name: 'Stripe Payments',
    description: 'Create checkout sessions and record payment submission events.',
    category: 'Payments',
    iconName: 'CreditCard',
    status: 'disconnected',
    lastSync: '2026-08-18T09:39:00Z',
    connectedFormsCount: 0,
  },
  {
    id: 'int_mailchimp',
    name: 'Mailchimp',
    description: 'Sync leads to Mailchimp audiences and automation lists.',
    category: 'Email',
    iconName: 'Mail',
    status: 'disconnected',
    lastSync: '2026-08-18T09:36:00Z',
    connectedFormsCount: 0,
  },
];

export const initialDomains: Domain[] = [];

export const initialNotifications: NotificationItem[] = [];
