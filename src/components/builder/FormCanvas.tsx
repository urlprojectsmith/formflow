import React, { useState, memo } from 'react';
import {
  GripVertical,
  Copy,
  Trash2,
  Plus,
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  ListChecks,
  CircleDot,
  CheckSquare,
  Calendar,
  Clock,
  Upload,
  EyeOff,
  Heading,
  FileText,
  Minus,
  Image,
  Code,
  Send,
  Lock,
} from 'lucide-react';
import { FormDefinition, FormField, ViewportMode, FieldType } from '../../types';

interface FormCanvasProps {
  form: FormDefinition;
  selectedFieldId: string | null;
  viewport: ViewportMode;
  onSelectField: (id: string | null) => void;
  onAddField: (type: FieldType, targetIndex?: number) => void;
  onReorderFields: (startIndex: number, endIndex: number) => void;
  onDuplicateField: (id: string) => void;
  onDeleteField: (id: string) => void;
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

const FIELD_FONT_SIZES: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
};

const FIELD_FONT_WEIGHTS: Record<string, React.CSSProperties['fontWeight']> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

const FIELD_RADII: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

const FIELD_SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
  md: '0 8px 20px rgba(15, 23, 42, 0.10)',
  lg: '0 16px 32px rgba(15, 23, 42, 0.14)',
  xl: '0 24px 48px rgba(15, 23, 42, 0.18)',
};

const FIELD_PADDING: Record<string, string> = {
  none: undefined as unknown as string,
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
};

const getFieldCanvasStyle = (field: FormField): React.CSSProperties => {
  const style = field.style || {};
  return {
    backgroundColor: style.backgroundColor,
    backgroundImage: style.backgroundImage ? `url("${style.backgroundImage}")` : undefined,
    backgroundSize: style.backgroundImage ? 'cover' : undefined,
    backgroundPosition: style.backgroundImage ? 'center' : undefined,
    color: style.textColor,
    textAlign: style.alignment,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize ? FIELD_FONT_SIZES[style.fontSize] : undefined,
    fontWeight: style.fontWeight ? FIELD_FONT_WEIGHTS[style.fontWeight] : undefined,
    borderRadius: style.borderRadius ? FIELD_RADII[style.borderRadius] : undefined,
    boxShadow: style.shadow ? FIELD_SHADOWS[style.shadow] : undefined,
    padding: style.padding ? FIELD_PADDING[style.padding] : undefined,
    overflow: style.backgroundImage || style.borderRadius ? 'hidden' : undefined,
  };
};

const getFieldPreviewStyle = (field: FormField): React.CSSProperties => ({
  backgroundColor: field.style?.inputBackgroundColor,
  color: field.style?.inputTextColor || field.style?.textColor,
  textAlign: field.style?.alignment,
  borderRadius: field.style?.borderRadius ? FIELD_RADII[field.style.borderRadius] : undefined,
});

interface CanvasFieldCardProps {
  field: FormField;
  index: number;
  isSelected: boolean;
  primaryColor?: string;
  onSelectField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  onDeleteField: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number, fieldId: string) => void;
  onDragEnd: () => void;
}

const CanvasFieldCard: React.FC<CanvasFieldCardProps> = memo(
  ({
    field,
    index,
    isSelected,
    primaryColor = '#2563eb',
    onSelectField,
    onDuplicateField,
    onDeleteField,
    onDragStart,
    onDragEnd,
  }) => {
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, index, field.id)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onSelectField(field.id);
        }}
        className={`relative group p-3.5 rounded-xl border transition-all cursor-pointer select-none bg-white ${
          isSelected
            ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        } ${field.hidden ? 'opacity-60 border-dashed' : ''}`}
        style={getFieldCanvasStyle(field)}
      >
        {/* Floating Control Bar for Selected Field */}
        {isSelected && (
          <div className="absolute -top-3 right-3 bg-blue-600 text-white rounded-lg shadow-md flex items-center p-0.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateField(field.id);
              }}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              title="Duplicate Field"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-blue-400 mx-0.5" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteField(field.id);
              }}
              className="p-1 hover:bg-rose-600 rounded transition-colors"
              title="Delete Field"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Field Header & Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 bg-slate-100 rounded text-slate-500 group-hover:text-blue-600 transition-colors cursor-grab active:cursor-grabbing shrink-0">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 truncate" style={{ color: field.style?.labelColor || field.style?.textColor }}>
                {field.label}
              </span>
              {field.required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
              <span className="text-[10px] font-mono text-slate-400 ml-1.5 truncate">
                [{field.name}]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {field.hidden && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                <EyeOff className="w-2.5 h-2.5" />
                <span>Hidden</span>
              </span>
            )}
            {field.disabled && (
              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>Disabled</span>
              </span>
            )}
            {field.width && field.width !== 'full' && (
              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {field.width}
              </span>
            )}
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
              {field.type}
            </span>
          </div>
        </div>

        {/* Visual Input Preview Component */}
        <div className="mt-2 pointer-events-none opacity-85">
          {['text', 'email', 'phone', 'number', 'date', 'time'].includes(field.type) && (
            <div className="w-full px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg" style={getFieldPreviewStyle(field)}>
              {field.defaultValue || field.placeholder || `Enter ${field.label}...`}
            </div>
          )}

          {field.type === 'textarea' && (
            <div
              className="w-full px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg"
              style={{
                height: `${(field.rows || 3) * 20}px`,
                ...getFieldPreviewStyle(field),
              }}
            >
              {field.defaultValue || field.placeholder || 'Textarea content...'}
            </div>
          )}

          {['select', 'multiselect'].includes(field.type) && (
            <div className="w-full px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between" style={getFieldPreviewStyle(field)}>
              <span>{field.placeholder || 'Select option...'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}

          {['radio', 'checkbox'].includes(field.type) && (
            <div className="space-y-1 pt-0.5">
              {field.options?.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <div
                    className={`w-3.5 h-3.5 border border-slate-300 ${
                      field.type === 'radio' ? 'rounded-full' : 'rounded'
                    } ${opt.isDefault ? 'bg-blue-600 border-blue-600' : ''}`}
                  />
                  <span className={opt.isDefault ? 'font-bold text-blue-900' : ''}>
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {field.type === 'file' && (
            <div className="p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
              <Upload className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
              <span className="text-[11px] font-semibold text-slate-600 block">
                Upload File ({field.allowedFileTypes || 'Any type'}, max {field.maxFileSizeMB || 10}MB)
              </span>
            </div>
          )}

          {field.type === 'heading' && (
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1">
              {field.content || field.label}
            </h3>
          )}

          {field.type === 'paragraph' && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {field.content || field.description}
            </p>
          )}

          {field.type === 'divider' && <hr className="border-t border-slate-200 my-1" />}

          {field.type === 'image' && (
            <div className="h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs text-slate-400">
              Image Banner Preview
            </div>
          )}

          {field.type === 'submit' && (
            <div
              className={`flex ${
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
                type="button"
                style={{
                  backgroundColor: field.style?.inputBackgroundColor || primaryColor,
                  color: field.style?.inputTextColor || field.style?.textColor || '#ffffff',
                  borderRadius: field.style?.borderRadius ? FIELD_RADII[field.style.borderRadius] : undefined,
                }}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg ${
                  field.buttonAlign === 'full' ? 'w-full' : ''
                }`}
              >
                {field.buttonText || field.label || 'Submit'}
              </button>
            </div>
          )}
        </div>

        {/* Description Helper */}
        {field.description && !['paragraph', 'heading'].includes(field.type) && (
          <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>
        )}
      </div>
    );
  }
);

CanvasFieldCard.displayName = 'CanvasFieldCard';

export const FormCanvas: React.FC<FormCanvasProps> = ({
  form,
  selectedFieldId,
  viewport,
  onSelectField,
  onAddField,
  onReorderFields,
  onDuplicateField,
  onDeleteField,
}) => {
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'max-w-[375px]'
      : viewport === 'tablet'
      ? 'max-w-[768px]'
      : 'max-w-3xl';

  const handleDragOverSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(index);
  };

  const handleDropSlot = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const parsed = JSON.parse(rawData);

      if (parsed.source === 'library' && parsed.type) {
        onAddField(parsed.type, targetIndex);
      } else if (parsed.source === 'canvas' && typeof parsed.index === 'number') {
        const fromIndex = parsed.index;
        if (fromIndex !== targetIndex && fromIndex !== targetIndex - 1) {
          const adjustedTarget = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
          onReorderFields(fromIndex, adjustedTarget);
        }
      }
    } catch (err) {
      console.error('Failed to parse drop event', err);
    }
  };

  const handleCanvasDragStart = (e: React.DragEvent, index: number, fieldId: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ source: 'canvas', id: fieldId, index })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCanvasDragEnd = () => {
    setDropTargetIndex(null);
  };

  return (
      <main
      className="flex-1 theme-surface-secondary p-4 md:p-6 overflow-y-auto flex flex-col items-center select-none"
      onClick={() => onSelectField(null)}
    >
      <div
        className={`w-full ${viewportWidthClass} transition-all duration-200 ease-in-out my-auto py-2`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="theme-surface-card border-theme rounded-xl shadow-sm p-5 md:p-8 space-y-4">
          {/* Header Preview */}
          <div className="pb-3 border-b border-theme">
            <h2 className="text-xl font-bold theme-text-primary">{form.name || 'Untitled Form'}</h2>
            {form.description && (
              <p className="text-xs theme-text-muted mt-1">{form.description}</p>
            )}
          </div>

          {/* Empty State */}
          {form.fields.length === 0 && (
            <div
              onDragOver={(e) => handleDragOverSlot(e, 0)}
              onDrop={(e) => handleDropSlot(e, 0)}
              className="py-16 px-6 border-2 border-dashed border-theme rounded-xl theme-surface-hover text-center space-y-3 cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-theme-badge-success text-theme-primary flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold theme-text-primary">
                  Drag fields here to build your form
                </h3>
                <p className="text-xs theme-text-muted mt-1">
                  Drag components from the left field library or click any item to append.
                </p>
              </div>
            </div>
          )}

          {/* Fields List Grid with Width Support */}
          {form.fields.length > 0 && (
            <div>
              {/* Top Slot */}
              <div
                onDragOver={(e) => handleDragOverSlot(e, 0)}
                onDrop={(e) => handleDropSlot(e, 0)}
                className={`h-2 transition-all rounded mb-2 ${
                  dropTargetIndex === 0 ? 'bg-blue-500 h-4 shadow-xs' : 'hover:bg-slate-200'
                }`}
              />

              <div className="flex flex-wrap -mx-1.5 -my-1.5">
                {form.fields.map((field, index) => {
                  const isSelected = selectedFieldId === field.id;
                  const widthClass = getWidthClass(field.width);

                  return (
                    <div key={field.id} className={`${widthClass} p-1.5 flex flex-col`}>
                      <CanvasFieldCard
                        field={field}
                        index={index}
                        isSelected={isSelected}
                        primaryColor={form.theme?.primaryColor}
                        onSelectField={onSelectField}
                        onDuplicateField={onDuplicateField}
                        onDeleteField={onDeleteField}
                        onDragStart={handleCanvasDragStart}
                        onDragEnd={handleCanvasDragEnd}
                      />

                      {/* Drop Slot After Field */}
                      <div
                        onDragOver={(e) => handleDragOverSlot(e, index + 1)}
                        onDrop={(e) => handleDropSlot(e, index + 1)}
                        className={`h-2 transition-all rounded mt-1 ${
                          dropTargetIndex === index + 1
                            ? 'bg-blue-500 h-4 shadow-xs'
                            : 'hover:bg-slate-200'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
