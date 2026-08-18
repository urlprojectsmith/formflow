import { FieldType, FormField, FieldOption, FieldCategory } from '../types';

export interface FieldCatalogItem {
  type: FieldType;
  category: FieldCategory;
  label: string;
  description: string;
  iconName: string;
}

export function generateSafeFieldName(
  label: string,
  existingFields: FormField[],
  currentFieldId?: string
): string {
  let baseSlug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!baseSlug) {
    baseSlug = 'field';
  }

  const otherNames = new Set(
    existingFields
      .filter((f) => f.id !== currentFieldId)
      .map((f) => f.name.toLowerCase())
  );

  if (!otherNames.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  while (otherNames.has(`${baseSlug}_${counter}`)) {
    counter++;
  }
  return `${baseSlug}_${counter}`;
}

export function generateUniqueId(prefix = 'f'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function createDefaultField(type: FieldType, existingFields: FormField[] = []): FormField {
  const id = generateUniqueId('f');

  let defaultLabel = 'New Field';
  let placeholder = '';
  let description = '';
  let required = false;
  let options: FieldOption[] | undefined = undefined;
  let content = '';
  let headingLevel: 'h1' | 'h2' | 'h3' | 'h4' | undefined = undefined;
  let buttonText = '';
  let buttonAlign: 'left' | 'center' | 'right' | 'full' | undefined = undefined;
  let imageUrl = '';
  let imageAlt = '';

  switch (type) {
    case 'text':
      defaultLabel = 'Single Line Text';
      placeholder = 'Enter your response...';
      break;
    case 'email':
      defaultLabel = 'Email Address';
      placeholder = 'john.doe@company.com';
      required = true;
      break;
    case 'phone':
      defaultLabel = 'Phone Number';
      placeholder = '+1 (555) 000-0000';
      break;
    case 'number':
      defaultLabel = 'Number Input';
      placeholder = 'e.g. 100';
      break;
    case 'textarea':
      defaultLabel = 'Long Text / Message';
      placeholder = 'Type details here...';
      break;
    case 'select':
      defaultLabel = 'Dropdown Selection';
      placeholder = 'Select an option...';
      options = [
        { id: generateUniqueId('opt'), label: 'Option 1', value: 'option_1' },
        { id: generateUniqueId('opt'), label: 'Option 2', value: 'option_2' },
        { id: generateUniqueId('opt'), label: 'Option 3', value: 'option_3' },
      ];
      break;
    case 'multiselect':
      defaultLabel = 'Multiple Choice Select';
      placeholder = 'Select one or more...';
      options = [
        { id: generateUniqueId('opt'), label: 'Choice A', value: 'choice_a' },
        { id: generateUniqueId('opt'), label: 'Choice B', value: 'choice_b' },
        { id: generateUniqueId('opt'), label: 'Choice C', value: 'choice_c' },
      ];
      break;
    case 'radio':
      defaultLabel = 'Single Choice (Radio)';
      options = [
        { id: generateUniqueId('opt'), label: 'Option 1', value: 'option_1' },
        { id: generateUniqueId('opt'), label: 'Option 2', value: 'option_2' },
      ];
      break;
    case 'checkbox':
      defaultLabel = 'Checkbox Options';
      options = [
        { id: generateUniqueId('opt'), label: 'I agree to terms & conditions', value: 'accepted_terms' },
      ];
      break;
    case 'date':
      defaultLabel = 'Date Picker';
      break;
    case 'time':
      defaultLabel = 'Time Selection';
      break;
    case 'file':
      defaultLabel = 'File Upload';
      description = 'Upload attachments (Max 10MB)';
      break;
    case 'hidden':
      defaultLabel = 'Hidden Tracking Field';
      break;
    case 'heading':
      defaultLabel = 'Section Heading';
      content = 'Form Section Title';
      headingLevel = 'h2';
      break;
    case 'paragraph':
      defaultLabel = 'Paragraph Text';
      content = 'Please fill in the details below accurately to complete your submission.';
      break;
    case 'divider':
      defaultLabel = 'Section Divider';
      break;
    case 'image':
      defaultLabel = 'Image Banner';
      imageUrl = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80';
      imageAlt = 'Form Header Banner';
      break;
    case 'html':
      defaultLabel = 'Custom HTML Block';
      content = '<div class="p-3 bg-blue-50 text-blue-900 text-xs rounded-lg font-mono">Custom HTML snippet or embed badge</div>';
      break;
    case 'submit':
      defaultLabel = 'Submit Button';
      buttonText = 'Submit Form';
      buttonAlign = 'full';
      break;
  }

  const name = generateSafeFieldName(defaultLabel, existingFields);

  return {
    id,
    type,
    name,
    label: defaultLabel,
    placeholder,
    description,
    required,
    options,
    content,
    headingLevel,
    buttonText,
    buttonAlign,
    imageUrl,
    imageAlt,
  };
}

export const FIELD_LIBRARY_ITEMS: FieldCatalogItem[] = [
  // Basic Fields
  { type: 'text', category: 'basic', label: 'Short Text', description: 'Single-line text input', iconName: 'Type' },
  { type: 'email', category: 'basic', label: 'Email', description: 'Email address with validation', iconName: 'Mail' },
  { type: 'phone', category: 'basic', label: 'Phone', description: 'Formatted telephone input', iconName: 'Phone' },
  { type: 'number', category: 'basic', label: 'Number', description: 'Numeric values and ranges', iconName: 'Hash' },
  { type: 'textarea', category: 'basic', label: 'Long Text', description: 'Multi-line text area', iconName: 'AlignLeft' },
  { type: 'select', category: 'basic', label: 'Dropdown', description: 'Single choice dropdown list', iconName: 'ChevronDown' },
  { type: 'multiselect', category: 'basic', label: 'Multi-Select', description: 'Select multiple items', iconName: 'ListChecks' },
  { type: 'radio', category: 'basic', label: 'Radio Buttons', description: 'Single selection list', iconName: 'CircleDot' },
  { type: 'checkbox', category: 'basic', label: 'Checkboxes', description: 'Multiple selection list', iconName: 'CheckSquare' },
  { type: 'date', category: 'basic', label: 'Date', description: 'Calendar date picker', iconName: 'Calendar' },
  { type: 'time', category: 'basic', label: 'Time', description: 'Time picker input', iconName: 'Clock' },
  { type: 'file', category: 'basic', label: 'File Upload', description: 'Document and image upload', iconName: 'Upload' },
  { type: 'hidden', category: 'basic', label: 'Hidden Field', description: 'Pass silent parameters or tokens', iconName: 'EyeOff' },

  // Content
  { type: 'heading', category: 'content', label: 'Heading', description: 'Section headers (H1 - H4)', iconName: 'Heading' },
  { type: 'paragraph', category: 'content', label: 'Paragraph', description: 'Descriptive body text or instructions', iconName: 'FileText' },
  { type: 'divider', category: 'content', label: 'Divider', description: 'Visual horizontal separator', iconName: 'Minus' },
  { type: 'image', category: 'content', label: 'Image', description: 'Embedded image banner', iconName: 'Image' },
  { type: 'html', category: 'content', label: 'HTML Block', description: 'Raw custom HTML embed', iconName: 'Code' },

  // Action
  { type: 'submit', category: 'action', label: 'Submit Button', description: 'Primary submit trigger button', iconName: 'Send' },
];
