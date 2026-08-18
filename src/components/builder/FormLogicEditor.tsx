import React, { useState } from 'react';
import {
  FormDefinition,
  FormLogicRule,
  ConditionItem,
  RuleActionItem,
  ConditionOperator,
  RuleActionType,
  FormField,
} from '../../types';
import {
  evaluateFormLogic,
  detectInvalidLogicRules,
  RuleEngineResult,
} from '../../utils/ruleEngine';
import { generateUniqueId } from '../../utils/formBuilderUtils';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Asterisk,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from 'lucide-react';

interface FormLogicEditorProps {
  definition: FormDefinition;
  onChangeRules: (rules: FormLogicRule[]) => void;
}

const CONDITION_OPERATORS: { label: string; value: ConditionOperator; needsValue: boolean }[] = [
  { label: 'equals', value: 'equals', needsValue: true },
  { label: 'not equals', value: 'not_equals', needsValue: true },
  { label: 'contains', value: 'contains', needsValue: true },
  { label: 'does not contain', value: 'does_not_contain', needsValue: true },
  { label: 'greater than', value: 'greater_than', needsValue: true },
  { label: 'less than', value: 'less_than', needsValue: true },
  { label: 'is empty', value: 'is_empty', needsValue: false },
  { label: 'is not empty', value: 'is_not_empty', needsValue: false },
  { label: 'in (comma-separated list)', value: 'in', needsValue: true },
  { label: 'not in (comma-separated list)', value: 'not_in', needsValue: true },
];

const ACTION_TYPES: { label: string; value: RuleActionType; icon: React.ReactNode }[] = [
  { label: 'Show Field', value: 'show', icon: <Eye className="w-3.5 h-3.5 text-emerald-600" /> },
  { label: 'Hide Field', value: 'hide', icon: <EyeOff className="w-3.5 h-3.5 text-rose-500" /> },
  { label: 'Require Field', value: 'require', icon: <Asterisk className="w-3.5 h-3.5 text-amber-500" /> },
  { label: 'Make Optional', value: 'optional', icon: <Info className="w-3.5 h-3.5 text-slate-400" /> },
  { label: 'Enable Field', value: 'enable', icon: <Unlock className="w-3.5 h-3.5 text-blue-600" /> },
  { label: 'Disable Field', value: 'disable', icon: <Lock className="w-3.5 h-3.5 text-slate-500" /> },
];

export const FormLogicEditor: React.FC<FormLogicEditorProps> = ({
  definition,
  onChangeRules,
}) => {
  const rules = definition.logicRules || [];
  const fields = definition.fields || [];

  // Filter out static layout elements for condition targets
  const inputFields = fields.filter(
    (f) => !['heading', 'paragraph', 'divider', 'image', 'html', 'submit'].includes(f.type)
  );

  const [expandedRuleIds, setExpandedRuleIds] = useState<Record<string, boolean>>({});

  // Simulator test inputs state
  const [testValues, setTestValues] = useState<Record<string, any>>({});
  const [simulationRun, setSimulationRun] = useState<boolean>(false);

  // Check for invalid rules referencing deleted fields
  const invalidRuleWarnings = detectInvalidLogicRules(fields, rules);

  const toggleExpandRule = (id: string) => {
    setExpandedRuleIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddRule = () => {
    const defaultField = inputFields[0] || fields[0];
    const targetField = inputFields[1] || inputFields[0] || fields[0];

    const newRule: FormLogicRule = {
      id: `rule_${generateUniqueId()}`,
      name: `Logic Rule #${rules.length + 1}`,
      enabled: true,
      matchType: 'ALL',
      conditions: [
        {
          id: `cond_${generateUniqueId()}`,
          fieldId: defaultField ? defaultField.id : '',
          operator: 'equals',
          value: '',
        },
      ],
      actions: [
        {
          id: `act_${generateUniqueId()}`,
          targetFieldId: targetField ? targetField.id : '',
          action: 'show',
        },
      ],
    };

    const nextRules = [...rules, newRule];
    onChangeRules(nextRules);
    setExpandedRuleIds((prev) => ({ ...prev, [newRule.id]: true }));
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<FormLogicRule>) => {
    const nextRules = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    onChangeRules(nextRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    const nextRules = rules.filter((r) => r.id !== ruleId);
    onChangeRules(nextRules);
  };

  // Conditions modification
  const handleAddCondition = (ruleId: string) => {
    const defaultField = inputFields[0] || fields[0];
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const newCond: ConditionItem = {
      id: `cond_${generateUniqueId()}`,
      fieldId: defaultField ? defaultField.id : '',
      operator: 'equals',
      value: '',
    };

    handleUpdateRule(ruleId, {
      conditions: [...rule.conditions, newCond],
    });
  };

  const handleUpdateCondition = (
    ruleId: string,
    condId: string,
    updates: Partial<ConditionItem>
  ) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const nextConditions = rule.conditions.map((c) =>
      c.id === condId ? { ...c, ...updates } : c
    );
    handleUpdateRule(ruleId, { conditions: nextConditions });
  };

  const handleDeleteCondition = (ruleId: string, condId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const nextConditions = rule.conditions.filter((c) => c.id !== condId);
    handleUpdateRule(ruleId, { conditions: nextConditions });
  };

  // Actions modification
  const handleAddAction = (ruleId: string) => {
    const defaultTarget = inputFields[1] || inputFields[0] || fields[0];
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const newAct: RuleActionItem = {
      id: `act_${generateUniqueId()}`,
      targetFieldId: defaultTarget ? defaultTarget.id : '',
      action: 'show',
    };

    handleUpdateRule(ruleId, {
      actions: [...rule.actions, newAct],
    });
  };

  const handleUpdateAction = (
    ruleId: string,
    actId: string,
    updates: Partial<RuleActionItem>
  ) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const nextActions = rule.actions.map((a) =>
      a.id === actId ? { ...a, ...updates } : a
    );
    handleUpdateRule(ruleId, { actions: nextActions });
  };

  const handleDeleteAction = (ruleId: string, actId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const nextActions = rule.actions.filter((a) => a.id !== actId);
    handleUpdateRule(ruleId, { actions: nextActions });
  };

  // Simulator evaluation
  const simulationResults: RuleEngineResult = evaluateFormLogic(
    fields,
    rules,
    testValues
  );

  const handleRunSimulation = () => {
    setSimulationRun(true);
  };

  const handleResetSimulation = () => {
    setTestValues({});
    setSimulationRun(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Conditional Form Logic</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Rule-Based Field Behavior
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Create deterministic IF / THEN rules to show, hide, require, or disable fields based on user answers. Rules are evaluated in real-time without external code execution.
          </p>
        </div>

        <button
          onClick={handleAddRule}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Logic Rule</span>
        </button>
      </div>

      {/* Invalid Rule Warnings Banner */}
      {invalidRuleWarnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Warning: Invalid Logic Rules Detected</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            The following rules reference fields that have been deleted or renamed in the form builder:
          </p>
          <ul className="space-y-1 pl-5 list-disc text-xs text-amber-900">
            {invalidRuleWarnings.map((warn) => (
              <li key={warn.ruleId}>
                <strong>{warn.ruleName}</strong>: {warn.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Configured Logic Rules ({rules.length})</span>
          </h3>
        </div>

        {rules.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Sliders className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Logic Rules Added Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add rules to create dynamic branch logic (e.g., IF Country equals India THEN Show State).
            </p>
            <button
              onClick={handleAddRule}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Rule</span>
            </button>
          </div>
        ) : (
          rules.map((rule, idx) => {
            const isExpanded = expandedRuleIds[rule.id] ?? true;
            const isInvalid = invalidRuleWarnings.some((w) => w.ruleId === rule.id);

            return (
              <div
                key={rule.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isInvalid
                    ? 'border-amber-300 shadow-2xs'
                    : rule.enabled
                    ? 'border-slate-200 shadow-2xs'
                    : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 flex items-center justify-between gap-3 bg-slate-50/70 rounded-t-2xl border-b border-slate-200/80">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) =>
                        handleUpdateRule(rule.id, { name: e.target.value })
                      }
                      placeholder="Rule Name..."
                      className="text-xs font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white px-2 py-1 border border-transparent focus:border-blue-500 rounded-md transition-colors flex-1 max-w-xs focus:outline-none"
                    />

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                        IF {rule.matchType} ({rule.conditions.length})
                      </span>
                      <span>→</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        THEN ({rule.actions.length} action{rule.actions.length === 1 ? '' : 's'})
                      </span>
                    </div>

                    {isInvalid && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Invalid Field Ref
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Enable / Disable toggle */}
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled !== false}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { enabled: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>Active</span>
                    </label>

                    <button
                      onClick={() => toggleExpandRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title={isExpanded ? 'Collapse Rule' : 'Expand Rule'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded && (
                  <div className="p-5 space-y-6">
                    {/* Match Type Group */}
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Condition Grouping:
                      </span>
                      <div className="flex items-center gap-3 font-medium">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-semibold">
                          <input
                            type="radio"
                            name={`matchType_${rule.id}`}
                            value="ALL"
                            checked={rule.matchType === 'ALL'}
                            onChange={() => handleUpdateRule(rule.id, { matchType: 'ALL' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Match ALL conditions (AND)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 font-semibold">
                          <input
                            type="radio"
                            name={`matchType_${rule.id}`}
                            value="ANY"
                            checked={rule.matchType === 'ANY'}
                            onChange={() => handleUpdateRule(rule.id, { matchType: 'ANY' })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Match ANY condition (OR)</span>
                        </label>
                      </div>
                    </div>

                    {/* IF Conditions List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-extrabold">
                            IF
                          </span>
                          <span>Conditions</span>
                        </span>
                        <button
                          onClick={() => handleAddCondition(rule.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Condition</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {rule.conditions.map((cond, cIdx) => {
                          const selectedOp = CONDITION_OPERATORS.find(
                            (o) => o.value === cond.operator
                          );
                          const needsVal = selectedOp ? selectedOp.needsValue : true;

                          return (
                            <div
                              key={cond.id}
                              className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              {cIdx > 0 && (
                                <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mr-1">
                                  {rule.matchType === 'ALL' ? 'AND' : 'OR'}
                                </span>
                              )}

                              {/* Source Field Select */}
                              <select
                                value={cond.fieldId}
                                onChange={(e) =>
                                  handleUpdateCondition(rule.id, cond.id, {
                                    fieldId: e.target.value,
                                  })
                                }
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500 min-w-[160px]"
                              >
                                <option value="" disabled>
                                  -- Select Field --
                                </option>
                                {inputFields.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.label} ({f.name})
                                  </option>
                                ))}
                              </select>

                              {/* Operator Select */}
                              <select
                                value={cond.operator}
                                onChange={(e) =>
                                  handleUpdateCondition(rule.id, cond.id, {
                                    operator: e.target.value as ConditionOperator,
                                  })
                                }
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                              >
                                {CONDITION_OPERATORS.map((op) => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>

                              {/* Target Value Input */}
                              {needsVal && (
                                <input
                                  type="text"
                                  placeholder="Expected value..."
                                  value={cond.value || ''}
                                  onChange={(e) =>
                                    handleUpdateCondition(rule.id, cond.id, {
                                      value: e.target.value,
                                    })
                                  }
                                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-blue-500 flex-1 min-w-[140px]"
                                />
                              )}

                              {/* Delete Condition */}
                              <button
                                onClick={() => handleDeleteCondition(rule.id, cond.id)}
                                disabled={rule.conditions.length <= 1}
                                className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors ml-auto"
                                title="Remove condition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* THEN Actions List */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">
                            THEN
                          </span>
                          <span>Actions</span>
                        </span>
                        <button
                          onClick={() => handleAddAction(rule.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Action</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {rule.actions.map((act) => {
                          const actionDef = ACTION_TYPES.find((a) => a.value === act.action);

                          return (
                            <div
                              key={act.id}
                              className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-1.5 min-w-[140px]">
                                {actionDef?.icon}
                                <select
                                  value={act.action}
                                  onChange={(e) =>
                                    handleUpdateAction(rule.id, act.id, {
                                      action: e.target.value as RuleActionType,
                                    })
                                  }
                                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                                >
                                  {ACTION_TYPES.map((a) => (
                                    <option key={a.value} value={a.value}>
                                      {a.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <span className="text-slate-500 font-semibold text-[11px]">
                                Field:
                              </span>

                              {/* Target Field Select */}
                              <select
                                value={act.targetFieldId}
                                onChange={(e) =>
                                  handleUpdateAction(rule.id, act.id, {
                                    targetFieldId: e.target.value,
                                  })
                                }
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500 flex-1 min-w-[180px]"
                              >
                                <option value="" disabled>
                                  -- Select Target Field --
                                </option>
                                {inputFields.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.label} ({f.name})
                                  </option>
                                ))}
                              </select>

                              {/* Delete Action */}
                              <button
                                onClick={() => handleDeleteAction(rule.id, act.id)}
                                disabled={rule.actions.length <= 1}
                                className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors ml-auto"
                                title="Remove action"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Rule Simulator Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Rule Simulator</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Test Logic & Observe Runtime State
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter sample values below to verify how fields dynamically change visibility, requirement, and enabled status.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Values</span>
            </button>
            <button
              onClick={handleRunSimulation}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Rules</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid for Test Values */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Test Input Values
          </h4>

          {inputFields.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No input fields in form to simulate.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inputFields.map((f) => {
                const val = testValues[f.name] ?? testValues[f.id] ?? '';

                return (
                  <div key={f.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 truncate">
                      {f.label} <span className="font-mono text-slate-400 font-normal">({f.name})</span>
                    </label>

                    {f.type === 'select' || f.type === 'radio' ? (
                      <select
                        value={val}
                        onChange={(e) =>
                          setTestValues((prev) => ({
                            ...prev,
                            [f.name]: e.target.value,
                            [f.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                      >
                        <option value="">-- Select Option --</option>
                        {f.options?.map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={`Enter ${f.label}...`}
                        value={val}
                        onChange={(e) =>
                          setTestValues((prev) => ({
                            ...prev,
                            [f.name]: e.target.value,
                            [f.id]: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Simulation Output Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Evaluation Result Matrix
            </h4>
            {simulationResults.triggeredRuleIds.length > 0 ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Triggered ({simulationResults.triggeredRuleIds.length} rule{simulationResults.triggeredRuleIds.length === 1 ? '' : 's'})
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full border border-slate-200">
                No rules triggered
              </span>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Field Label</th>
                  <th className="py-2.5 px-4">Visibility</th>
                  <th className="py-2.5 px-4">Requirement</th>
                  <th className="py-2.5 px-4">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inputFields.map((f) => {
                  const runtime = simulationResults.fieldStates[f.id] ||
                    simulationResults.fieldStates[f.name] || {
                      hidden: !!f.hidden,
                      required: !!f.required,
                      disabled: !!f.disabled,
                    };

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        runtime.hidden ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{f.label}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal">
                            ({f.name})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {runtime.hidden ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <EyeOff className="w-3 h-3 text-rose-600" />
                            Hidden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Eye className="w-3 h-3 text-emerald-600" />
                            Visible
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {runtime.required ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <Asterisk className="w-3 h-3 text-amber-600" />
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Optional
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {runtime.disabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            <Unlock className="w-3 h-3 text-blue-600" />
                            Enabled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
