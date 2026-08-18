import {
  FormField,
  FormLogicRule,
  ConditionItem,
  RuleActionItem,
  ConditionOperator,
  RuleActionType,
} from '../types/formBuilder';

export interface FieldRuntimeState {
  fieldId: string;
  fieldName: string;
  hidden: boolean;
  required: boolean;
  disabled: boolean;
}

export interface RuleEngineResult {
  fieldStates: Record<string, FieldRuntimeState>; // Keyed by field.id and field.name
  triggeredRuleIds: string[];
  invalidRules: {
    ruleId: string;
    ruleName: string;
    missingFieldIds: string[];
    reason: string;
  }[];
}

/**
 * Normalizes field value for evaluation
 */
function getFieldValue(field: FormField, formData: Record<string, any>): any {
  // Try by field.id or field.name
  if (formData[field.id] !== undefined) return formData[field.id];
  if (formData[field.name] !== undefined) return formData[field.name];
  return undefined;
}

/**
 * Deterministically evaluates a single condition against form data
 */
export function evaluateCondition(
  condition: ConditionItem,
  fields: FormField[],
  formData: Record<string, any>
): boolean {
  const sourceField = fields.find(
    (f) => f.id === condition.fieldId || f.name === condition.fieldId
  );
  if (!sourceField) return false;

  const rawVal = getFieldValue(sourceField, formData);
  const targetVal = (condition.value || '').trim();

  // Helper for empty check
  const isEmpty = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    return false;
  };

  const op = condition.operator;

  switch (op) {
    case 'is_empty':
      return isEmpty(rawVal);

    case 'is_not_empty':
      return !isEmpty(rawVal);

    case 'equals': {
      if (isEmpty(rawVal)) return targetVal === '';
      if (Array.isArray(rawVal)) {
        return (
          rawVal.length === 1 &&
          String(rawVal[0]).trim().toLowerCase() === targetVal.toLowerCase()
        );
      }
      return String(rawVal).trim().toLowerCase() === targetVal.toLowerCase();
    }

    case 'not_equals': {
      if (isEmpty(rawVal)) return targetVal !== '';
      if (Array.isArray(rawVal)) {
        return !(
          rawVal.length === 1 &&
          String(rawVal[0]).trim().toLowerCase() === targetVal.toLowerCase()
        );
      }
      return String(rawVal).trim().toLowerCase() !== targetVal.toLowerCase();
    }

    case 'contains': {
      if (isEmpty(rawVal)) return false;
      if (Array.isArray(rawVal)) {
        return rawVal.some(
          (item) => String(item).trim().toLowerCase() === targetVal.toLowerCase()
        );
      }
      return String(rawVal).toLowerCase().includes(targetVal.toLowerCase());
    }

    case 'does_not_contain': {
      if (isEmpty(rawVal)) return true;
      if (Array.isArray(rawVal)) {
        return !rawVal.some(
          (item) => String(item).trim().toLowerCase() === targetVal.toLowerCase()
        );
      }
      return !String(rawVal).toLowerCase().includes(targetVal.toLowerCase());
    }

    case 'greater_than': {
      if (isEmpty(rawVal)) return false;
      const numVal = Number(rawVal);
      const numTarget = Number(targetVal);
      if (isNaN(numVal) || isNaN(numTarget)) return false;
      return numVal > numTarget;
    }

    case 'less_than': {
      if (isEmpty(rawVal)) return false;
      const numVal = Number(rawVal);
      const numTarget = Number(targetVal);
      if (isNaN(numVal) || isNaN(numTarget)) return false;
      return numVal < numTarget;
    }

    case 'in': {
      if (isEmpty(rawVal)) return false;
      const allowedList = targetVal
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const strVal = String(rawVal).trim().toLowerCase();
      return allowedList.includes(strVal);
    }

    case 'not_in': {
      if (isEmpty(rawVal)) return true;
      const disallowedList = targetVal
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const strVal = String(rawVal).trim().toLowerCase();
      return !disallowedList.includes(strVal);
    }

    default:
      return false;
  }
}

/**
 * Validates whether logic rules reference existing fields.
 */
export function detectInvalidLogicRules(
  fields: FormField[],
  rules: FormLogicRule[] = []
): {
  ruleId: string;
  ruleName: string;
  missingFieldIds: string[];
  reason: string;
}[] {
  const existingIds = new Set<string>();
  fields.forEach((f) => {
    existingIds.add(f.id);
    existingIds.add(f.name);
  });

  const invalidList: {
    ruleId: string;
    ruleName: string;
    missingFieldIds: string[];
    reason: string;
  }[] = [];

  for (const rule of rules) {
    const missing: string[] = [];

    for (const cond of rule.conditions) {
      if (!existingIds.has(cond.fieldId)) {
        missing.push(cond.fieldId);
      }
    }

    for (const act of rule.actions) {
      if (!existingIds.has(act.targetFieldId)) {
        missing.push(act.targetFieldId);
      }
    }

    if (missing.length > 0) {
      const uniqueMissing = Array.from(new Set(missing));
      invalidList.push({
        ruleId: rule.id,
        ruleName: rule.name || 'Untitled Rule',
        missingFieldIds: uniqueMissing,
        reason: `References non-existent field ID(s): ${uniqueMissing.join(', ')}`,
      });
    }
  }

  return invalidList;
}

/**
 * Evaluates all logic rules deterministically against current fields and form values
 */
export function evaluateFormLogic(
  fields: FormField[],
  rules: FormLogicRule[] = [],
  formData: Record<string, any> = {}
): RuleEngineResult {
  // Initialize base field states
  const fieldStates: Record<string, FieldRuntimeState> = {};

  fields.forEach((f) => {
    const baseState: FieldRuntimeState = {
      fieldId: f.id,
      fieldName: f.name,
      hidden: !!f.hidden,
      required: !!f.required,
      disabled: !!f.disabled,
    };
    fieldStates[f.id] = baseState;
    fieldStates[f.name] = baseState;
  });

  const invalidRules = detectInvalidLogicRules(fields, rules);
  const triggeredRuleIds: string[] = [];

  // Track which fields have active "show" rules targeting them
  const fieldsTargetedByShowRule = new Set<string>();
  const fieldsWithTriggeredShowRule = new Set<string>();

  rules.forEach((rule) => {
    if (rule.enabled === false) return;

    // Register show rules
    rule.actions.forEach((act) => {
      if (act.action === 'show') {
        fieldsTargetedByShowRule.add(act.targetFieldId);
      }
    });

    if (!rule.conditions || rule.conditions.length === 0) return;

    // Evaluate conditions
    let ruleMatched = false;
    if (rule.matchType === 'ALL') {
      ruleMatched = rule.conditions.every((cond) =>
        evaluateCondition(cond, fields, formData)
      );
    } else {
      // ANY
      ruleMatched = rule.conditions.some((cond) =>
        evaluateCondition(cond, fields, formData)
      );
    }

    if (ruleMatched) {
      triggeredRuleIds.push(rule.id);

      // Apply actions
      rule.actions.forEach((act) => {
        const targetField = fields.find(
          (f) => f.id === act.targetFieldId || f.name === act.targetFieldId
        );
        if (!targetField) return;

        const stateByKey = fieldStates[targetField.id];
        if (!stateByKey) return;

        switch (act.action) {
          case 'show':
            stateByKey.hidden = false;
            fieldsWithTriggeredShowRule.add(targetField.id);
            fieldsWithTriggeredShowRule.add(targetField.name);
            break;

          case 'hide':
            stateByKey.hidden = true;
            break;

          case 'require':
            stateByKey.required = true;
            break;

          case 'optional':
            stateByKey.required = false;
            break;

          case 'enable':
            stateByKey.disabled = false;
            break;

          case 'disable':
            stateByKey.disabled = true;
            break;
        }
      });
    }
  });

  // Handle fields targeted by 'show' rules whose conditions are NOT triggered:
  // If a field has a 'show' rule, but NO 'show' rule targeting it was triggered, hide it.
  fieldsTargetedByShowRule.forEach((targetId) => {
    const targetField = fields.find(
      (f) => f.id === targetId || f.name === targetId
    );
    if (targetField) {
      const stateByKey = fieldStates[targetField.id];
      if (stateByKey && !fieldsWithTriggeredShowRule.has(targetField.id)) {
        stateByKey.hidden = true;
      }
    }
  });

  return {
    fieldStates,
    triggeredRuleIds,
    invalidRules,
  };
}
