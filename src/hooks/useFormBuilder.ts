import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FormDefinition,
  FormField,
  FormLogicRule,
  FormPipelineAction,
  FieldType,
  FormSettings,
  FormTheme,
  ViewportMode,
  SaveStatus,
} from '../types';
import { apiService } from '../services/apiService';
import { createDefaultField, generateSafeFieldName, generateUniqueId } from '../utils/formBuilderUtils';

export function useFormBuilder(formId: string) {
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // History stacks for Undo / Redo
  const pastRef = useRef<FormDefinition[]>([]);
  const futureRef = useRef<FormDefinition[]>([]);
  const isUndoRedoActionRef = useRef<boolean>(false);

  // Autosave timer & request counter refs
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveRequestIdRef = useRef<number>(0);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function loadForm() {
      setLoading(true);
      try {
        const data = await apiService.getFormDefinition(formId);
        if (isMounted) {
          setForm(data);
          if (data.fields.length > 0) {
            setSelectedFieldId(data.fields[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load form definition', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadForm();
    return () => {
      isMounted = false;
    };
  }, [formId]);

  // Push current form state to history stack before mutation
  const pushHistory = useCallback((currentForm: FormDefinition) => {
    pastRef.current.push(JSON.parse(JSON.stringify(currentForm)));
    if (pastRef.current.length > 30) {
      pastRef.current.shift();
    }
    futureRef.current = [];
  }, []);

  // Debounced Autosave Trigger with race condition protection
  const triggerAutosave = useCallback(
    (formToSave: FormDefinition) => {
      setSaveStatus('unsaved');
      saveRequestIdRef.current += 1;
      const currentRequestId = saveRequestIdRef.current;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          setSaveStatus('saving');
          await apiService.saveFormDefinition(formToSave.id, formToSave);
          if (saveRequestIdRef.current === currentRequestId) {
            setSaveStatus('saved');
          }
        } catch (err) {
          console.error('Autosave failed', err);
          if (saveRequestIdRef.current === currentRequestId) {
            setSaveStatus('error');
          }
        }
      }, 800);
    },
    []
  );

  // State update wrapper
  const mutateForm = useCallback(
    (updater: (prev: FormDefinition) => FormDefinition) => {
      setForm((prev) => {
        if (!prev) return prev;
        if (!isUndoRedoActionRef.current) {
          pushHistory(prev);
        } else {
          isUndoRedoActionRef.current = false;
        }
        const updated = updater(prev);
        triggerAutosave(updated);
        return updated;
      });
    },
    [pushHistory, triggerAutosave]
  );

  // Undo Action
  const undo = useCallback(() => {
    if (pastRef.current.length === 0 || !form) return;
    const previous = pastRef.current.pop()!;
    futureRef.current.push(JSON.parse(JSON.stringify(form)));
    isUndoRedoActionRef.current = true;
    setForm(previous);
    if (selectedFieldId && !previous.fields.some((f) => f.id === selectedFieldId)) {
      setSelectedFieldId(previous.fields.length > 0 ? previous.fields[0].id : null);
    }
    triggerAutosave(previous);
  }, [form, selectedFieldId, triggerAutosave]);

  // Redo Action
  const redo = useCallback(() => {
    if (futureRef.current.length === 0 || !form) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push(JSON.parse(JSON.stringify(form)));
    isUndoRedoActionRef.current = true;
    setForm(next);
    if (selectedFieldId && !next.fields.some((f) => f.id === selectedFieldId)) {
      setSelectedFieldId(next.fields.length > 0 ? next.fields[0].id : null);
    }
    triggerAutosave(next);
  }, [form, selectedFieldId, triggerAutosave]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        // Ignore if user typing inside an input element
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Form Mutations
  const updateFormName = useCallback(
    (name: string) => {
      mutateForm((prev) => ({ ...prev, name }));
    },
    [mutateForm]
  );

  const addField = useCallback(
    (type: FieldType, targetIndex?: number) => {
      mutateForm((prev) => {
        const newField = createDefaultField(type, prev.fields);
        const fields = [...prev.fields];
        if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= fields.length) {
          fields.splice(targetIndex, 0, newField);
        } else {
          fields.push(newField);
        }
        setSelectedFieldId(newField.id);
        return { ...prev, fields };
      });
    },
    [mutateForm]
  );

  const reorderFields = useCallback(
    (startIndex: number, endIndex: number) => {
      mutateForm((prev) => {
        const fields = [...prev.fields];
        const [removed] = fields.splice(startIndex, 1);
        fields.splice(endIndex, 0, removed);
        return { ...prev, fields };
      });
    },
    [mutateForm]
  );

  const duplicateField = useCallback(
    (fieldId: string) => {
      mutateForm((prev) => {
        const index = prev.fields.findIndex((f) => f.id === fieldId);
        if (index === -1) return prev;
        const original = prev.fields[index];
        const newFieldId = generateUniqueId('f');
        const duplicatedOptions = original.options
          ? original.options.map((o) => ({
              ...o,
              id: generateUniqueId('opt'),
            }))
          : undefined;

        const duplicated: FormField = {
          ...JSON.parse(JSON.stringify(original)),
          id: newFieldId,
          label: `${original.label} (Copy)`,
          name: generateSafeFieldName(`${original.label}_copy`, prev.fields),
          options: duplicatedOptions,
        };
        const fields = [...prev.fields];
        fields.splice(index + 1, 0, duplicated);
        setSelectedFieldId(newFieldId);
        return { ...prev, fields };
      });
    },
    [mutateForm]
  );

  const deleteField = useCallback(
    (fieldId: string) => {
      if (form) {
        const index = form.fields.findIndex((f) => f.id === fieldId);
        const remaining = form.fields.filter((f) => f.id !== fieldId);
        if (selectedFieldId === fieldId) {
          if (remaining.length === 0) {
            setSelectedFieldId(null);
          } else {
            const nextIdx = Math.min(index, remaining.length - 1);
            setSelectedFieldId(remaining[nextIdx].id);
          }
        }
      }
      mutateForm((prev) => {
        const fields = prev.fields.filter((f) => f.id !== fieldId);
        return { ...prev, fields };
      });
    },
    [form, mutateForm, selectedFieldId]
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      mutateForm((prev) => {
        const fields = prev.fields.map((f) => {
          if (f.id !== fieldId) return f;
          const updated = { ...f, ...updates };

          // If label changed without explicit name override
          if (updates.label !== undefined && updates.name === undefined) {
            const oldAutoSlug = f.label
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s_-]/g, '')
              .replace(/[\s-]+/g, '_')
              .replace(/^_+|_+$/g, '');

            // Only auto-update name if name was not custom overridden
            if (!f.name || f.name.startsWith(oldAutoSlug) || f.name === 'field') {
              updated.name = generateSafeFieldName(updates.label, prev.fields, fieldId);
            }
          }

          return updated;
        });
        return { ...prev, fields };
      });
    },
    [mutateForm]
  );

  const updateFormDescription = useCallback(
    (description: string) => {
      mutateForm((prev) => ({ ...prev, description }));
    },
    [mutateForm]
  );

  const updateFormSettings = useCallback(
    (settingsUpdates: Partial<FormSettings>) => {
      mutateForm((prev) => ({
        ...prev,
        settings: { ...(prev.settings || {}), ...settingsUpdates },
      }));
    },
    [mutateForm]
  );

  const updateFormTheme = useCallback(
    (themeUpdates: Partial<FormTheme>) => {
      mutateForm((prev) => ({
        ...prev,
        theme: { ...(prev.theme || {}), ...themeUpdates },
      }));
    },
    [mutateForm]
  );

  const updateFormRenderMode = useCallback(
    (renderMode: 'visual' | 'custom') => {
      mutateForm((prev) => ({ ...prev, renderMode }));
    },
    [mutateForm]
  );

  const updateCustomCode = useCallback(
    (codeUpdates: { customHtml?: string; customCss?: string; customJs?: string }) => {
      mutateForm((prev) => ({
        ...prev,
        ...codeUpdates,
      }));
    },
    [mutateForm]
  );

  const updateLogicRules = useCallback(
    (rules: FormLogicRule[]) => {
      mutateForm((prev) => ({
        ...prev,
        logicRules: rules,
      }));
    },
    [mutateForm]
  );

  const updateActionsPipeline = useCallback(
    (actionsPipeline: FormPipelineAction[]) => {
      mutateForm((prev) => ({
        ...prev,
        actionsPipeline,
      }));
    },
    [mutateForm]
  );

  const saveFormNow = useCallback(async () => {
    if (!form) return;
    setSaveStatus('saving');
    try {
      const updated = await apiService.saveFormDefinition(form.id, form);
      setForm((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  }, [form]);

  const publishForm = useCallback(async () => {
    if (!form) return null;
    setSaveStatus('saving');
    try {
      // First ensure draft is saved
      await apiService.saveFormDefinition(form.id, form);
      const { publishedVersion, formDef } = await apiService.publishFormVersion(form.id, form.version);
      setForm(formDef);
      setSaveStatus('saved');
      return publishedVersion;
    } catch (err) {
      setSaveStatus('error');
      throw err;
    }
  }, [form]);

  return {
    form,
    loading,
    selectedFieldId,
    viewport,
    isPreview,
    saveStatus,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
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
  };
}
