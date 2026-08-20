import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  Settings,
  Palette,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Check,
  CheckSquare,
  HelpCircle,
  Maximize2,
  FileText,
  MousePointer,
  ShieldAlert,
} from 'lucide-react';
import {
  FormDefinition,
  FormField,
  FieldOption,
  FormSettings,
  FormTheme,
  FieldWidth,
  FieldStyle,
} from '../../types';
import { generateSafeFieldName, generateUniqueId } from '../../utils/formBuilderUtils';

interface PropertiesPanelProps {
  form: FormDefinition;
  selectedField: FormField | null;
  onUpdateField: (id: string, updates: Partial<FormField>) => void;
  onUpdateFormName: (name: string) => void;
  onUpdateFormDescription: (desc: string) => void;
  onUpdateFormSettings: (settings: Partial<FormSettings>) => void;
  onUpdateFormTheme: (theme: Partial<FormTheme>) => void;
  onClosePanel: () => void;
}

type PanelTab = 'field' | 'form' | 'theme';

const COLOR_PRESETS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Dark', hex: '#0f172a' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  form,
  selectedField,
  onUpdateField,
  onUpdateFormName,
  onUpdateFormDescription,
  onUpdateFormSettings,
  onUpdateFormTheme,
  onClosePanel,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('field');

  // Automatically switch tab to field when a field is selected
  useEffect(() => {
    if (selectedField) {
      setActiveTab('field');
    } else {
      setActiveTab('form');
    }
  }, [selectedField?.id]);

  // Check for duplicate field names
  const isDuplicateName = selectedField
    ? form.fields.some(
        (f) =>
          f.id !== selectedField.id &&
          f.name.toLowerCase() === selectedField.name.toLowerCase()
      )
    : false;

  // Handler for Internal Name Slug Change
  const handleNameChange = (newName: string) => {
    if (!selectedField) return;
    const cleaned = newName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    onUpdateField(selectedField.id, { name: cleaned });
  };

  const handleAutoFixName = () => {
    if (!selectedField) return;
    const safeName = generateSafeFieldName(
      selectedField.label || 'field',
      form.fields,
      selectedField.id
    );
    onUpdateField(selectedField.id, { name: safeName });
  };

  // Option Management
  const handleAddOption = () => {
    if (!selectedField) return;
    const currentOptions = selectedField.options || [];
    const newOptNumber = currentOptions.length + 1;
    const newOption: FieldOption = {
      id: generateUniqueId('opt'),
      label: `Option ${newOptNumber}`,
      value: `option_${newOptNumber}`,
      isDefault: false,
    };
    onUpdateField(selectedField.id, { options: [...currentOptions, newOption] });
  };

  const handleUpdateOption = (
    optId: string,
    updates: Partial<FieldOption>
  ) => {
    if (!selectedField) return;
    const currentOptions = selectedField.options || [];
    const updatedOptions = currentOptions.map((o) =>
      o.id === optId ? { ...o, ...updates } : o
    );
    onUpdateField(selectedField.id, { options: updatedOptions });
  };

  const handleDeleteOption = (optId: string) => {
    if (!selectedField) return;
    const currentOptions = selectedField.options || [];
    const updatedOptions = currentOptions.filter((o) => o.id !== optId);
    onUpdateField(selectedField.id, { options: updatedOptions });
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    if (!selectedField || !selectedField.options) return;
    const options = [...selectedField.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= options.length) return;
    const temp = options[index];
    options[index] = options[targetIndex];
    options[targetIndex] = temp;
    onUpdateField(selectedField.id, { options });
  };

  const handleToggleDefaultOption = (optId: string) => {
    if (!selectedField || !selectedField.options) return;
    const isSingleSelect = ['select', 'radio'].includes(selectedField.type);

    const updated = selectedField.options.map((o) => {
      if (o.id === optId) {
        return { ...o, isDefault: !o.isDefault };
      }
      return isSingleSelect ? { ...o, isDefault: false } : o;
    });

    onUpdateField(selectedField.id, { options: updated });
  };

  // Validation helpers
  const handleValidationUpdate = (updates: Record<string, any>) => {
    if (!selectedField) return;
    const currentVal = selectedField.validation || {};
    onUpdateField(selectedField.id, {
      validation: { ...currentVal, ...updates },
    });
  };

  const handleStyleUpdate = (updates: Partial<FieldStyle>) => {
    if (!selectedField) return;
    onUpdateField(selectedField.id, {
      style: {
        ...(selectedField.style || {}),
        ...updates,
      },
    });
  };

  // Check min vs max validation conflicts
  const validationError = (() => {
    if (!selectedField?.validation) return null;
    const { min, max, minLength, maxLength } = selectedField.validation;
    if (min !== undefined && max !== undefined && Number(min) > Number(max)) {
      return 'Min Value cannot exceed Max Value';
    }
    if (
      minLength !== undefined &&
      maxLength !== undefined &&
      Number(minLength) > Number(maxLength)
    ) {
      return 'Min Length cannot exceed Max Length';
    }
    return null;
  })();

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden text-xs">
      {/* Top Header Tabs */}
      <div className="border-b border-slate-200 bg-slate-50 flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-1">
          {selectedField && (
            <button
              type="button"
              onClick={() => setActiveTab('field')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'field'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Field</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'theme'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClosePanel}
          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors mb-1"
          title="Close Properties Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ================= FIELD PROPERTIES TAB ================= */}
        {activeTab === 'field' && selectedField && (
          <div className="space-y-5">
            {/* Field Type Badge Header */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Editing Field
                </span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {selectedField.label}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                {selectedField.type}
              </span>
            </div>

            {/* COMMON SETTINGS SECTION */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Common Settings
              </h4>

              {/* Label */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Label</label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) =>
                    onUpdateField(selectedField.id, { label: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Internal Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Internal Name</label>
                  <span className="text-[10px] font-mono text-slate-400">Export Key</span>
                </div>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs font-mono font-medium bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                    isDuplicateName
                      ? 'border-amber-400 ring-2 ring-amber-400/20 text-amber-900'
                      : 'border-slate-200 text-slate-800 focus:ring-blue-500 focus:bg-white'
                  }`}
                />
                {isDuplicateName && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1 mt-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Duplicate Internal Name</span>
                    </div>
                    <p className="text-[10px] text-amber-700 leading-tight">
                      Key <code className="font-mono">{selectedField.name}</code> is used by another field.
                    </p>
                    <button
                      type="button"
                      onClick={handleAutoFixName}
                      className="text-[10px] font-bold text-amber-900 underline hover:text-amber-950 block"
                    >
                      Auto-resolve key conflict
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Description</label>
                <input
                  type="text"
                  value={selectedField.description || ''}
                  onChange={(e) =>
                    onUpdateField(selectedField.id, { description: e.target.value })
                  }
                  placeholder="Helper text under input..."
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Placeholder */}
              {['text', 'email', 'phone', 'number', 'textarea', 'select', 'multiselect', 'date', 'time'].includes(
                selectedField.type
              ) && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { placeholder: e.target.value })
                    }
                    placeholder="Placeholder prompt..."
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Default Value */}
              {['text', 'email', 'phone', 'number', 'textarea', 'date', 'time'].includes(
                selectedField.type
              ) && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Default Value</label>
                  <input
                    type={selectedField.type === 'number' ? 'number' : 'text'}
                    value={(selectedField.defaultValue as string) || ''}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, { defaultValue: e.target.value })
                    }
                    placeholder="Pre-filled value..."
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Toggles: Required, Disabled, Hidden */}
              {!['heading', 'paragraph', 'divider', 'image', 'html', 'submit'].includes(
                selectedField.type
              ) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700">Required</span>
                    <input
                      type="checkbox"
                      checked={!!selectedField.required}
                      onChange={(e) =>
                        onUpdateField(selectedField.id, { required: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700">Disabled</span>
                    <input
                      type="checkbox"
                      checked={!!selectedField.disabled}
                      onChange={(e) =>
                        onUpdateField(selectedField.id, { disabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700">Hidden Field</span>
                    <input
                      type="checkbox"
                      checked={!!selectedField.hidden}
                      onChange={(e) =>
                        onUpdateField(selectedField.id, { hidden: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* LAYOUT SETTINGS */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Layout
              </h4>
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Field Width</label>
                <select
                  value={selectedField.width || 'full'}
                  onChange={(e) =>
                    onUpdateField(selectedField.id, {
                      width: e.target.value as FieldWidth,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">Full Width (100%)</option>
                  <option value="1/2">Half Width (50%)</option>
                  <option value="1/3">One Third (33%)</option>
                  <option value="2/3">Two Thirds (66%)</option>
                </select>
              </div>
            </div>

            {/* FIELD STYLE SETTINGS */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Field Style
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Background</label>
                  <input
                    type="color"
                    value={selectedField.style?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Text Color</label>
                  <input
                    type="color"
                    value={selectedField.style?.textColor || '#0f172a'}
                    onChange={(e) => handleStyleUpdate({ textColor: e.target.value })}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Label Color</label>
                  <input
                    type="color"
                    value={selectedField.style?.labelColor || selectedField.style?.textColor || '#1e293b'}
                    onChange={(e) => handleStyleUpdate({ labelColor: e.target.value })}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Input Color</label>
                  <input
                    type="color"
                    value={selectedField.style?.inputTextColor || '#0f172a'}
                    onChange={(e) => handleStyleUpdate({ inputTextColor: e.target.value })}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Input Background</label>
                <input
                  type="color"
                  value={selectedField.style?.inputBackgroundColor || '#f8fafc'}
                  onChange={(e) => handleStyleUpdate({ inputBackgroundColor: e.target.value })}
                  className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Background Image URL</label>
                <input
                  type="url"
                  value={selectedField.style?.backgroundImage || ''}
                  onChange={(e) => handleStyleUpdate({ backgroundImage: e.target.value })}
                  placeholder="https://example.com/background.jpg"
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Alignment</label>
                  <select
                    value={selectedField.style?.alignment || 'left'}
                    onChange={(e) => handleStyleUpdate({ alignment: e.target.value as FieldStyle['alignment'] })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Shadow</label>
                  <select
                    value={selectedField.style?.shadow || 'none'}
                    onChange={(e) => handleStyleUpdate({ shadow: e.target.value as FieldStyle['shadow'] })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Radius</label>
                  <select
                    value={selectedField.style?.borderRadius || 'none'}
                    onChange={(e) => handleStyleUpdate({ borderRadius: e.target.value as FieldStyle['borderRadius'] })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="full">Pill</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Padding</label>
                  <select
                    value={selectedField.style?.padding || 'none'}
                    onChange={(e) => handleStyleUpdate({ padding: e.target.value as FieldStyle['padding'] })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Font Family</label>
                <select
                  value={selectedField.style?.fontFamily || ''}
                  onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value || undefined })}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Use Form Theme</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Font Size</label>
                  <select
                    value={selectedField.style?.fontSize || 'sm'}
                    onChange={(e) => handleStyleUpdate({ fontSize: e.target.value as FieldStyle['fontSize'] })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="xs">XS</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">XL</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Font Style</label>
                  <select
                    value={selectedField.style?.fontWeight || 'semibold'}
                    onChange={(e) => handleStyleUpdate({ fontWeight: e.target.value as FieldStyle['fontWeight'] })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semi Bold</option>
                    <option value="bold">Bold</option>
                    <option value="extrabold">Extra Bold</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onUpdateField(selectedField.id, { style: undefined })}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Field Style
              </button>
            </div>

            {/* VALIDATION SETTINGS */}
            {!['heading', 'paragraph', 'divider', 'image', 'html', 'submit'].includes(
              selectedField.type
            ) && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Validation
                </h4>

                {validationError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Min / Max Length for Text / Textarea / Email / Phone */}
                {['text', 'textarea', 'email', 'phone'].includes(selectedField.type) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Min Length</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedField.validation?.minLength ?? ''}
                        onChange={(e) =>
                          handleValidationUpdate({
                            minLength: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Max Length</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedField.validation?.maxLength ?? ''}
                        onChange={(e) =>
                          handleValidationUpdate({
                            maxLength: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="255"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Min / Max Value for Number / Date / Time */}
                {['number', 'date', 'time'].includes(selectedField.type) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Min Value</label>
                      <input
                        type={selectedField.type === 'number' ? 'number' : selectedField.type}
                        value={selectedField.validation?.min ?? ''}
                        onChange={(e) =>
                          handleValidationUpdate({
                            min: e.target.value !== '' ? e.target.value : undefined,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Max Value</label>
                      <input
                        type={selectedField.type === 'number' ? 'number' : selectedField.type}
                        value={selectedField.validation?.max ?? ''}
                        onChange={(e) =>
                          handleValidationUpdate({
                            max: e.target.value !== '' ? e.target.value : undefined,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Custom Regex Pattern */}
                {['text', 'textarea', 'email', 'phone', 'number'].includes(
                  selectedField.type
                ) && (
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Pattern (Regex)</label>
                    <input
                      type="text"
                      value={selectedField.validation?.pattern || ''}
                      onChange={(e) =>
                        handleValidationUpdate({ pattern: e.target.value || undefined })
                      }
                      placeholder="^[A-Za-z0-9]+$"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => handleValidationUpdate({ pattern: '^[A-Za-z]+$' })}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-600 rounded"
                      >
                        Letters
                      </button>
                      <button
                        type="button"
                        onClick={() => handleValidationUpdate({ pattern: '^[0-9]+$' })}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-600 rounded"
                      >
                        Digits
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleValidationUpdate({
                            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                          })
                        }
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-600 rounded"
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => handleValidationUpdate({ pattern: undefined })}
                        className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-[10px] font-mono text-rose-600 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Validation format switch */}
                {selectedField.type === 'email' && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700">Strict Email Format</span>
                    <input
                      type="checkbox"
                      checked={selectedField.validation?.emailFormat !== false}
                      onChange={(e) =>
                        handleValidationUpdate({ emailFormat: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>
                )}

                {/* Phone Validation format switch */}
                {selectedField.type === 'phone' && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-700">Strict Phone Format</span>
                    <input
                      type="checkbox"
                      checked={selectedField.validation?.phoneFormat !== false}
                      onChange={(e) =>
                        handleValidationUpdate({ phoneFormat: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                  </label>
                )}

                {/* Custom Error Msg */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Custom Error Message</label>
                  <input
                    type="text"
                    value={selectedField.validation?.customErrorMsg || ''}
                    onChange={(e) =>
                      handleValidationUpdate({
                        customErrorMsg: e.target.value || undefined,
                      })
                    }
                    placeholder="Message shown on invalid input..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* OPTIONS EDITOR */}
            {['select', 'multiselect', 'radio', 'checkbox'].includes(
              selectedField.type
            ) && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Options ({selectedField.options?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedField.options?.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center gap-1">
                        {/* Default Option Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleDefaultOption(opt.id)}
                          className={`p-1 rounded transition-colors ${
                            opt.isDefault
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                          title={
                            opt.isDefault ? 'Default Option (Active)' : 'Set as Default Option'
                          }
                        >
                          <Check className="w-3 h-3" />
                        </button>

                        {/* Label Edit */}
                        <input
                          type="text"
                          value={opt.label}
                          placeholder={`Option ${idx + 1}`}
                          onChange={(e) =>
                            handleUpdateOption(opt.id, {
                              label: e.target.value,
                              value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                            })
                          }
                          className="flex-1 px-2 py-1 text-xs font-medium bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {/* Move Up/Down */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOption(idx, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            idx === (selectedField.options?.length || 0) - 1
                          }
                          onClick={() => handleMoveOption(idx, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(opt.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Value Edit */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 pl-6">
                        <span className="font-mono text-slate-400">Value:</span>
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) =>
                            handleUpdateOption(opt.id, { value: e.target.value })
                          }
                          className="flex-1 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEXTAREA SPECIFIC */}
            {selectedField.type === 'textarea' && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Textarea Config
                </h4>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Rows</label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={selectedField.rows || 3}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        rows: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* FILE UPLOAD SPECIFIC */}
            {selectedField.type === 'file' && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  File Upload Config
                </h4>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={selectedField.maxFileSizeMB || 10}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        maxFileSizeMB: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={selectedField.allowedFileTypes || '.pdf,.png,.jpg,.docx'}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        allowedFileTypes: e.target.value,
                      })
                    }
                    placeholder=".pdf,.png,.docx"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Maximum Number of Files
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedField.maxFiles || 1}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        maxFiles: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* BUTTON / SUBMIT SPECIFIC */}
            {selectedField.type === 'submit' && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Button Config
                </h4>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Button Text</label>
                  <input
                    type="text"
                    value={selectedField.buttonText || 'Submit'}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        buttonText: e.target.value,
                        label: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Button Type</label>
                  <select
                    value={selectedField.buttonType || 'submit'}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        buttonType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="submit">Submit</option>
                    <option value="button">Button (Action)</option>
                    <option value="reset">Reset Form</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Alignment</label>
                  <select
                    value={selectedField.buttonAlign || 'full'}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        buttonAlign: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full">Full Width</option>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Button Size</label>
                  <select
                    value={selectedField.buttonSize || 'md'}
                    onChange={(e) =>
                      onUpdateField(selectedField.id, {
                        buttonSize: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= FORM SETTINGS TAB ================= */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Form General Settings
            </h4>

            {/* Form Name */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Form Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onUpdateFormName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={form.description || ''}
                onChange={(e) => onUpdateFormDescription(e.target.value)}
                placeholder="Form instructions or subtitle..."
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>

            {/* Submit Button Label */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                Submit Button Label
              </label>
              <input
                type="text"
                value={form.settings?.submitButtonText || 'Submit Form'}
                onChange={(e) =>
                  onUpdateFormSettings({ submitButtonText: e.target.value })
                }
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Success Message */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                Success Message
              </label>
              <textarea
                rows={2}
                value={
                  form.settings?.successMessage ||
                  'Thank you! Your response has been recorded successfully.'
                }
                onChange={(e) =>
                  onUpdateFormSettings({ successMessage: e.target.value })
                }
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>

            {/* Redirect URL */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Redirect URL</label>
              <input
                type="url"
                value={form.settings?.redirectUrl || ''}
                onChange={(e) =>
                  onUpdateFormSettings({ redirectUrl: e.target.value })
                }
                placeholder="https://example.com/thank-you"
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Submission Storage Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Store Submissions</span>
                <span className="text-[10px] text-slate-500">
                  Save response records to database
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.settings?.storeSubmissions !== false}
                onChange={(e) =>
                  onUpdateFormSettings({ storeSubmissions: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </div>
          </div>
        )}

        {/* ================= THEME TAB ================= */}
        {activeTab === 'theme' && (
          <div className="space-y-5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Theme Customization
            </h4>

            {/* Primary Color Picker */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Primary Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isActive =
                    (form.theme?.primaryColor || '#2563eb').toLowerCase() ===
                    preset.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => onUpdateFormTheme({ primaryColor: preset.hex })}
                      style={{ backgroundColor: preset.hex }}
                      className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'ring-2 ring-offset-2 ring-slate-900 shadow-xs'
                          : 'hover:opacity-90'
                      }`}
                      title={preset.name}
                    >
                      {isActive && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">Hex Code:</span>
                <input
                  type="text"
                  value={form.theme?.primaryColor || '#2563eb'}
                  onChange={(e) => onUpdateFormTheme({ primaryColor: e.target.value })}
                  className="flex-1 px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700">Font Size</label>
              <select
                value={form.theme?.fontSize || 'md'}
                onChange={(e) =>
                  onUpdateFormTheme({ fontSize: e.target.value as any })
                }
                className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sm">Small (Compact)</option>
                <option value="md">Medium (Standard)</option>
                <option value="lg">Large (Spacious)</option>
              </select>
            </div>

            {/* Border Radius */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700">Border Radius</label>
              <select
                value={form.theme?.borderRadius || 'md'}
                onChange={(e) =>
                  onUpdateFormTheme({ borderRadius: e.target.value as any })
                }
                className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Square (0px)</option>
                <option value="sm">Small (4px)</option>
                <option value="md">Medium (8px)</option>
                <option value="lg">Large (12px)</option>
                <option value="full">Pill (9999px)</option>
              </select>
            </div>

            {/* Input Style */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700">Input Style</label>
              <select
                value={form.theme?.inputStyle || 'default'}
                onChange={(e) =>
                  onUpdateFormTheme({ inputStyle: e.target.value as any })
                }
                className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default (Border & Subtle Bg)</option>
                <option value="filled">Filled (Solid Light Gray)</option>
                <option value="minimal">Minimal (Bottom Border Only)</option>
              </select>
            </div>

            {/* Button Style */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-700">Button Style</label>
              <select
                value={form.theme?.buttonStyle || 'solid'}
                onChange={(e) =>
                  onUpdateFormTheme({ buttonStyle: e.target.value as any })
                }
                className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="solid">Solid Color Fill</option>
                <option value="outline">Outlined Border</option>
                <option value="soft">Soft Tint Background</option>
              </select>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Form Container Style
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Form Background</label>
                  <input
                    type="color"
                    value={form.theme?.formBackgroundColor || form.theme?.backgroundColor || '#ffffff'}
                    onChange={(e) => onUpdateFormTheme({ formBackgroundColor: e.target.value })}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Border Color</label>
                  <input
                    type="color"
                    value={form.theme?.formBorderColor || '#e2e8f0'}
                    onChange={(e) => onUpdateFormTheme({ formBorderColor: e.target.value })}
                    className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Form Opacity</label>
                  <span className="text-[10px] font-mono text-slate-500">{Math.round((form.theme?.formOpacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={form.theme?.formOpacity ?? 1}
                  onChange={(e) => onUpdateFormTheme({ formOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Background Image URL</label>
                <input
                  type="url"
                  value={form.theme?.formBackgroundImage || ''}
                  onChange={(e) => onUpdateFormTheme({ formBackgroundImage: e.target.value })}
                  placeholder="https://example.com/form-bg.jpg"
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Shadow</label>
                  <select
                    value={form.theme?.formShadow || 'md'}
                    onChange={(e) => onUpdateFormTheme({ formShadow: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Saber Glow</label>
                  <select
                    value={form.theme?.formSaberEffect || 'none'}
                    onChange={(e) => onUpdateFormTheme({ formSaberEffect: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="blue">Blue</option>
                    <option value="emerald">Emerald</option>
                    <option value="violet">Violet</option>
                    <option value="rose">Rose</option>
                    <option value="amber">Amber</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Animation</label>
                  <select
                    value={form.theme?.formAnimation || 'none'}
                    onChange={(e) => onUpdateFormTheme({ formAnimation: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade In</option>
                    <option value="slide_up">Slide Up</option>
                    <option value="scale">Scale In</option>
                    <option value="float">Floating</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Padding</label>
                  <select
                    value={form.theme?.formPadding || 'lg'}
                    onChange={(e) => onUpdateFormTheme({ formPadding: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
