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
    <header className="h-14 theme-topbar px-4 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Left: Back & Editable Form Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/forms"
          className="p-1.5 theme-icon-button transition-colors"
          title="Back to Forms Directory"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="h-4 w-px border-r border-theme" />

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
              className="px-2 py-1 text-xs font-bold theme-input rounded focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-xs font-bold theme-text-primary hover:theme-text-primary px-2 py-1 rounded transition-colors text-left theme-chip"
              title="Click to edit form title"
            >
              {formName || 'Untitled Form'}
            </button>
          )}

          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md theme-chip">
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3 h-3 theme-text-primary animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-theme-success" />
                <span className="theme-text-muted">Saved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-theme-warning" />
                <span className="theme-text-warning">Unsaved changes</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3 h-3 text-theme-danger" />
                <span className="text-theme-danger">Save failed</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Builder Mode Tabs, Undo/Redo & Viewport Selectors */}
      <div className="flex items-center gap-3">
        {/* Section Navigation Tabs (Canvas vs Code) */}
        {onSelectSection && (
          <div className="flex items-center bg-theme-surface-hover p-1 rounded-lg border border-theme">
            <button
              onClick={() => onSelectSection('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'visual'
                  ? 'theme-button-primary text-white shadow-2xs font-extrabold'
                  : 'theme-text-secondary theme-hover'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => onSelectSection('logic')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'logic'
                  ? 'theme-button-primary text-white shadow-2xs font-extrabold'
                  : 'theme-text-secondary theme-hover'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Logic</span>
            </button>
            <button
              onClick={() => onSelectSection('actions')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'actions'
                  ? 'theme-button-primary text-white shadow-2xs font-extrabold'
                  : 'theme-text-secondary theme-hover'
              }`}
            >
              <Zap className="w-3.5 h-3.5 theme-text-warning" />
              <span>Actions</span>
            </button>
            <button
              onClick={() => onSelectSection('code')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeSection === 'code'
                  ? 'theme-button-primary text-white shadow-2xs font-extrabold'
                  : 'theme-text-secondary theme-hover'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>
        )}

        {/* Undo / Redo */}
          <div className="flex items-center bg-theme-surface-hover p-0.5 rounded-lg border border-theme">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 theme-text-secondary theme-hover hover:bg-theme-surface rounded disabled:opacity-40 transition-all"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 theme-text-secondary theme-hover hover:bg-theme-surface rounded disabled:opacity-40 transition-all"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px border-r border-theme" />

        {/* Device Viewport Selector */}
          <div className="flex items-center bg-theme-surface-hover p-0.5 rounded-lg border border-theme">
          <button
            onClick={() => onSetViewport('desktop')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'desktop'
                ? 'theme-button-primary text-white shadow-2xs font-bold'
                : 'theme-text-secondary theme-hover'
            }`}
            title="Desktop Viewport"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetViewport('tablet')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'tablet'
                ? 'theme-button-primary text-white shadow-2xs font-bold'
                : 'theme-text-secondary theme-hover'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetViewport('mobile')}
            className={`p-1.5 rounded transition-all ${
              viewport === 'mobile'
                ? 'theme-button-primary text-white shadow-2xs font-bold'
                : 'theme-text-secondary theme-hover'
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
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-theme-surface-hover border border-theme text-[11px] font-medium theme-text-secondary">
          <span className="font-semibold theme-text-primary">v{version}</span>
          <span className="theme-text-muted">•</span>
          <span className="theme-text-muted">Draft</span>
          {publishedVersion ? (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] theme-badge-success font-bold">
              Live: v{publishedVersion}
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] theme-chip theme-text-warning font-medium">
              Not Published
            </span>
          )}
        </div>

        {/* Version History Link */}
        {formId && (
          <Link
            to={`/forms/${formId}/versions`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-theme hover:bg-theme-surface-hover text-xs font-semibold rounded-lg transition-colors theme-text-secondary"
            title="View Form Version History"
          >
            <History className="w-3.5 h-3.5 theme-text-secondary" />
            <span className="hidden sm:inline">Versions</span>
          </Link>
        )}

        {formId && (
          <button
            onClick={onOpenEmbed}
            className="flex items-center gap-1.5 px-3 py-1.5 theme-button-primary text-xs font-bold rounded-lg shadow-2xs transition-colors"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-theme text-xs font-semibold rounded-lg transition-colors theme-text-secondary hover:bg-theme-surface-hover"
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
              ? 'theme-button-primary'
              : 'border border-theme bg-theme-surface-hover theme-text-secondary'
          }`}
        >
          {isPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreview ? 'Exit Preview' : 'Preview'}</span>
        </button>

        <button
          onClick={onSaveNow}
          className="flex items-center gap-1.5 px-3 py-1.5 theme-button-secondary text-xs font-semibold rounded-lg transition-colors"
          title="Save draft version"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Draft</span>
        </button>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 theme-button-primary text-xs font-bold rounded-lg shadow-2xs transition-colors"
          title="Publish immutable version"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>
      </div>

      {/* Success Toast Banner */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 theme-surface px-4 py-3 rounded-xl shadow-xl border border-theme flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-8 h-8 rounded-full bg-theme-surface-hover text-theme-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold theme-text-primary">Published Successfully</div>
            <div className="text-[11px] theme-text-muted">
              Version {version} is now immutable and live on the public URL.
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="theme-text-muted hover:theme-text-primary p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 theme-modal-overlay flex items-center justify-center p-4">
          <div className="theme-modal-panel rounded-2xl max-w-md w-full p-6 shadow-2xl border border-theme animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full theme-button-primary flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold theme-text-primary">Publish Form Version {version}?</h3>
                <p className="text-xs theme-text-muted">Create immutable snapshot for public runtime</p>
              </div>
            </div>

            <div className="theme-surface border border-theme rounded-xl p-3.5 text-xs theme-text-secondary space-y-2 mb-6">
              <p>
                Publishing will create an <strong className="theme-text-primary font-semibold">immutable Version {version}</strong> and instantly update the live public runtime at:
              </p>
              {formId && (
                <div className="font-mono text-[11px] theme-text-secondary theme-surface-hover p-2 rounded border border-theme truncate">
                  /f/{formId}
                </div>
              )}
              <p className="theme-text-muted text-[11px]">
                Draft edits will not affect public users until a new version is published.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold theme-text-secondary hover:theme-text-primary hover:bg-theme-surface-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPublish}
                className="px-4 py-2 text-xs font-bold text-white theme-button-primary rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
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

