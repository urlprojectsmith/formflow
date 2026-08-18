import React from 'react';
import { EyeOff, Monitor, Tablet, Smartphone } from 'lucide-react';
import { FormDefinition, ViewportMode } from '../../types';
import { FormRenderer } from './FormRenderer';

interface FormPreviewModalProps {
  form: FormDefinition;
  viewport: ViewportMode;
  onSetViewport: (vp: ViewportMode) => void;
  onClose: () => void;
}

export const FormPreviewModal: React.FC<FormPreviewModalProps> = ({
  form,
  viewport,
  onSetViewport,
  onClose,
}) => {
  const frameWidthClass =
    viewport === 'mobile'
      ? 'max-w-[375px]'
      : viewport === 'tablet'
      ? 'max-w-[768px]'
      : 'max-w-2xl';

  return (
    <div className="flex-1 bg-slate-900/90 backdrop-blur-xs p-6 overflow-y-auto flex flex-col items-center justify-center z-30 select-none">
      {/* Top Preview Floating Controls Bar */}
      <div className="fixed top-4 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-4 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Preview Mode</span>
          <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
            Interactive Test
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Viewport Selectors */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => onSetViewport('desktop')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetViewport('tablet')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'tablet'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetViewport('mobile')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Exit Preview</span>
        </button>
      </div>

      {/* Preview Device Frame Container */}
      <div
        className={`w-full ${frameWidthClass} my-auto transition-all duration-200 ease-in-out pt-12 pb-6`}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">{form.name}</h2>
            {form.description && (
              <p className="text-xs text-slate-500 mt-1">{form.description}</p>
            )}
          </div>

          <FormRenderer definition={form} />
        </div>
      </div>
    </div>
  );
};
