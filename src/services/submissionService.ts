import {
  FormSubmission,
  SubmissionStatus,
  SubmissionMetadata,
  UtmParameters,
  ActionExecutionStatus,
} from '../types';
import { FormPipelineAction } from '../types/formBuilder';
import { apiService } from './apiService';
import { actionService, FormActionConfig } from './actionService';

export interface SubmitFormInput {
  formId: string;
  fields: Record<string, any>;
  metadata?: {
    referrer?: string;
    sourceUrl?: string;
    utmParameters?: UtmParameters;
    visitorId?: string;
    sessionId?: string;
  };
  formVersionId?: string | number;
  actionsConfig?: FormActionConfig[];
  pipelineActions?: FormPipelineAction[];
}

export interface SubmitFormResponse {
  success: boolean;
  submissionId: string;
  submission: FormSubmission;
  message?: string;
}

export interface GetSubmissionsQuery {
  formId?: string;
  search?: string;
  status?: SubmissionStatus | 'all';
  dateRange?: 'all' | 'today' | '7days' | '30days' | 'custom';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSubmissionsResponse {
  items: FormSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Helper to safely sanitize sensitive field keys to prevent storing auth passwords/tokens
 */
export function sanitizeSubmissionFields(fields: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const SENSITIVE_KEYWORDS = ['password', 'passwd', 'secret', 'cvv', 'auth_token', 'token', 'pin', 'ssn'];

  Object.entries(fields || {}).forEach(([key, val]) => {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYWORDS.some((kw) => lowerKey.includes(kw));

    if (isSensitive) {
      sanitized[key] = '[REDACTED_SENSITIVE_INFO]';
    } else {
      sanitized[key] = val;
    }
  });

  return sanitized;
}

/**
 * Extract primary contact info (Name, Email, Phone) from submission fields
 */
export function extractContactDetails(fields: Record<string, any>): {
  userName: string;
  userEmail: string;
  userPhone: string;
} {
  let userName = '';
  let userEmail = '';
  let userPhone = '';

  Object.entries(fields || {}).forEach(([key, val]) => {
    if (typeof val !== 'string' && typeof val !== 'number') return;
    const strVal = String(val).trim();
    if (!strVal) return;

    const k = key.toLowerCase();

    // Check Email
    if (!userEmail && (k.includes('email') || (strVal.includes('@') && strVal.includes('.')))) {
      userEmail = strVal;
    }

    // Check Name
    if (!userName && (k.includes('name') || k.includes('first_name') || k.includes('full_name'))) {
      userName = strVal;
    }

    // Check Phone
    if (!userPhone && (k.includes('phone') || k.includes('mobile') || k.includes('tel'))) {
      userPhone = strVal;
    }
  });

  return {
    userName: userName || 'Anonymous Submitter',
    userEmail: userEmail || 'No email provided',
    userPhone: userPhone || 'N/A',
  };
}

/**
 * Safely escape cell strings for CSV output to prevent CSV Formula Injection.
 * Values starting with =, +, -, or @ are prepended with a single quote (').
 */
export function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // If complex object or array, stringify
  if (typeof val === 'object') {
    str = JSON.stringify(val);
  }

  // Trim leading whitespace check for formula injection characters
  const trimmed = str.trimStart();
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
  ) {
    str = `'${str}`;
  }

  // Escape internal double quotes by doubling them
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

export class SubmissionService {
  /**
   * Main submission workflow method:
   * 1. Validate Form
   * 2. Validate Field Values
   * 3. Generate Submission ID
   * 4. Store Submission
   * 5. Return Success
   * 6. Execute Configured Actions
   */
  async submitForm(input: SubmitFormInput): Promise<SubmitFormResponse> {
    const { formId, fields, metadata, formVersionId, actionsConfig } = input;

    // Step 1: Validate Form
    const form = await apiService.getFormById(formId);
    const publishedDef = await apiService.getPublishedFormDefinition(formId);

    if (!form) {
      throw new Error(`Form with ID "${formId}" was not found.`);
    }

    if (form.status === 'archived') {
      throw new Error('This form is archived and no longer accepting submissions.');
    }

    // Step 2: Validate Field Values
    const rawFields = fields || {};
    if (publishedDef && publishedDef.fields) {
      for (const field of publishedDef.fields) {
        if (field.hidden || field.disabled || field.type === 'heading' || field.type === 'divider' || field.type === 'submit') {
          continue;
        }

        const val = rawFields[field.name];

        // Required check
        if (field.required) {
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            throw new Error(`Field "${field.label || field.name}" is required.`);
          }
        }

        // Basic validation rules (email format, numbers)
        if (val && field.type === 'email' && typeof val === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            throw new Error(`Please provide a valid email address for "${field.label || field.name}".`);
          }
        }
      }
    }

    // Step 3: Generate Submission ID
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Step 4: Sanitize Sensitive Auth Fields
    const sanitizedFields = sanitizeSubmissionFields(rawFields);

    // Extract Contact Info
    const { userName, userEmail, userPhone } = extractContactDetails(sanitizedFields);

    // Construct Metadata
    const fullMetadata: SubmissionMetadata = {
      referrer: metadata?.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      sourceUrl: metadata?.sourceUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      utmParameters: metadata?.utmParameters || {},
      visitorId:
        metadata?.visitorId ||
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('formflow_visitor_id') || `vis_${Date.now()}`
          : `vis_${Date.now()}`),
      sessionId:
        metadata?.sessionId ||
        (typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('formflow_session_id') || `sess_${Date.now()}`
          : `sess_${Date.now()}`),
      formId: formId,
      formVersion: formVersionId || publishedDef?.version || form.publishedVersion || 1,
      submissionId: submissionId,
    };

    // Construct Submission Model
    const submission: FormSubmission = {
      id: submissionId,
      formId: formId,
      formVersionId: formVersionId || publishedDef?.version || form.publishedVersion || 1,
      formName: form.name,
      submittedAt: new Date().toISOString(),
      fields: sanitizedFields,
      data: sanitizedFields, // compatibility alias
      metadata: fullMetadata,
      status: 'new',
      userName,
      userEmail,
      userPhone,
      userLocation: 'United States',
      ipAddress: '192.168.1.1',
    };

    // Step 5: Store Submission in Persistence Layer
    await apiService.submitPublicFormResponse({
      formId,
      formName: form.name,
      submittedData: sanitizedFields,
      metadata: {
        formVersion: submission.formVersionId,
        referrer: fullMetadata.referrer,
        sourceUrl: fullMetadata.sourceUrl,
        utmParameters: fullMetadata.utmParameters,
      },
    });

    // Step 6: Execute Configured Actions via Pipeline Action Engine
    try {
      const pipeline = input.pipelineActions || publishedDef?.actionsPipeline || (form as any)?.actionsPipeline;
      if (pipeline && pipeline.length > 0) {
        const actionResults = await actionService.executePipeline(pipeline, submission);
        submission.actionExecutionStatus = actionResults;
      } else {
        const actionResults = await actionService.executeFormActions(actionsConfig || [], submission);
        submission.actionExecutionStatus = actionResults;
      }
    } catch (actionErr: any) {
      console.warn('Action execution encountered warning:', actionErr);
    }

    // Step 7: Return Success
    return {
      success: true,
      submissionId,
      submission,
      message: 'Form response recorded successfully.',
    };
  }

  /**
   * Fetch paginated submissions with filtering and search
   */
  async getSubmissions(query: GetSubmissionsQuery = {}): Promise<PaginatedSubmissionsResponse> {
    const {
      formId,
      search,
      status = 'all',
      dateRange = 'all',
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
    } = query;

    // Retrieve all raw submissions from backend/persistence
    let allSubmissions = await apiService.getSubmissions(formId || undefined);

    // 1. Filter by status
    if (status && status !== 'all') {
      allSubmissions = allSubmissions.filter((s) => s.status === status);
    }

    // 2. Filter by search term
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      allSubmissions = allSubmissions.filter((s) => {
        const idMatch = s.id.toLowerCase().includes(q);
        const nameMatch = (s.userName || '').toLowerCase().includes(q);
        const emailMatch = (s.userEmail || '').toLowerCase().includes(q);
        const phoneMatch = (s.userPhone || '').toLowerCase().includes(q);
        const formMatch = (s.formName || '').toLowerCase().includes(q);
        const fieldsMatch = JSON.stringify(s.fields || s.data || {}).toLowerCase().includes(q);

        return idMatch || nameMatch || emailMatch || phoneMatch || formMatch || fieldsMatch;
      });
    }

    // 3. Filter by Date Range
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      allSubmissions = allSubmissions.filter((s) => {
        const subDate = new Date(s.submittedAt);
        if (isNaN(subDate.getTime())) return true;

        if (dateRange === 'today') {
          return (
            subDate.getDate() === now.getDate() &&
            subDate.getMonth() === now.getMonth() &&
            subDate.getFullYear() === now.getFullYear()
          );
        } else if (dateRange === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return subDate >= sevenDaysAgo;
        } else if (dateRange === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return subDate >= thirtyDaysAgo;
        } else if (dateRange === 'custom' && (startDate || endDate)) {
          let valid = true;
          if (startDate) {
            valid = valid && subDate >= new Date(startDate);
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            valid = valid && subDate <= end;
          }
          return valid;
        }

        return true;
      });
    }

    // Sort newest first
    allSubmissions.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    const total = allSubmissions.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);

    // Service-level pagination slice
    const startIndex = (currentPage - 1) * pageSize;
    const items = allSubmissions.slice(startIndex, startIndex + pageSize);

    // Map fields for items ensure metadata structure complete
    const formattedItems = items.map((item) => {
      const fieldsObj = item.fields || item.data || {};
      const { userName, userEmail, userPhone } = extractContactDetails(fieldsObj);

      return {
        ...item,
        fields: fieldsObj,
        formVersionId: item.formVersionId || item.metadata?.formVersion || 1,
        userName: item.userName || userName,
        userEmail: item.userEmail || userEmail,
        userPhone: item.userPhone || userPhone,
        metadata: {
          referrer: item.metadata?.referrer || '',
          sourceUrl: item.metadata?.sourceUrl || '',
          utmParameters: item.metadata?.utmParameters || {},
          visitorId: item.metadata?.visitorId || `vis_${item.id}`,
          sessionId: item.metadata?.sessionId || `sess_${item.id}`,
          formId: item.formId,
          formVersion: item.formVersionId || item.metadata?.formVersion || 1,
          submissionId: item.id,
        },
      };
    });

    return {
      items: formattedItems,
      total,
      page: currentPage,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get single submission detail by ID
   */
  async getSubmissionById(id: string): Promise<FormSubmission | null> {
    const all = await apiService.getSubmissions();
    const match = all.find((s) => s.id === id);
    if (!match) return null;

    const fieldsObj = match.fields || match.data || {};
    const { userName, userEmail, userPhone } = extractContactDetails(fieldsObj);

    return {
      ...match,
      fields: fieldsObj,
      formVersionId: match.formVersionId || match.metadata?.formVersion || 1,
      userName: match.userName || userName,
      userEmail: match.userEmail || userEmail,
      userPhone: match.userPhone || userPhone,
      metadata: {
        referrer: match.metadata?.referrer || '',
        sourceUrl: match.metadata?.sourceUrl || '',
        utmParameters: match.metadata?.utmParameters || {},
        visitorId: match.metadata?.visitorId || `vis_${match.id}`,
        sessionId: match.metadata?.sessionId || `sess_${match.id}`,
        formId: match.formId,
        formVersion: match.formVersionId || match.metadata?.formVersion || 1,
        submissionId: match.id,
      },
    };
  }

  /**
   * Update submission processing status
   */
  async updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<FormSubmission> {
    const all = await apiService.getSubmissions();
    const match = all.find((s) => s.id === id);
    if (!match) {
      throw new Error(`Submission with ID "${id}" was not found.`);
    }

    match.status = status;
    return match;
  }

  /**
   * Delete submission
   */
  async deleteSubmission(id: string): Promise<boolean> {
    const all = await apiService.getSubmissions();
    const idx = all.findIndex((s) => s.id === id);
    if (idx !== -1) {
      all.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Export submissions as CSV string with CSV Formula Injection Protection
   */
  exportCSV(submissions: FormSubmission[]): string {
    const headers = [
      'Submission ID',
      'Form ID',
      'Form Name',
      'Form Version',
      'Submitted At',
      'Status',
      'Name',
      'Email',
      'Phone',
      'Referrer',
      'Source URL',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Visitor ID',
      'Session ID',
      'Submitted Fields JSON',
    ];

    const csvRows = [headers.map(escapeCsvCell).join(',')];

    submissions.forEach((s) => {
      const { userName, userEmail, userPhone } = extractContactDetails(s.fields || s.data || {});
      const meta = s.metadata || { referrer: '', sourceUrl: '', utmParameters: {}, visitorId: '', sessionId: '' };
      const utm = meta.utmParameters || {};

      const row = [
        s.id,
        s.formId,
        s.formName || s.formId,
        s.formVersionId || meta.formVersion || 1,
        s.submittedAt,
        s.status,
        s.userName || userName,
        s.userEmail || userEmail,
        s.userPhone || userPhone,
        meta.referrer,
        meta.sourceUrl,
        utm.utm_source || '',
        utm.utm_medium || '',
        utm.utm_campaign || '',
        meta.visitorId,
        meta.sessionId,
        JSON.stringify(s.fields || s.data || {}),
      ];

      csvRows.push(row.map(escapeCsvCell).join(','));
    });

    return csvRows.join('\r\n');
  }

  /**
   * Export submissions as pretty JSON string
   */
  exportJSON(submissions: FormSubmission[]): string {
    return JSON.stringify(submissions, null, 2);
  }
}

export const submissionService = new SubmissionService();
