import { FormSubmission, ActionExecutionStatus } from '../types';
import { N8nConfig, GhlConfig } from '../types/formBuilder';
import { sanitizeSecretsInLog } from './actionService';

export interface GhlConnectionMetadata {
  provider: 'gohighlevel';
  locationId: string;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  tokenExpiry?: string;
  lastSync?: string;
  errorMessage?: string;
  authType: 'oauth' | 'api_key';
}

export interface N8nConfigMetadata {
  provider: 'n8n';
  webhookUrl: string;
  method: 'POST' | 'PUT' | 'PATCH';
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  payloadMode: 'entire_submission' | 'custom_mapping';
  customTemplate?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  apiKeySet?: boolean;
}

class IntegrationService {
  // Vault for server-side secrets (never exposed to browser)
  private serverVault: {
    ghlAccessToken?: string;
    ghlRefreshToken?: string;
    n8nSecretToken?: string;
    n8nBasicPassword?: string;
  } = {
    ghlAccessToken: 'ghl_token_live_sec_89230193801293',
    ghlRefreshToken: 'ghl_refresh_sec_9918230192',
    n8nSecretToken: 'n8n_sec_auth_header_key_102',
  };

  // Connection Metadata (Safe to send to browser)
  private ghlMetadata: GhlConnectionMetadata = {
    provider: 'gohighlevel',
    locationId: 'loc_acme_ghl_902',
    status: 'connected',
    tokenExpiry: '2026-08-15T12:00:00Z',
    lastSync: '2026-08-11T21:30:00Z',
    authType: 'oauth',
  };

  private n8nMetadata: N8nConfigMetadata = {
    provider: 'n8n',
    webhookUrl: 'https://n8n.company.com/webhook/formflow-inbound',
    method: 'POST',
    authType: 'bearer',
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
    status: 'connected',
    lastSync: '2026-08-11T20:00:00Z',
    apiKeySet: true,
  };

  // Helper delay simulation
  private async delay(ms = 150): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- GoHighLevel Server Methods ---

  async getGhlMetadata(): Promise<GhlConnectionMetadata> {
    await this.delay(50);
    return { ...this.ghlMetadata };
  }

  async connectGhl(params: {
    locationId: string;
    apiKey?: string;
    oauthCode?: string;
  }): Promise<GhlConnectionMetadata> {
    await this.delay(200);

    if (!params.locationId || params.locationId.trim() === '') {
      throw new Error('GoHighLevel Location ID is required.');
    }

    if (params.apiKey) {
      this.serverVault.ghlAccessToken = params.apiKey;
    } else {
      this.serverVault.ghlAccessToken = `ghl_oauth_access_${Date.now()}`;
      this.serverVault.ghlRefreshToken = `ghl_oauth_refresh_${Date.now()}`;
    }

    // Update expiry (e.g. 7 days from now)
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.ghlMetadata = {
      provider: 'gohighlevel',
      locationId: params.locationId.trim(),
      status: 'connected',
      tokenExpiry: expiry,
      lastSync: new Date().toISOString(),
      authType: params.apiKey ? 'api_key' : 'oauth',
      errorMessage: undefined,
    };

    return { ...this.ghlMetadata };
  }

  async reconnectGhl(): Promise<GhlConnectionMetadata> {
    await this.delay(300);

    if (this.ghlMetadata.status === 'disconnected') {
      return this.connectGhl({ locationId: this.ghlMetadata.locationId || 'loc_acme_ghl_902' });
    }

    // Simulate OAuth refresh
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.serverVault.ghlAccessToken = `ghl_refreshed_access_${Date.now()}`;
    this.ghlMetadata.status = 'connected';
    this.ghlMetadata.tokenExpiry = newExpiry;
    this.ghlMetadata.lastSync = new Date().toISOString();
    this.ghlMetadata.errorMessage = undefined;

    return { ...this.ghlMetadata };
  }

  async disconnectGhl(): Promise<GhlConnectionMetadata> {
    await this.delay(100);
    this.serverVault.ghlAccessToken = undefined;
    this.serverVault.ghlRefreshToken = undefined;
    this.ghlMetadata.status = 'disconnected';
    this.ghlMetadata.errorMessage = undefined;
    return { ...this.ghlMetadata };
  }

  /**
   * Execute GoHighLevel Contact Action
   * Provider-specific logic handles Create/Update Contact and custom field mappings.
   */
  async executeGhlAction(
    config: GhlConfig,
    submission: FormSubmission
  ): Promise<ActionExecutionStatus> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    // Verify connection status (non-endless retry handling for perm auth errors)
    if (this.ghlMetadata.status === 'disconnected' || this.ghlMetadata.status === 'expired') {
      return {
        actionId: 'act_ghl_step',
        actionName: 'GoHighLevel Contact Sync',
        actionType: 'ghl',
        status: 'Failed',
        executedAt: now,
        durationMs: Date.now() - startTime,
        httpStatus: 401,
        responseBody: JSON.stringify(
          {
            error: 'Unauthorized',
            message: 'GoHighLevel access token is expired or disconnected. Reconnect in Settings > Integrations.',
            code: 'GHL_AUTH_EXPIRED',
          },
          null,
          2
        ),
        details: 'GoHighLevel permanent authorization error. Stopped endless retries.',
      };
    }

    const locationId = config?.locationId || this.ghlMetadata.locationId || 'loc_acme_ghl_902';
    const mappings = config?.mappings || {};

    // Standard field extractors
    const fields = submission.fields || {};
    const extractVal = (mappedFieldName?: string) => {
      if (!mappedFieldName) return undefined;
      return fields[mappedFieldName] || undefined;
    };

    // Auto fallback field matchers
    const findFallback = (keys: string[]) => {
      for (const k of Object.keys(fields)) {
        const lowerK = k.toLowerCase();
        if (keys.some((key) => lowerK.includes(key))) {
          return fields[k];
        }
      }
      return undefined;
    };

    const firstName =
      extractVal(mappings.firstName) || submission.userName?.split(' ')[0] || findFallback(['first', 'name']);
    const lastName =
      extractVal(mappings.lastName) || submission.userName?.split(' ').slice(1).join(' ') || findFallback(['last']);
    const email = extractVal(mappings.email) || submission.userEmail || findFallback(['email']);
    const phone = extractVal(mappings.phone) || submission.userPhone || findFallback(['phone', 'mobile']);
    const address1 = extractVal(mappings.address1) || findFallback(['address', 'street']);
    const city = extractVal(mappings.city) || findFallback(['city']);
    const state = extractVal(mappings.state) || findFallback(['state']);
    const postalCode = extractVal(mappings.postalCode) || findFallback(['zip', 'postal']);
    const country = extractVal(mappings.country) || findFallback(['country']);

    // Build GHL Custom Fields array
    const customFields: Array<{ key: string; value: any }> = [];
    if (mappings.customFields && mappings.customFields.length > 0) {
      mappings.customFields.forEach((cf) => {
        if (cf.formField && cf.ghlCustomFieldKey) {
          customFields.push({
            key: cf.ghlCustomFieldKey,
            value: fields[cf.formField] ?? null,
          });
        }
      });
    }

    const contactPayload = {
      locationId,
      firstName: firstName || 'Inbound',
      lastName: lastName || 'Lead',
      email: email || 'lead@example.com',
      phone: phone || null,
      address1: address1 || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
      customFields,
      tags: ['FormFlow', 'Website Lead'],
      source: `Form: ${submission.formName || submission.formId}`,
    };

    const durationMs = Date.now() - startTime + 65;

    // Return successful contact upsert execution log
    const mockGhlContactId = `ghl_cnt_${Math.random().toString(36).substring(2, 9)}`;

    return {
      actionId: 'act_ghl_step',
      actionName: 'GoHighLevel Contact Sync',
      actionType: 'ghl',
      status: 'Success',
      executedAt: now,
      durationMs,
      httpStatus: 201,
      responseBody: JSON.stringify(
        {
          contact: {
            id: mockGhlContactId,
            locationId,
            firstName: contactPayload.firstName,
            lastName: contactPayload.lastName,
            email: contactPayload.email,
            phone: contactPayload.phone,
            customFields: contactPayload.customFields,
            dateAdded: now,
            dateUpdated: now,
          },
          status: 'upserted',
          message: 'Contact created or updated successfully in GoHighLevel CRM.',
        },
        null,
        2
      ),
      details: sanitizeSecretsInLog(
        `Synced contact (${contactPayload.email}) to GoHighLevel Location ${locationId}. Contact ID: ${mockGhlContactId}`
      ),
    };
  }

  // --- n8n Server Methods ---

  async getN8nMetadata(): Promise<N8nConfigMetadata> {
    await this.delay(50);
    return { ...this.n8nMetadata };
  }

  async saveN8nConfig(config: Partial<N8nConfig>): Promise<N8nConfigMetadata> {
    await this.delay(150);

    if (config.authBearerToken) {
      this.serverVault.n8nSecretToken = config.authBearerToken;
    }
    if (config.authBasicPassword) {
      this.serverVault.n8nBasicPassword = config.authBasicPassword;
    }

    this.n8nMetadata = {
      provider: 'n8n',
      webhookUrl: config.webhookUrl || this.n8nMetadata.webhookUrl,
      method: config.method || this.n8nMetadata.method,
      authType: config.authType || this.n8nMetadata.authType,
      payloadMode: config.payloadMode || this.n8nMetadata.payloadMode,
      customTemplate: config.customTemplate || this.n8nMetadata.customTemplate,
      status: 'connected',
      lastSync: new Date().toISOString(),
      apiKeySet: true,
    };

    return { ...this.n8nMetadata };
  }

  /**
   * Helper to format custom n8n payload using JSON template tags
   */
  formatN8nCustomPayload(
    template: string,
    formContext: { id: string; name: string; version: number | string },
    submissionContext: { id: string },
    fields: Record<string, any>
  ): any {
    try {
      let output = template;

      // Replace form meta tags
      output = output.replace(/{{\s*form\.id\s*}}/g, formContext.id);
      output = output.replace(/{{\s*form\.name\s*}}/g, formContext.name);
      output = output.replace(/{{\s*form\.version\s*}}/g, String(formContext.version));

      // Replace submission meta tags
      output = output.replace(/{{\s*submission\.id\s*}}/g, submissionContext.id);

      // Replace field tags
      Object.entries(fields).forEach(([k, v]) => {
        const fieldTag = new RegExp(`{{\\s*field\\.${k}\\s*}}`, 'g');
        output = output.replace(fieldTag, String(v));
      });

      // Cleanup remaining unfulfilled tags gracefully
      output = output.replace(/{{\s*field\.[a-zA-Z0-9_]+\s*}}/g, '');

      return JSON.parse(output);
    } catch {
      // Fallback object if template parse fails
      return {
        form: formContext,
        submission: submissionContext,
        fields,
      };
    }
  }

  async testN8nConnection(config: N8nConfig): Promise<ActionExecutionStatus> {
    const startTime = Date.now();
    const now = new Date().toISOString();
    const url = config.webhookUrl || this.n8nMetadata.webhookUrl;

    await this.delay(200);

    const durationMs = Date.now() - startTime + 40;

    return {
      actionId: 'test_n8n_conn',
      actionName: 'n8n Webhook Health Check',
      actionType: 'n8n',
      status: 'Success',
      executedAt: now,
      durationMs,
      httpStatus: 200,
      responseBody: JSON.stringify(
        {
          status: 'ok',
          message: 'n8n instance is online and reachable.',
          webhookUrl: url,
          authType: config.authType,
          timestamp: now,
        },
        null,
        2
      ),
      details: sanitizeSecretsInLog(`Successfully verified connection to n8n webhook endpoint (${url})`),
    };
  }

  async sendN8nTestPayload(
    config: N8nConfig,
    sampleFields: Record<string, any> = {
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 (555) 019-2831',
      company: 'Acme Growth Labs',
      message: 'Testing n8n automated workflow trigger.',
    }
  ): Promise<ActionExecutionStatus> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    let payload: any;
    if (config.payloadMode === 'custom_mapping' && config.customTemplate) {
      payload = this.formatN8nCustomPayload(
        config.customTemplate,
        { id: 'form_demo_04', name: 'Demo Request Form', version: 1 },
        { id: `sub_test_${Date.now()}` },
        sampleFields
      );
    } else {
      payload = {
        event: 'form_submission.created',
        form: { id: 'form_demo_04', name: 'Demo Request Form', version: 1 },
        submission: { id: `sub_test_${Date.now()}`, submittedAt: now },
        fields: sampleFields,
      };
    }

    const durationMs = Date.now() - startTime + 80;

    return {
      actionId: 'test_n8n_payload',
      actionName: 'n8n Test Payload Dispatch',
      actionType: 'n8n',
      status: 'Success',
      executedAt: now,
      durationMs,
      httpStatus: 200,
      responseBody: JSON.stringify(
        {
          status: 'workflow_triggered',
          executionId: `exec_${Math.random().toString(36).substring(2, 8)}`,
          dataReceived: payload,
        },
        null,
        2
      ),
      details: sanitizeSecretsInLog(
        `Dispatched test payload to n8n webhook (${config.webhookUrl}) in ${config.payloadMode} mode.`
      ),
    };
  }

  async executeN8nAction(
    config: N8nConfig,
    submission: FormSubmission
  ): Promise<ActionExecutionStatus> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    const url = config?.webhookUrl || this.n8nMetadata.webhookUrl;
    const method = config?.method || 'POST';

    let payload: any;
    if (config?.payloadMode === 'custom_mapping' && config.customTemplate) {
      payload = this.formatN8nCustomPayload(
        config.customTemplate,
        {
          id: submission.formId,
          name: submission.formName || 'Form Response',
          version: submission.formVersionId,
        },
        { id: submission.id },
        submission.fields
      );
    } else {
      payload = {
        event: 'form_submission.created',
        form: {
          id: submission.formId,
          name: submission.formName,
          version: submission.formVersionId,
        },
        submission: {
          id: submission.id,
          submittedAt: submission.submittedAt,
        },
        fields: submission.fields,
        metadata: submission.metadata,
      };
    }

    const durationMs = Date.now() - startTime + 95;

    return {
      actionId: 'act_n8n_step',
      actionName: 'n8n Workflow Ingestion',
      actionType: 'n8n',
      status: 'Success',
      executedAt: now,
      durationMs,
      httpStatus: 200,
      responseBody: JSON.stringify(
        {
          n8nExecutionId: `exec_${Math.random().toString(36).substring(2, 9)}`,
          received: true,
          status: 'workflow_started',
        },
        null,
        2
      ),
      details: sanitizeSecretsInLog(
        `Delivered n8n workflow payload (${config?.payloadMode || 'entire_submission'}) to ${url} [${method}]`
      ),
    };
  }
}

export const integrationService = new IntegrationService();
