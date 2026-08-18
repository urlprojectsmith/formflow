export type FieldCategory = 'basic' | 'content' | 'action';

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'file'
  | 'hidden'
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'image'
  | 'html'
  | 'submit';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  isDefault?: boolean;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  emailFormat?: boolean;
  phoneFormat?: boolean;
  customErrorMsg?: string;
}

export type FieldWidth = 'full' | '1/2' | '1/3' | '2/3';

export interface FormField {
  id: string;
  type: FieldType;
  name: string; // Internal safe field slug (e.g. full_name)
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  defaultValue?: string | string[];
  width?: FieldWidth;

  validation?: FieldValidation;
  options?: FieldOption[];

  // Content & Heading fields
  content?: string; // Heading text, paragraph body, raw HTML
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4';

  // Image field
  imageUrl?: string;
  imageAlt?: string;

  // Button field
  buttonText?: string;
  buttonType?: 'submit' | 'button' | 'reset';
  buttonAlign?: 'left' | 'center' | 'right' | 'full';
  buttonSize?: 'sm' | 'md' | 'lg';

  // Textarea field
  rows?: number;

  // File Upload field
  maxFileSizeMB?: number;
  allowedFileTypes?: string;
  maxFiles?: number;
}

export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  storeSubmissions?: boolean;
}

export interface FormTheme {
  primaryColor?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  inputStyle?: 'default' | 'filled' | 'minimal';
  buttonStyle?: 'solid' | 'outline' | 'soft';
  fontFamily?: string;
  backgroundColor?: string;
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'does_not_contain'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

export type RuleActionType =
  | 'show'
  | 'hide'
  | 'require'
  | 'optional'
  | 'enable'
  | 'disable';

export interface ConditionItem {
  id: string;
  fieldId: string; // References FormField.id
  operator: ConditionOperator;
  value?: string;
}

export interface RuleActionItem {
  id: string;
  targetFieldId: string; // References FormField.id
  action: RuleActionType;
}

export interface FormLogicRule {
  id: string;
  name: string;
  enabled: boolean;
  matchType: 'ALL' | 'ANY';
  conditions: ConditionItem[];
  actions: RuleActionItem[];
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  version?: number;
  publishedVersion?: number;
  fields: FormField[];
  settings: FormSettings;
  theme: FormTheme;
  logicRules?: FormLogicRule[];
  actionsPipeline?: FormPipelineAction[];
  renderMode?: 'visual' | 'custom';
  customHtml?: string;
  customCss?: string;
  customJs?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PipelineActionType = 'webhook' | 'rest_api' | 'email' | 'redirect' | 'thank_you' | 'n8n' | 'ghl';

export interface HeaderKV {
  key: string;
  value: string;
}

export interface QueryParamKV {
  key: string;
  value: string;
}

export interface FieldMappingKV {
  formField: string;
  targetField: string;
}

export interface ActionRetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
}

export interface ActionCondition {
  fieldId: string;
  operator: ConditionOperator;
  value?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: HeaderKV[];
  payloadType: 'entire_submission' | 'mapped_fields';
  fieldMappings?: FieldMappingKV[];
}

export interface RestApiConfig {
  url: string;
  method: HttpMethod;
  queryParams?: QueryParamKV[];
  headers?: HeaderKV[];
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  authBearerToken?: string;
  authApiKeyHeader?: string;
  authApiKeyValue?: string;
  authBasicUsername?: string;
  authBasicPassword?: string;
  jsonBody?: string;
}

export interface EmailConfig {
  to: string;
  replyTo?: string;
  subject: string;
  body: string;
}

export interface RedirectConfig {
  url: string;
  passQueryParams: boolean;
}

export interface ThankYouConfig {
  title: string;
  message: string;
  showSummary: boolean;
}

export interface N8nConfig {
  webhookUrl: string;
  method: 'POST' | 'PUT' | 'PATCH';
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  authBearerToken?: string;
  authApiKeyHeader?: string;
  authApiKeyValue?: string;
  authBasicUsername?: string;
  authBasicPassword?: string;
  payloadMode: 'entire_submission' | 'custom_mapping';
  customTemplate?: string;
  fieldMappings?: FieldMappingKV[];
}

export interface GhlCustomFieldMappingKV {
  formField: string;
  ghlCustomFieldKey: string;
}

export interface GhlConfig {
  locationId?: string;
  actionType: 'create_or_update_contact';
  mappings: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    customFields?: GhlCustomFieldMappingKV[];
  };
}

export interface FormPipelineAction {
  id: string;
  type: PipelineActionType;
  name: string;
  enabled: boolean;
  order: number;
  webhookConfig?: WebhookConfig;
  restApiConfig?: RestApiConfig;
  emailConfig?: EmailConfig;
  redirectConfig?: RedirectConfig;
  thankYouConfig?: ThankYouConfig;
  n8nConfig?: N8nConfig;
  ghlConfig?: GhlConfig;
  conditions?: ActionCondition[];
  retryPolicy?: ActionRetryPolicy;
}

export interface FormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  status: 'draft' | 'published' | 'archived';
  definition: FormDefinition;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
  notes?: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

