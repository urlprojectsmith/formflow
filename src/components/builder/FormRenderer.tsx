import React, { useState, useEffect, FormEvent } from 'react';
import { FormDefinition, FormField } from '../../types';
import { buildSandboxedIframeDoc } from '../../utils/codeEditorUtils';
import { evaluateFormLogic } from '../../utils/ruleEngine';
import {
  ChevronDown,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface FormRendererProps {
  definition: FormDefinition;
  readOnly?: boolean;
  onSubmitSubmit?: (formData: Record<string, any>) => Promise<void> | void;
  onSubmitSuccess?: () => void;
  externalError?: string | null;
}

const getWidthClass = (width?: string) => {
  switch (width) {
    case '1/2':
      return 'w-full sm:w-1/2';
    case '1/3':
      return 'w-full sm:w-1/3';
    case '2/3':
      return 'w-full sm:w-2/3';
    case 'full':
    default:
      return 'w-full';
  }
};

const getRadiusClass = (radius?: string) => {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-sm';
    case 'lg':
      return 'rounded-xl';
    case 'full':
      return 'rounded-full';
    case 'md':
    default:
      return 'rounded-lg';
  }
};

const getFontSizeClass = (fontSize?: string) => {
  switch (fontSize) {
    case 'sm':
      return 'text-xs';
    case 'lg':
      return 'text-sm';
    case 'md':
    default:
      return 'text-xs';
  }
};

export const FormRenderer: React.FC<FormRendererProps> = ({
  definition,
  readOnly = false,
  onSubmitSubmit,
  onSubmitSuccess,
  externalError,
}) => {
  const safeDefinition = {
    ...definition,
    fields: Array.isArray(definition.fields) ? definition.fields : [],
    logicRules: Array.isArray(definition.logicRules) ? definition.logicRules : [],
    settings: {
      submitButtonText: definition.settings?.submitButtonText || 'Submit Response',
      successMessage: definition.settings?.successMessage || 'Thank you! Your submission has been recorded.',
      redirectUrl: definition.settings?.redirectUrl,
      storeSubmissions: definition.settings?.storeSubmissions,
    },
    theme: {
      primaryColor: definition.theme?.primaryColor || '#2563eb',
      backgroundColor: definition.theme?.backgroundColor || '#ffffff',
      fontFamily: definition.theme?.fontFamily || 'Inter',
      borderRadius: definition.theme?.borderRadius || 'md',
      fontSize: definition.theme?.fontSize || 'sm',
      inputStyle: definition.theme?.inputStyle || 'default',
      buttonStyle: definition.theme?.buttonStyle || 'solid',
    },
    actionsPipeline: Array.isArray(definition.actionsPipeline) ? definition.actionsPipeline : [],
    renderMode: definition.renderMode || 'visual',
    customHtml: definition.customHtml || '',
    customCss: definition.customCss || '',
    customJs: definition.customJs || '',
  };

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    safeDefinition.fields.forEach((f) => {
      if (f.defaultValue !== undefined && f.defaultValue !== '') {
        initial[f.name] = f.defaultValue;
      } else if (['select', 'radio'].includes(f.type)) {
        const defaultOpt = f.options?.find((o) => o.isDefault);
        if (defaultOpt) initial[f.name] = defaultOpt.value;
      } else if (['multiselect', 'checkbox'].includes(f.type)) {
        const defaultOpts = f.options?.filter((o) => o.isDefault).map((o) => o.value) || [];
        if (defaultOpts.length > 0) initial[f.name] = defaultOpts;
      }
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Custom Iframe Event Bridge for custom render mode
  useEffect(() => {
    if (safeDefinition.renderMode !== 'custom') return;

    const handleCustomIframeMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'FORMFLOW_EVENT' && event.data.eventName === 'formflow:submit') {
        const customFormData = event.data.payload?.formData || {};
        if (readOnly) return;

        setIsSubmitting(true);
        setSubmitError(null);
        try {
          if (onSubmitSubmit) {
            await onSubmitSubmit(customFormData);
          }
          setSubmitted(true);
          if (onSubmitSuccess) onSubmitSuccess();
        } catch (err: any) {
          setSubmitError(err?.message || 'Failed to submit response. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    window.addEventListener('message', handleCustomIframeMessage);
    return () => window.removeEventListener('message', handleCustomIframeMessage);
  }, [safeDefinition.renderMode, readOnly, onSubmitSubmit, onSubmitSuccess]);

  // Handle Redirect Countdown when form is submitted
  useEffect(() => {
    if (submitted && safeDefinition.settings.redirectUrl) {
      setRedirectCountdown(3);
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            window.location.href = safeDefinition.settings.redirectUrl!;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [submitted, safeDefinition.settings.redirectUrl]);

  // If renderMode is 'custom', render custom HTML/CSS/JS inside a sandboxed iframe
  if (safeDefinition.renderMode === 'custom') {
    const doc = buildSandboxedIframeDoc(
      safeDefinition.customHtml || '',
      safeDefinition.customCss || '',
      safeDefinition.customJs || ''
    );

    return (
      <div className="w-full flex flex-col gap-3">
        {(submitError || externalError) && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{submitError || externalError}</span>
          </div>
        )}
        <div className="w-full min-h-[400px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <iframe
            sandbox="allow-scripts"
            srcDoc={doc}
            className="w-full h-[550px] border-0"
            title={`${safeDefinition.name} Custom Rendered Form`}
          />
        </div>
      </div>
    );
  }

  const primaryColor = safeDefinition.theme?.primaryColor || '#2563eb';
  const radiusClass = getRadiusClass(safeDefinition.theme?.borderRadius);
  const fontClass = getFontSizeClass(safeDefinition.theme?.fontSize);
  const inputStyle = safeDefinition.theme?.inputStyle || 'default';
  const buttonStyle = safeDefinition.theme?.buttonStyle || 'solid';

  // Input styling variants
  const getInputClass = () => {
    let base = `w-full px-3 py-2 ${fontClass} font-medium text-slate-900 transition-all focus:outline-none disabled:opacity-70 ${radiusClass} `;
    if (inputStyle === 'filled') {
      base += 'bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300';
    } else if (inputStyle === 'minimal') {
      base += 'bg-transparent border-b-2 border-slate-200 rounded-none px-1 focus:border-blue-600';
    } else {
      base += 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
    }
    return base;
  };

  const handleInputChange = (fieldName: string, value: any) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (fieldName: string, value: string) => {
    if (readOnly) return;
    setFormData((prev) => {
      const current = Array.isArray(prev[fieldName]) ? [...prev[fieldName]] : [];
      const idx = current.indexOf(value);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      return { ...prev, [fieldName]: current };
    });
  };

  // Evaluate logic rules against current form data
  const { fieldStates } = evaluateFormLogic(
    safeDefinition.fields,
    safeDefinition.logicRules || [],
    formData
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    safeDefinition.fields.forEach((field) => {
      if (['heading', 'paragraph', 'divider', 'image', 'html', 'submit'].includes(field.type)) {
        return;
      }

      const runtime = fieldStates[field.id] || fieldStates[field.name];
      const isHidden = runtime ? runtime.hidden : !!field.hidden;
      const isDisabled = runtime ? runtime.disabled : !!field.disabled;
      const isRequired = runtime ? runtime.required : !!field.required;

      // Hidden or disabled fields do NOT trigger required/validation errors
      if (isHidden || isDisabled) return;

      const value = formData[field.name];
      const valRules = field.validation || {};

      // Required Check
      if (isRequired) {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          newErrors[field.name] = valRules.customErrorMsg || `${field.label} is required`;
          return;
        }
      }

      if (value === undefined || value === null || value === '') return;

      // MinLength / MaxLength
      if (typeof value === 'string') {
        if (valRules.minLength && value.length < valRules.minLength) {
          newErrors[field.name] =
            valRules.customErrorMsg ||
            `${field.label} must be at least ${valRules.minLength} characters`;
        }
        if (valRules.maxLength && value.length > valRules.maxLength) {
          newErrors[field.name] =
            valRules.customErrorMsg ||
            `${field.label} cannot exceed ${valRules.maxLength} characters`;
        }
      }

      // Min / Max numeric or date
      if (field.type === 'number') {
        const num = Number(value);
        if (valRules.min !== undefined && num < Number(valRules.min)) {
          newErrors[field.name] =
            valRules.customErrorMsg || `${field.label} must be at least ${valRules.min}`;
        }
        if (valRules.max !== undefined && num > Number(valRules.max)) {
          newErrors[field.name] =
            valRules.customErrorMsg || `${field.label} cannot exceed ${valRules.max}`;
        }
      }

      // Regex Pattern
      if (valRules.pattern) {
        try {
          const reg = new RegExp(valRules.pattern);
          if (!reg.test(String(value))) {
            newErrors[field.name] =
              valRules.customErrorMsg || `${field.label} format is invalid`;
          }
        } catch (e) {
          console.error('Invalid pattern regex', e);
        }
      }

      // Email Format Check
      if (field.type === 'email' && valRules.emailFormat !== false) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          newErrors[field.name] =
            valRules.customErrorMsg || `Please enter a valid email address`;
        }
      }

      // Phone Format Check
      if (field.type === 'phone' && valRules.phoneFormat !== false) {
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(String(value).trim())) {
          newErrors[field.name] =
            valRules.customErrorMsg || `Please enter a valid phone number`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onSubmitSubmit) {
        await onSubmitSubmit(formData);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setSubmitted(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileDrop = (fieldName: string, files: FileList | null) => {
    if (!files || readOnly) return;
    const fileArray = Array.from(files);
    setSelectedFiles((prev) => ({ ...prev, [fieldName]: fileArray }));
    handleInputChange(
      fieldName,
      fileArray.map((f) => f.name)
    );
  };

  if (submitted) {
    return (
      <div className="p-8 text-center space-y-4 bg-white rounded-xl border border-slate-200 shadow-2xs my-4 animate-fade-in">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Submission Received!</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          {definition.settings?.successMessage ||
            'Thank you! Your response has been recorded successfully.'}
        </p>
        {definition.settings?.redirectUrl && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-md mx-auto text-xs text-blue-900 space-y-1">
            <p className="font-semibold flex items-center justify-center gap-1">
              <span>Redirecting in {redirectCountdown !== null ? redirectCountdown : 3} seconds...</span>
            </p>
            <a
              href={definition.settings.redirectUrl}
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 font-mono text-[11px]"
            >
              <span>{definition.settings.redirectUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({});
            setSelectedFiles({});
            setErrors({});
            setSubmitError(null);
          }}
          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline block mx-auto"
        >
          Submit another response
        </button>
      </div>
    );
  }

  // Button style generator
  const getButtonStyleProps = (align?: string, size?: string) => {
    let base = `flex items-center justify-center gap-2 font-bold transition-all shadow-2xs ${radiusClass} `;

    if (size === 'sm') base += 'px-3 py-1.5 text-xs ';
    else if (size === 'lg') base += 'px-6 py-3 text-sm ';
    else base += 'px-5 py-2.5 text-xs ';

    if (align === 'full') base += 'w-full ';

    let styleObj: React.CSSProperties = {};
    if (buttonStyle === 'outline') {
      base += 'border-2 bg-transparent ';
      styleObj = { color: primaryColor, borderColor: primaryColor };
    } else if (buttonStyle === 'soft') {
      base += 'bg-blue-50 hover:bg-blue-100 ';
      styleObj = { color: primaryColor };
    } else {
      base += 'text-white hover:opacity-95 ';
      styleObj = { backgroundColor: primaryColor };
    }

    return { className: base, style: styleObj };
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(submitError || externalError) && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{submitError || externalError}</span>
        </div>
      )}
      <div className="flex flex-wrap -mx-2">
        {definition.fields.map((field) => {
          const runtime = fieldStates[field.id] || fieldStates[field.name];
          const isHidden = runtime ? runtime.hidden : !!field.hidden;
          const isDisabled = runtime ? runtime.disabled : !!field.disabled;
          const isRequired = runtime ? runtime.required : !!field.required;

          if (isHidden) {
            return (
              <input
                key={field.id}
                type="hidden"
                name={field.name}
                value={formData[field.name] || ''}
              />
            );
          }

          const widthClass = getWidthClass(field.width);
          const hasError = !!errors[field.name];

          return (
            <div key={field.id} className={`${widthClass} p-2 flex flex-col space-y-1.5`}>
              {/* Field Label */}
              {!['heading', 'paragraph', 'divider', 'image', 'html', 'submit'].includes(
                field.type
              ) && (
                <label
                  htmlFor={field.id}
                  className="block text-xs font-bold text-slate-800"
                >
                  {field.label}
                  {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
              )}

              {/* Text Input */}
              {field.type === 'text' && (
                <input
                  id={field.id}
                  type="text"
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* Email Input */}
              {field.type === 'email' && (
                <input
                  id={field.id}
                  type="email"
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  placeholder={field.placeholder || 'email@domain.com'}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* Phone Input */}
              {field.type === 'phone' && (
                <input
                  id={field.id}
                  type="tel"
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  placeholder={field.placeholder || '+1 (555) 000-0000'}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* Number Input */}
              {field.type === 'number' && (
                <input
                  id={field.id}
                  type="number"
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  placeholder={field.placeholder}
                  min={field.validation?.min}
                  max={field.validation?.max}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <textarea
                  id={field.id}
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  placeholder={field.placeholder}
                  rows={field.rows || 3}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} resize-y ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* Select */}
              {field.type === 'select' && (
                <div className="relative">
                  <select
                    id={field.id}
                    name={field.name}
                    disabled={readOnly || isDisabled}
                    value={formData[field.name] ?? ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className={`${getInputClass()} appearance-none pr-8 ${
                      hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                    }`}
                  >
                    <option value="">{field.placeholder || 'Select an option...'}</option>
                    {field.options?.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Multiselect */}
              {field.type === 'multiselect' && (
                <select
                  id={field.id}
                  name={field.name}
                  multiple
                  disabled={readOnly || isDisabled}
                  value={formData[field.name] || []}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      (opt) => (opt as HTMLOptionElement).value
                    );
                    handleInputChange(field.name, values);
                  }}
                  className={`${getInputClass()} min-h-24 ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.id} value={opt.value} className="py-1 px-2">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Radio */}
              {field.type === 'radio' && (
                <div className="space-y-2 pt-1">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 text-xs font-medium text-slate-700 select-none ${
                        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={opt.value}
                        disabled={readOnly || isDisabled}
                        checked={formData[field.name] === opt.value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Checkbox */}
              {field.type === 'checkbox' && (
                <div className="space-y-2 pt-1">
                  {field.options?.map((opt) => {
                    const checked = Array.isArray(formData[field.name])
                      ? formData[field.name].includes(opt.value)
                      : false;

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 text-xs font-medium text-slate-700 select-none ${
                          isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={field.name}
                          value={opt.value}
                          disabled={readOnly || isDisabled}
                          checked={checked}
                          onChange={() => handleCheckboxToggle(field.name, opt.value)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Date */}
              {field.type === 'date' && (
                <input
                  id={field.id}
                  type="date"
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  min={field.validation?.min}
                  max={field.validation?.max}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* Time */}
              {field.type === 'time' && (
                <input
                  id={field.id}
                  type="time"
                  name={field.name}
                  disabled={readOnly || isDisabled}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`${getInputClass()} ${
                    hasError ? 'border-rose-400 ring-2 ring-rose-400/20' : ''
                  }`}
                />
              )}

              {/* File Upload Dropzone */}
              {field.type === 'file' && (
                <div
                  className={`p-4 border-2 border-dashed ${
                    hasError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50'
                  } ${radiusClass} text-center relative hover:border-blue-400 transition-colors cursor-pointer`}
                >
                  <input
                    id={field.id}
                    type="file"
                    disabled={readOnly || isDisabled}
                    onChange={(e) => handleFileDrop(field.name, e.target.files)}
                    accept={field.allowedFileTypes}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    Choose file or drag & drop
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {field.allowedFileTypes || 'PDF, DOCX, PNG, JPG'} (Max{' '}
                    {field.maxFileSizeMB || 10}MB)
                  </span>

                  {selectedFiles[field.name]?.length > 0 && (
                    <div className="mt-2 text-left bg-white p-2 rounded border border-slate-200 space-y-1">
                      {selectedFiles[field.name].map((file, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-700 truncate">{file.name}</span>
                          <span className="text-slate-400">
                            {(file.size / (1024 * 1024)).toFixed(1)}MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Heading */}
              {field.type === 'heading' && (
                <div className="pt-2 pb-1 border-b border-slate-100">
                  {field.headingLevel === 'h1' ? (
                    <h1 className="text-xl font-bold text-slate-900">
                      {field.content || field.label}
                    </h1>
                  ) : field.headingLevel === 'h3' ? (
                    <h3 className="text-sm font-bold text-slate-900">
                      {field.content || field.label}
                    </h3>
                  ) : field.headingLevel === 'h4' ? (
                    <h4 className="text-xs font-bold text-slate-900">
                      {field.content || field.label}
                    </h4>
                  ) : (
                    <h2 className="text-base font-bold text-slate-900">
                      {field.content || field.label}
                    </h2>
                  )}
                </div>
              )}

              {/* Paragraph */}
              {field.type === 'paragraph' && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {field.content || field.description}
                </p>
              )}

              {/* Divider */}
              {field.type === 'divider' && <hr className="border-t border-slate-200 my-2" />}

              {/* Image */}
              {field.type === 'image' && (
                <div className={`${radiusClass} overflow-hidden border border-slate-200`}>
                  <img
                    src={
                      field.imageUrl ||
                      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={field.imageAlt || 'Form Banner'}
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              )}

              {/* Raw HTML */}
              {field.type === 'html' && (
                <div
                  className="text-xs"
                  dangerouslySetInnerHTML={{
                    __html: field.content || '<div class="p-2 bg-slate-100">Custom HTML</div>',
                  }}
                />
              )}

              {/* Action / Submit Button */}
              {field.type === 'submit' && (
                <div
                  className={`pt-2 flex ${
                    field.buttonAlign === 'center'
                      ? 'justify-center'
                      : field.buttonAlign === 'right'
                      ? 'justify-end'
                      : field.buttonAlign === 'full'
                      ? 'w-full'
                      : 'justify-start'
                  }`}
                >
                  <button
                    type={field.buttonType || 'submit'}
                    disabled={readOnly || isSubmitting}
                    {...getButtonStyleProps(field.buttonAlign, field.buttonSize)}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitting
                        ? 'Submitting...'
                        : field.buttonText ||
                          definition.settings?.submitButtonText ||
                          field.label ||
                          'Submit'}
                    </span>
                  </button>
                </div>
              )}

              {/* Field Description */}
              {field.description && !['paragraph', 'heading'].includes(field.type) && (
                <p className="text-[11px] text-slate-500 mt-0.5">{field.description}</p>
              )}

              {/* Validation Error Message */}
              {hasError && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors[field.name]}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </form>
  );
};
