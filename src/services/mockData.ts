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

export const initialIntegrations: Integration[] = [];

export const initialDomains: Domain[] = [];

export const initialNotifications: NotificationItem[] = [];
