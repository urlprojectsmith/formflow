import React, { useState } from 'react';
import {
  Code,
  Share2,
  Mail,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Layout,
  Maximize2,
  PanelRightClose,
  Bookmark,
  Send,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { FormDefinition } from '../../types';

interface FormEmbedModalProps {
  formId: string;
  formName: string;
  onClose: () => void;
}

export type EmbedLayoutMode = 'inline' | 'popup' | 'slide_in' | 'sticky';
export type EmbedPosition = 'left' | 'right';
export type TriggerType = 'always' | 'scroll' | 'delay';
export type ActivationType = 'always' | 'nth_visit';
export type DeactivationType = 'never' | 'max_displays' | 'lead_collected';

export const FormEmbedModal: React.FC<FormEmbedModalProps> = ({
  formId,
  formName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'embed' | 'email'>('embed');

  // Embed Options State
  const [layoutMode, setLayoutMode] = useState<EmbedLayoutMode>('inline');
  const [position, setPosition] = useState<EmbedPosition>('right');
  const [triggerType, setTriggerType] = useState<TriggerType>('always');
  const [scrollPct, setScrollPct] = useState<number>(50);
  const [delaySec, setDelaySec] = useState<number>(3);

  const [activationType, setActivationType] = useState<ActivationType>('always');
  const [nthVisit, setNthVisit] = useState<number>(2);

  const [deactivationType, setDeactivationType] = useState<DeactivationType>('never');
  const [maxDisplays, setMaxDisplays] = useState<number>(3);

  const [triggerText, setTriggerText] = useState<string>('Share Feedback');
  const [triggerColor, setTriggerColor] = useState<string>('#2563eb');

  // Copy Feedback States
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Email state
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>(`Invitation: Complete ${formName}`);
  const [emailMessage, setEmailMessage] = useState<string>(
    `Hello,\n\nPlease take a moment to fill out our form: ${formName}.\n\nAccess link: ${window.location.origin}/f/${formId}\n\nThank you!`
  );
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);

  const publicUrl = `${window.location.origin}/f/${formId}`;
  const embedScriptUrl = `${window.location.origin}/embed.js`;

  // Generate HTML Embed Code
  const generateEmbedCode = (): string => {
    const isInline = layoutMode === 'inline';

    return `<!-- FormFlow Dynamic Embed Script -->
<script async src="${embedScriptUrl}"></script>

<div
  data-formflow-id="${formId}"
  data-formflow-mode="${layoutMode}"${
    layoutMode !== 'inline' ? `\n  data-formflow-position="${position}"` : ''
  }${
    triggerType === 'scroll'
      ? `\n  data-formflow-scroll-pct="${scrollPct}"`
      : triggerType === 'delay'
      ? `\n  data-formflow-delay-sec="${delaySec}"`
      : ''
  }${
    activationType === 'nth_visit'
      ? `\n  data-formflow-visit-count="${nthVisit}"`
      : ''
  }${
    deactivationType === 'max_displays'
      ? `\n  data-formflow-max-displays="${maxDisplays}"`
      : ''
  }${
    deactivationType === 'lead_collected'
      ? `\n  data-formflow-deactivate-lead="true"`
      : ''
  }${
    layoutMode !== 'inline'
      ? `\n  data-formflow-trigger-text="${triggerText}"\n  data-formflow-trigger-color="${triggerColor}"`
      : ''
  }
></div>`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailMessage);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSentSuccess(true);
    setTimeout(() => setEmailSentSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Embed or Share Form</h3>
              <p className="text-xs text-slate-500">
                Publish <span className="font-semibold text-slate-800">{formName}</span> across websites, apps, and email campaigns
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex items-center gap-6 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'embed'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Embed Code</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'share'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link & Social</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'email'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Invite</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: EMBED CODE & LAYOUT TYPES */}
          {activeTab === 'embed' && (
            <div className="space-y-6">
              {/* 1. Embed Layout Types */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  1. Embed Layout Types
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Inline */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('inline')}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      layoutMode === 'inline'
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Inline</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Embedded directly inside page content.
                    </div>
                  </button>

                  {/* Popup */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('popup')}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      layoutMode === 'popup'
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Popup</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Opens inside modal window overlay.
                    </div>
                  </button>

                  {/* Polite Slide-in */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('slide_in')}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      layoutMode === 'slide_in'
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                      <PanelRightClose className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Polite Slide-in</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Slides smoothly from corner edge.
                    </div>
                  </button>

                  {/* Sticky Sidebar */}
                  <button
                    type="button"
                    onClick={() => setLayoutMode('sticky')}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      layoutMode === 'sticky'
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold">Sticky Sidebar</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Trigger stays attached to screen side.
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Controls & Trigger Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {/* Trigger Type */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">Trigger Type</label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="triggerType"
                        checked={triggerType === 'always'}
                        onChange={() => setTriggerType('always')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Always Show</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="triggerType"
                        checked={triggerType === 'scroll'}
                        onChange={() => setTriggerType('scroll')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Show after scrolling</span>
                    </label>

                    {triggerType === 'scroll' && (
                      <div className="pl-6 flex items-center gap-2">
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={scrollPct}
                          onChange={(e) => setScrollPct(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <span className="text-xs text-slate-500">% of page</span>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="triggerType"
                        checked={triggerType === 'delay'}
                        onChange={() => setTriggerType('delay')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Show after delay</span>
                    </label>

                    {triggerType === 'delay' && (
                      <div className="pl-6 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={delaySec}
                          onChange={(e) => setDelaySec(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <span className="text-xs text-slate-500">seconds</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activation */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">Activation</label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="activationType"
                        checked={activationType === 'always'}
                        onChange={() => setActivationType('always')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Always activated</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="activationType"
                        checked={activationType === 'nth_visit'}
                        onChange={() => setActivationType('nth_visit')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Activate on visit count</span>
                    </label>

                    {activationType === 'nth_visit' && (
                      <div className="pl-6 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Visit #</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={nthVisit}
                          onChange={(e) => setNthVisit(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Deactivation */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">Deactivation</label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deactivationType"
                        checked={deactivationType === 'never'}
                        onChange={() => setDeactivationType('never')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Never deactivate</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deactivationType"
                        checked={deactivationType === 'max_displays'}
                        onChange={() => setDeactivationType('max_displays')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Deactivate after displays</span>
                    </label>

                    {deactivationType === 'max_displays' && (
                      <div className="pl-6 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={maxDisplays}
                          onChange={(e) => setMaxDisplays(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <span className="text-xs text-slate-500">times</span>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deactivationType"
                        checked={deactivationType === 'lead_collected'}
                        onChange={() => setDeactivationType('lead_collected')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-700">Deactivate once lead collected</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Position and Trigger Text for Non-Inline */}
              {layoutMode !== 'inline' && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Position Edge</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPosition('left')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          position === 'left'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Left Edge
                      </button>
                      <button
                        type="button"
                        onClick={() => setPosition('right')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          position === 'right'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Right Edge
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Trigger Button Label</label>
                    <input
                      type="text"
                      value={triggerText}
                      onChange={(e) => setTriggerText(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Trigger Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={triggerColor}
                        onChange={(e) => setTriggerColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={triggerColor}
                        onChange={(e) => setTriggerColor(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Embed Code Output Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Dynamic Installation Code
                  </label>

                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Embed Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-blue-300 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                    {generateEmbedCode()}
                  </pre>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Paste snippet anywhere inside your website's HTML body. FormFlow script dynamically handles iframe mounting and postMessage communication.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SHARE LINK & SOCIAL */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Copy Direct Link */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Direct Hosted Form URL</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Form</span>
                  </a>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Social Share Buttons</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 text-[#1877F2] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Fill out form: ${formName} - ${publicUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/20 text-[#0A66C2] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      publicUrl
                    )}&text=${encodeURIComponent(`Please take a minute to fill out: ${formName}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-slate-900/10 hover:bg-slate-900/20 border border-slate-900/20 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>X (Twitter)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL INVITE */}
          {activeTab === 'email' && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {emailSentSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Email invitation template prepared and dispatched!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="recipient@company.com"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Message Body</label>
                <textarea
                  rows={5}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email Invite</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied' : 'Copy Email Body'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Public Form ID: <strong className="font-mono text-slate-800">{formId}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
