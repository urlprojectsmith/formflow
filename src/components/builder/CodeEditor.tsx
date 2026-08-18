import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code,
  FileCode,
  Paintbrush,
  Terminal,
  Save,
  RotateCcw,
  Maximize2,
  Minimize2,
  Wand2,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Trash2,
  Layers,
  Sparkles,
  Eye,
  Lock,
} from 'lucide-react';
import { FormDefinition } from '../../types';
import {
  generateDefaultCustomHtml,
  generateDefaultCustomCss,
  generateDefaultCustomJs,
  formatCode,
  buildSandboxedIframeDoc,
} from '../../utils/codeEditorUtils';

interface CodeEditorProps {
  form: FormDefinition;
  onUpdateCustomCode: (codeUpdates: {
    customHtml?: string;
    customCss?: string;
    customJs?: string;
  }) => void;
  onUpdateRenderMode: (mode: 'visual' | 'custom') => void;
  onSaveNow: () => void;
}

type CodeTab = 'html' | 'css' | 'js';

interface ConsoleLogEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'event';
  level?: string;
  message: string;
  timestamp: string;
  eventName?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  form,
  onUpdateCustomCode,
  onUpdateRenderMode,
  onSaveNow,
}) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [htmlCode, setHtmlCode] = useState<string>(
    form.customHtml ?? generateDefaultCustomHtml(form)
  );
  const [cssCode, setCssCode] = useState<string>(
    form.customCss ?? generateDefaultCustomCss(form)
  );
  const [jsCode, setJsCode] = useState<string>(
    form.customJs ?? generateDefaultCustomJs(form)
  );

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showModeWarningModal, setShowModeWarningModal] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<'visual' | 'custom' | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'errors' | 'events'>('all');

  const [livePreviewDoc, setLivePreviewDoc] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Synchronize initial state if form prop updates from outside
  useEffect(() => {
    if (form.customHtml !== undefined && form.customHtml !== htmlCode) {
      setHtmlCode(form.customHtml || generateDefaultCustomHtml(form));
    }
    if (form.customCss !== undefined && form.customCss !== cssCode) {
      setCssCode(form.customCss || generateDefaultCustomCss(form));
    }
    if (form.customJs !== undefined && form.customJs !== jsCode) {
      setJsCode(form.customJs || generateDefaultCustomJs(form));
    }
  }, [form.id]);

  // Update live preview document when code changes
  useEffect(() => {
    const doc = buildSandboxedIframeDoc(htmlCode, cssCode, jsCode);
    setLivePreviewDoc(doc);
  }, [htmlCode, cssCode, jsCode]);

  // Safe PostMessage listener for Sandboxed Iframe console logs & events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'FORMFLOW_CONSOLE_LOG') {
        const { level, message, timestamp } = event.data;
        const entry: ConsoleLogEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log',
          level,
          message: message || '',
          timestamp: timestamp || new Date().toLocaleTimeString(),
        };
        setConsoleLogs((prev) => [entry, ...prev].slice(0, 100));
      } else if (event.data.type === 'FORMFLOW_EVENT') {
        const { eventName, payload } = event.data;
        const entry: ConsoleLogEntry = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'event',
          eventName,
          message: `Event [${eventName}]: ${
            payload ? JSON.stringify(payload) : 'no payload'
          }`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setConsoleLogs((prev) => [entry, ...prev].slice(0, 100));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Save changes
  const handleSave = () => {
    onUpdateCustomCode({
      customHtml: htmlCode,
      customCss: cssCode,
      customJs: jsCode,
    });
    onSaveNow();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Format Code
  const handleFormat = () => {
    if (activeTab === 'html') {
      setHtmlCode(formatCode(htmlCode, 'html'));
    } else if (activeTab === 'css') {
      setCssCode(formatCode(cssCode, 'css'));
    } else if (activeTab === 'js') {
      setJsCode(formatCode(jsCode, 'javascript'));
    }
  };

  // Reset to Boilerplate
  const handleReset = () => {
    if (
      window.confirm(
        'Reset custom code to initial template generated from current visual fields? Any unsaved edits will be discarded.'
      )
    ) {
      const defaultHtml = generateDefaultCustomHtml(form);
      const defaultCss = generateDefaultCustomCss(form);
      const defaultJs = generateDefaultCustomJs(form);

      setHtmlCode(defaultHtml);
      setCssCode(defaultCss);
      setJsCode(defaultJs);

      onUpdateCustomCode({
        customHtml: defaultHtml,
        customCss: defaultCss,
        customJs: defaultJs,
      });
    }
  };

  // Trigger Mode Change with Warning Modal
  const requestModeSwitch = (newMode: 'visual' | 'custom') => {
    if (form.renderMode === newMode) return;
    setPendingMode(newMode);
    setShowModeWarningModal(true);
  };

  const confirmModeSwitch = () => {
    if (pendingMode) {
      onUpdateRenderMode(pendingMode);
      // Ensure code is saved if entering custom mode
      if (pendingMode === 'custom') {
        onUpdateCustomCode({
          customHtml: htmlCode,
          customCss: cssCode,
          customJs: jsCode,
        });
      }
    }
    setShowModeWarningModal(false);
    setPendingMode(null);
  };

  const filteredLogs = consoleLogs.filter((log) => {
    if (logFilter === 'errors') return log.type === 'error';
    if (logFilter === 'events') return log.type === 'event';
    return true;
  });

  return (
    <div
      className={`flex-1 flex flex-col bg-slate-900 text-slate-100 font-sans antialiased overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* Top Controls Header Bar */}
      <div className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Code Tabs & Mode Status */}
        <div className="flex items-center gap-3">
          {/* Code Tab Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-colors ${
                activeTab === 'html'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>HTML</span>
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-colors ${
                activeTab === 'css'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5 text-sky-400" />
              <span>CSS</span>
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-colors ${
                activeTab === 'js'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-yellow-400" />
              <span>JavaScript</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Custom Code Mode Indicator Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Render Mode:</span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => requestModeSwitch('visual')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${
                  (form.renderMode || 'visual') === 'visual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Visual Builder
              </button>
              <button
                onClick={() => requestModeSwitch('custom')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${
                  form.renderMode === 'custom'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Code
              </button>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {saveToast && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Code Saved
            </span>
          )}

          <button
            onClick={handleFormat}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors"
            title="Auto-format code syntax"
          >
            <Wand2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Format</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors"
            title="Reset code to default template from visual schema"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-xs transition-colors"
            title="Save custom code modifications"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Code</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Code Workspace'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Split Body: Monaco Editor on Left, Live Preview + Console on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Monaco Code Editor */}
        <div className="w-1/2 flex flex-col border-r border-slate-800 relative bg-[#1e1e1e]">
          <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-blue-400" />
              <span>
                editing: {activeTab === 'html' ? 'customHtml.html' : activeTab === 'css' ? 'customCss.css' : 'customJs.js'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500">Monaco Syntax Editor</span>
          </div>

          <div className="flex-1 relative">
            {activeTab === 'html' && (
              <Editor
                height="100%"
                language="html"
                theme="vs-dark"
                value={htmlCode}
                onChange={(v) => setHtmlCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            )}

            {activeTab === 'css' && (
              <Editor
                height="100%"
                language="css"
                theme="vs-dark"
                value={cssCode}
                onChange={(v) => setCssCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            )}

            {activeTab === 'js' && (
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={jsCode}
                onChange={(v) => setJsCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            )}
          </div>
        </div>

        {/* Right Column: Sandboxed Live Preview (Top) & Runtime Console (Bottom) */}
        <div className="w-1/2 flex flex-col bg-slate-950 overflow-hidden">
          {/* Top Panel: Sandboxed Iframe Preview */}
          <div className="flex-1 flex flex-col border-b border-slate-800 relative bg-slate-900">
            <div className="h-8 px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sandboxed Live Preview</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Sandbox Isolated</span>
                </span>
              </div>
            </div>

            {/* Iframe Frame */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                sandbox="allow-scripts"
                srcDoc={livePreviewDoc}
                className="w-full h-full border-0 bg-white"
                title="FormFlow Sandboxed Preview"
              />
            </div>
          </div>

          {/* Bottom Panel: JavaScript Runtime Console & Event Logger */}
          <div className="h-48 flex flex-col bg-slate-950 shrink-0">
            {/* Console Header */}
            <div className="h-8 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-slate-300">Sandbox Runtime Console</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                  {consoleLogs.length} logs
                </span>
              </div>

              {/* Filter Toggles & Clear */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
                  <button
                    onClick={() => setLogFilter('all')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      logFilter === 'all'
                        ? 'bg-slate-800 text-slate-200'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setLogFilter('errors')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      logFilter === 'errors'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Errors
                  </button>
                  <button
                    onClick={() => setLogFilter('events')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      logFilter === 'events'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Events
                  </button>
                </div>

                <button
                  onClick={() => setConsoleLogs([])}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Clear console output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Console Log Stream */}
            <div className="flex-1 p-2 overflow-y-auto font-mono text-[11px] space-y-1 bg-slate-950">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                  <span>No console output or runtime errors captured.</span>
                  <span className="text-[10px] text-slate-700 mt-0.5">
                    User JS runtime errors and FormFlow events will stream here safely.
                  </span>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-1.5 rounded flex items-start justify-between gap-2 border ${
                      log.type === 'error'
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                        : log.type === 'warn'
                        ? 'bg-amber-950/40 border-amber-900/60 text-amber-300'
                        : log.type === 'event'
                        ? 'bg-purple-950/40 border-purple-900/60 text-purple-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      {log.type === 'error' && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      {log.type === 'warn' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      {log.type === 'event' && (
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      )}
                      {log.type === 'log' && (
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}

                      <span className="break-all whitespace-pre-wrap leading-relaxed">
                        {log.message}
                      </span>
                    </div>

                    <span className="text-[9px] text-slate-500 shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render Mode Switch Warning Modal */}
      {showModeWarningModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-950/60 rounded-lg border border-amber-800/80">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Switch Render Mode?
                </h3>
                <p className="text-xs text-slate-400">
                  Changing how your published form is rendered to users.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              {pendingMode === 'custom' ? (
                <p>
                  You are switching to <strong className="text-purple-400">Custom Code mode</strong>. The published form will render your custom HTML, CSS, and JS template instead of the visual canvas fields.
                </p>
              ) : (
                <p>
                  You are switching to <strong className="text-emerald-400">Visual Builder mode</strong>. The published form will render using the standard visual form field canvas schema.
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                Note: Switching modes will <strong>NOT</strong> delete your visual field schema or custom code. Both are preserved safely.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModeWarningModal(false);
                  setPendingMode(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModeSwitch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
