import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  RefreshCw,
  Send,
  Save,
  LayoutGrid,
  Code2,
  GitFork,
  Zap,
  ExternalLink,
  History,
  CheckCircle2,
  X,
  Share2,
} from 'lucide-react';
import { ViewportMode, SaveStatus } from '../../types';

interface BuilderTopBarProps {
  formId?: string;
  formName: string;
  version?: number;
  publishedVersion?: number;
  saveStatus: SaveStatus;
  viewport: ViewportMode;
  isPreview: boolean;
  canUndo: boolean;
  canRedo: boolean;
  activeSection?: 'visual' | 'code' | 'logic' | 'actions';
  onSelectSection?: (section: 'visual' | 'code' | 'logic' | 'actions') => void;
  onUpdateFormName: (name: string) => void;
  onSetViewport: (vp: ViewportMode) => void;
  onTogglePreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveNow: () => void;
  onPublish: () => void;
  onOpenEmbed?: () => void;
}

export const BuilderTopBar: React.FC<BuilderTopBarProps> = ({
  formId,
  formName,
  version = 1,
  publishedVersion,
  saveStatus,
  viewport,
  isPreview,
  canUndo,
  canRedo,
  activeSection = 'visual',
  onSelectSection,
  onUpdateFormName,
  onSetViewport,
  onTogglePreview,
  onUndo,
  onRedo,
  onSaveNow,
  onPublish,
  onOpenEmbed,
}) => {
  const [nameInput, setNameInput] = useState<string>(formName);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    setNameInput(formName);
  }, [formName]);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameInput.trim() && nameInput !== formName) {
      onUpdateFormName(nameInput.trim());
    } else {
      setNameInput(formName);
    }
  };

  const handleConfirmPublish = async () => {
    setIsPublishModalOpen(false);
    try {
      await onPublish();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4500);
    } catch (err) {
      // Handled in saveStatus
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Left: Back & Editable Form Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/forms"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Back to Forms Directory"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameBlur();
              }}
              className="px-2 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-blue-500 rounded focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:bg-slate-50 px-2 py-1 rounded transition-colors text-left"
              title="Click to edit form title"
            >
              {formName || 'Untitled Form'}
            </button>
          )}

          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-slate-500">Saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-amber-700">Unsaved changes</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span className="text-rose-600">Save failed</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Builder Mode Tabs, Undo/Redo & Viewport Selectors */}
      <div className="flex items-center gap-3">
        {/* Section Navigation Tabs (Canvas vs Code) */}
        {onSelectSection && (
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onSelectSection('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'visual'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => onSelectSection('logic')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'logic'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Logic</span>
            </button>
            <button
              onClick={() => onSelectSection('actions')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'actions'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              <span>Actions</span>
            </button>
            <button
              onClick={() => onSelectSection('code')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'code'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded disabled:opacity-40 transition-all"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded disabled:opacity-40 transition-all"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Device Viewport Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => onSetViewport('desktop')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'desktop'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Desktop Viewport"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetViewport('tablet')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'tablet'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetViewport('mobile')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'mobile'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Version Badges, Preview, History & Save/Publish */}
      <div className="flex items-center gap-2">
        {/* Version Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
          <span className="font-semibold text-slate-900">v{version}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">Draft</span>
          {publishedVersion ? (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              Live: v{publishedVersion}
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
              Not Published
            </span>
          )}
        </div>

        {/* Version History Link */}
        {formId && (
          <Link
            to={`/forms/${formId}/versions`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            title="View Form Version History"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Versions</span>
          </Link>
        )}

        {formId && (
          <button
            onClick={onOpenEmbed}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            title="Embed or Share Form"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Embed</span>
          </button>
        )}

        {formId && (
          <a
            href={`/f/${formId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors"
            title="Open Public Form Page in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public Page</span>
          </a>
        )}

        <button
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isPreview
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreview ? 'Exit Preview' : 'Preview'}</span>
        </button>

        <button
          onClick={onSaveNow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          title="Save draft version"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Draft</span>
        </button>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
          title="Publish immutable version"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>
      </div>

      {/* Success Toast Banner */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Published Successfully</div>
            <div className="text-[11px] text-slate-300">
              Version {version} is now immutable and live on the public URL.
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-slate-400 hover:text-white p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish Form Version {version}?</h3>
                <p className="text-xs text-slate-500">Create immutable snapshot for public runtime</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-2 mb-6">
              <p>
                Publishing will create an <strong className="text-slate-900 font-semibold">immutable Version {version}</strong> and instantly update the live public runtime at:
              </p>
              {formId && (
                <div className="font-mono text-[11px] text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 truncate">
                  /f/{formId}
                </div>
              )}
              <p className="text-slate-500 text-[11px]">
                Draft edits will not affect public users until a new version is published.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
