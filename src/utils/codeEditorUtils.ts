import { FormDefinition } from '../types';

export function generateDefaultCustomHtml(form: FormDefinition): string {
  const fieldsHtml = form.fields
    .map((field) => {
      if (field.hidden) {
        return `    <input type="hidden" id="${field.name}" name="${field.name}" value="${field.defaultValue || ''}" />`;
      }
      if (field.type === 'heading') {
        const level = field.headingLevel || 'h2';
        return `    <div class="ff-field-group">\n      <${level} class="ff-heading">${field.content || field.label}</${level}>\n    </div>`;
      }
      if (field.type === 'paragraph') {
        return `    <div class="ff-field-group">\n      <p class="ff-paragraph">${field.content || field.description || ''}</p>\n    </div>`;
      }
      if (field.type === 'divider') {
        return `    <hr class="ff-divider" />`;
      }
      if (field.type === 'image') {
        return `    <div class="ff-field-group">\n      <img src="${field.imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'}" alt="${field.imageAlt || 'Banner'}" class="ff-image" />\n    </div>`;
      }
      if (field.type === 'textarea') {
        return `    <div class="ff-field-group">
      <label for="${field.name}" class="ff-label">${field.label}${field.required ? ' <span class="ff-required">*</span>' : ''}</label>
      <textarea id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" class="ff-input ff-textarea" rows="${field.rows || 3}" ${field.required ? 'required' : ''}></textarea>
      ${field.description ? `<span class="ff-help">${field.description}</span>` : ''}
    </div>`;
      }
      if (field.type === 'select') {
        const optsHtml = (field.options || [])
          .map((o) => `        <option value="${o.value}" ${o.isDefault ? 'selected' : ''}>${o.label}</option>`)
          .join('\n');
        return `    <div class="ff-field-group">
      <label for="${field.name}" class="ff-label">${field.label}${field.required ? ' <span class="ff-required">*</span>' : ''}</label>
      <select id="${field.name}" name="${field.name}" class="ff-select" ${field.required ? 'required' : ''}>
        <option value="">${field.placeholder || 'Select an option...'}</option>
${optsHtml}
      </select>
    </div>`;
      }
      if (field.type === 'radio') {
        const optsHtml = (field.options || [])
          .map(
            (o) =>
              `      <label class="ff-radio-label"><input type="radio" name="${field.name}" value="${o.value}" ${o.isDefault ? 'checked' : ''} /> <span>${o.label}</span></label>`
          )
          .join('\n');
        return `    <div class="ff-field-group">
      <label class="ff-label">${field.label}${field.required ? ' <span class="ff-required">*</span>' : ''}</label>
      <div class="ff-options-group">
${optsHtml}
      </div>
    </div>`;
      }
      if (field.type === 'checkbox') {
        const optsHtml = (field.options || [])
          .map(
            (o) =>
              `      <label class="ff-checkbox-label"><input type="checkbox" name="${field.name}" value="${o.value}" ${o.isDefault ? 'checked' : ''} /> <span>${o.label}</span></label>`
          )
          .join('\n');
        return `    <div class="ff-field-group">
      <label class="ff-label">${field.label}${field.required ? ' <span class="ff-required">*</span>' : ''}</label>
      <div class="ff-options-group">
${optsHtml}
      </div>
    </div>`;
      }
      if (field.type === 'submit') {
        return `    <div class="ff-field-group ff-submit-group">
      <button type="submit" id="${field.name}" class="ff-button">${field.buttonText || form.settings?.submitButtonText || 'Submit'}</button>
    </div>`;
      }

      const inputType = field.type === 'phone' ? 'tel' : field.type;
      return `    <div class="ff-field-group">
      <label for="${field.name}" class="ff-label">${field.label}${field.required ? ' <span class="ff-required">*</span>' : ''}</label>
      <input type="${inputType}" id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" class="ff-input" ${field.required ? 'required' : ''} />
      ${field.description ? `<span class="ff-help">${field.description}</span>` : ''}
    </div>`;
    })
    .join('\n\n');

  return `<div class="ff-container">
  <div class="ff-header">
    <h1 class="ff-title">${form.name || 'Untitled Form'}</h1>
    ${form.description ? `<p class="ff-description">${form.description}</p>` : ''}
  </div>

  <form id="ff-custom-form" class="ff-form">
${fieldsHtml}
  </form>

  <div id="ff-alert" class="ff-alert" style="display: none;"></div>
</div>`;
}

export function generateDefaultCustomCss(form: FormDefinition): string {
  const primaryColor = form.theme?.primaryColor || '#2563eb';

  return `/* FormFlow Custom Code Stylesheet */
.ff-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.ff-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.ff-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.ff-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.ff-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.ff-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ff-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.ff-required {
  color: #ef4444;
  font-weight: bold;
}

.ff-help {
  font-size: 0.75rem;
  color: #94a3b8;
}

.ff-heading {
  font-weight: 700;
  color: #0f172a;
  margin: 0.5rem 0 0.25rem 0;
}

.ff-paragraph {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.ff-divider {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 0.5rem 0;
}

.ff-image {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  max-height: 200px;
}

.ff-input, .ff-select, .ff-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.ff-input:focus, .ff-select:focus, .ff-textarea:focus {
  background-color: #ffffff;
  border-color: ${primaryColor};
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.ff-options-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.ff-radio-label, .ff-checkbox-label {
  display: flex;
  items-center: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
}

.ff-button {
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: ${primaryColor};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ff-button:hover {
  opacity: 0.92;
}

.ff-alert {
  margin-top: 1.25rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.ff-alert-success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.ff-alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}`;
}

export function generateDefaultCustomJs(form: FormDefinition): string {
  const successMsg =
    form.settings?.successMessage ||
    'Thank you! Your response has been recorded successfully.';

  return `// FormFlow Controlled Runtime JavaScript
FormFlow.on('formflow:loaded', function(detail) {
  console.log('⚡ Custom form runtime loaded safely in sandbox:', detail);
});

// Attach form listener
const customForm = document.getElementById('ff-custom-form');

if (customForm) {
  // Field change listener
  customForm.addEventListener('input', function(e) {
    const field = e.target;
    FormFlow.emit('formflow:fieldChanged', {
      name: field.name || field.id,
      value: field.value
    });
  });

  // Submit listener
  customForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(customForm);
    const payload = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    // Notify FormFlow Runtime of submission event
    FormFlow.emit('formflow:submit', { formData: payload });

    // Display feedback
    const alertBox = document.getElementById('ff-alert');
    if (alertBox) {
      alertBox.className = 'ff-alert ff-alert-success';
      alertBox.textContent = ${JSON.stringify(successMsg)};
      alertBox.style.display = 'block';
    }

    FormFlow.emit('formflow:success', { data: payload });
  });
}`;
}

export function formatCode(code: string, language: 'html' | 'css' | 'javascript'): string {
  if (!code) return '';
  let formatted = code;

  if (language === 'html' || language === 'css') {
    // Basic indentation & clean newline formatting
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return '';

      if (trimmed.startsWith('</') || trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indented = '  '.repeat(indentLevel) + trimmed;

      if (
        (trimmed.startsWith('<') &&
          !trimmed.startsWith('</') &&
          !trimmed.endsWith('/>') &&
          !trimmed.startsWith('<!') &&
          !trimmed.includes('</')) ||
        trimmed.endsWith('{')
      ) {
        indentLevel++;
      }

      return indented;
    });
    return formattedLines.filter(Boolean).join('\n');
  }

  return formatted;
}

export function buildSandboxedIframeDoc(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background-color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${css || ''}
  </style>
</head>
<body>
  ${html || '<div style="padding: 2rem; text-align: center; color: #64748b;">No HTML template specified</div>'}

  <script>
    (function() {
      // Safe logger & error interceptor
      function postLog(level, message, stack) {
        try {
          window.parent.postMessage({
            type: 'FORMFLOW_CONSOLE_LOG',
            level: level,
            message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
            stack: stack || null,
            timestamp: new Date().toLocaleTimeString()
          }, '*');
        } catch(e) {}
      }

      const origLog = console.log;
      const origError = console.error;
      const origWarn = console.warn;

      console.log = function(...args) {
        origLog.apply(console, args);
        postLog('log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      console.error = function(...args) {
        origError.apply(console, args);
        postLog('error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      console.warn = function(...args) {
        origWarn.apply(console, args);
        postLog('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      window.onerror = function(msg, url, lineNo, columnNo, error) {
        postLog('error', 'Runtime Error: ' + msg + ' (Line ' + lineNo + ':' + columnNo + ')', error ? error.stack : null);
        return false;
      };

      window.addEventListener('unhandledrejection', function(event) {
        postLog('error', 'Unhandled Promise Rejection: ' + event.reason);
      });

      // Controlled Runtime API
      const eventListeners = {};
      const ALLOWED_EVENTS = [
        'formflow:loaded',
        'formflow:fieldChanged',
        'formflow:submit',
        'formflow:success',
        'formflow:error'
      ];

      window.FormFlow = {
        on: function(eventName, callback) {
          if (!ALLOWED_EVENTS.includes(eventName)) {
            console.warn('[FormFlow Runtime Security] Event "' + eventName + '" is not in allowed events list.');
            return;
          }
          if (!eventListeners[eventName]) eventListeners[eventName] = [];
          eventListeners[eventName].push(callback);
        },
        emit: function(eventName, payload) {
          if (!ALLOWED_EVENTS.includes(eventName)) {
            console.warn('[FormFlow Runtime Security] Disallowed event emission blocked: "' + eventName + '".');
            return;
          }
          try {
            window.parent.postMessage({
              type: 'FORMFLOW_EVENT',
              eventName: eventName,
              payload: payload
            }, '*');
          } catch(e) {}

          if (eventListeners[eventName]) {
            eventListeners[eventName].forEach(cb => {
              try { cb(payload); } catch(err) { console.error(err); }
            });
          }
        }
      };

      document.addEventListener('DOMContentLoaded', function() {
        window.FormFlow.emit('formflow:loaded', { timestamp: Date.now() });
      });
    })();
  </script>

  <script>
    try {
      ${js || ''}
    } catch (err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
}
