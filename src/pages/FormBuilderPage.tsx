import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useFormBuilder } from '../hooks/useFormBuilder';
import { BuilderTopBar } from '../components/builder/BuilderTopBar';
import { FieldLibrary } from '../components/builder/FieldLibrary';
import { FormCanvas } from '../components/builder/FormCanvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { FormPreviewModal } from '../components/builder/FormPreviewModal';
import { CodeEditor } from '../components/builder/CodeEditor';
import { FormLogicEditor } from '../components/builder/FormLogicEditor';
import { FormActionEditor } from '../components/builder/FormActionEditor';
import { FormEmbedModal } from '../components/builder/FormEmbedModal';

export const FormBuilderPage: React.FC = () => {
  const { id = 'new' } = useParams<{ id: string }>();
  const [activeSection, setActiveSection] = useState<'visual' | 'code' | 'logic' | 'actions'>('visual');
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<boolean>(false);

  const {
    form,
    loading,
    selectedFieldId,
    viewport,
    isPreview,
    saveStatus,
    canUndo,
    canRedo,
    setSelectedFieldId,
    setViewport,
    setIsPreview,
    updateFormName,
    updateFormDescription,
    updateFormSettings,
    updateFormTheme,
    updateFormRenderMode,
    updateCustomCode,
    updateLogicRules,
    updateActionsPipeline,
    addField,
    reorderFields,
    duplicateField,
    deleteField,
    updateField,
    undo,
    redo,
    saveFormNow,
    publishForm,
  } = useFormBuilder(id);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Loading Form Canvas & Schema...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Form Not Found</h2>
        <p className="text-xs text-slate-500">The requested form canvas definition could not be loaded.</p>
        <Link
          to="/forms"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Forms Directory</span>
        </Link>
      </div>
    );
  }

  const selectedField = form.fields.find((f) => f.id === selectedFieldId) || null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 font-sans antialiased">
      {/* Builder Top Bar */}
      <BuilderTopBar
        formId={form.id}
        formName={form.name}
        version={form.version}
        publishedVersion={form.publishedVersion}
        saveStatus={saveStatus}
        viewport={viewport}
        isPreview={isPreview}
        canUndo={canUndo}
        canRedo={canRedo}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onUpdateFormName={updateFormName}
        onSetViewport={setViewport}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onUndo={undo}
        onRedo={redo}
        onSaveNow={saveFormNow}
        onPublish={publishForm}
        onOpenEmbed={() => setIsEmbedModalOpen(true)}
      />

      {/* Embed or Share Form Modal */}
      {isEmbedModalOpen && (
        <FormEmbedModal
          formId={form.id}
          formName={form.name}
          onClose={() => setIsEmbedModalOpen(false)}
        />
      )}

      {/* Main Builder Area: Preview Modal, Code Editor, or Visual 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {isPreview ? (
          <FormPreviewModal
            form={form}
            viewport={viewport}
            onSetViewport={setViewport}
            onClose={() => setIsPreview(false)}
          />
        ) : activeSection === 'code' ? (
          <CodeEditor
            form={form}
            onUpdateCustomCode={updateCustomCode}
            onUpdateRenderMode={updateFormRenderMode}
            onSaveNow={saveFormNow}
          />
        ) : activeSection === 'logic' ? (
          <FormLogicEditor
            fields={form.fields}
            rules={form.logicRules || []}
            onChangeRules={updateLogicRules}
          />
        ) : activeSection === 'actions' ? (
          <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
            <FormActionEditor
              fields={form.fields}
              actionsPipeline={form.actionsPipeline || []}
              onUpdateActionsPipeline={updateActionsPipeline}
            />
          </div>
        ) : (
          <>
            {/* Left: Field Library */}
            <FieldLibrary onAddField={(type) => addField(type)} />

            {/* Center: Form Canvas */}
            <FormCanvas
              form={form}
              selectedFieldId={selectedFieldId}
              viewport={viewport}
              onSelectField={setSelectedFieldId}
              onAddField={addField}
              onReorderFields={reorderFields}
              onDuplicateField={duplicateField}
              onDeleteField={deleteField}
            />

            {/* Right: Properties Panel */}
            <PropertiesPanel
              form={form}
              selectedField={selectedField}
              onUpdateField={updateField}
              onUpdateFormName={updateFormName}
              onUpdateFormDescription={updateFormDescription}
              onUpdateFormSettings={updateFormSettings}
              onUpdateFormTheme={updateFormTheme}
              onClosePanel={() => setSelectedFieldId(null)}
            />
          </>
        )}
      </div>
    </div>
  );
};
