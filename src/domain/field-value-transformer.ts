/**
 * FieldValue Transformer Service
 *
 * Transforms $fieldValue objects in JSON data to Firestore FieldValue sentinels.
 * Supports: serverTimestamp, increment, arrayUnion, arrayRemove, delete
 */

import { FieldValue } from 'firebase-admin/firestore';
import { Result, ok, err } from '../shared/types';
import { t } from '../shared/i18n';

/**
 * FieldValue operation types
 */
export type FieldValueType =
  | 'serverTimestamp'
  | 'increment'
  | 'arrayUnion'
  | 'arrayRemove'
  | 'delete';

/**
 * Valid FieldValue types array for validation
 */
const VALID_FIELD_VALUE_TYPES: FieldValueType[] = [
  'serverTimestamp',
  'increment',
  'arrayUnion',
  'arrayRemove',
  'delete',
];

/**
 * $fieldValue object structure
 */
export interface FieldValueSpec {
  $fieldValue: FieldValueType;
  operand?: number;      // For increment
  elements?: unknown[];  // For arrayUnion/arrayRemove
}

/**
 * Transform error types
 */
export type FieldValueTransformError =
  | { type: 'INVALID_FIELD_VALUE_TYPE'; message: string; fieldPath: string; value: string }
  | { type: 'INVALID_OPERAND'; message: string; fieldPath: string; expected: string; actual: string }
  | { type: 'INVALID_ELEMENTS'; message: string; fieldPath: string }
  | { type: 'INVALID_FORMAT'; message: string; fieldPath: string };

/**
 * Maximum recursion depth for nested objects
 */
const MAX_RECURSION_DEPTH = 100;

/**
 * Check if a value is a $fieldValue specification
 */
export function isFieldValueSpec(value: unknown): value is FieldValueSpec {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (!('$fieldValue' in obj)) {
    return false;
  }
  if (typeof obj.$fieldValue !== 'string') {
    return false;
  }
  if (!VALID_FIELD_VALUE_TYPES.includes(obj.$fieldValue as FieldValueType)) {
    return false;
  }
  return true;
}

/**
 * FieldValue Transformer Service
 *
 * Transforms $fieldValue objects in JSON data to Firestore FieldValue sentinels.
 */
export class FieldValueTransformer {
  /**
   * Transform data containing $fieldValue objects to Firestore FieldValue sentinels
   * @param data The input data to transform
   * @returns Transformed data with FieldValue sentinels or an error
   */
  transform(data: Record<string, unknown>): Result<Record<string, unknown>, FieldValueTransformError> {
    return this.transformRecursive(data, '', 0);
  }

  /**
   * Recursively transform $fieldValue objects
   */
  private transformRecursive(
    data: Record<string, unknown>,
    parentPath: string,
    depth: number
  ): Result<Record<string, unknown>, FieldValueTransformError> {
    // Check recursion depth
    if (depth > MAX_RECURSION_DEPTH) {
      return err({
        type: 'INVALID_FORMAT',
        message: `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded`,
        fieldPath: parentPath || 'root',
      });
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;

      // Check if this is a $fieldValue specification
      if (isFieldValueSpec(value)) {
        const transformResult = this.transformFieldValue(value, fieldPath);
        if (transformResult.isErr()) {
          return err(transformResult.error);
        }
        result[key] = transformResult.value;
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively transform nested objects
        const nestedResult = this.transformRecursive(
          value as Record<string, unknown>,
          fieldPath,
          depth + 1
        );
        if (nestedResult.isErr()) {
          return err(nestedResult.error);
        }
        result[key] = nestedResult.value;
      } else if (Array.isArray(value)) {
        // Transform arrays (items may contain $fieldValue objects)
        const arrayResult = this.transformArray(value, fieldPath, depth + 1);
        if (arrayResult.isErr()) {
          return err(arrayResult.error);
        }
        result[key] = arrayResult.value;
      } else {
        // Preserve other values as-is
        result[key] = value;
      }
    }

    return ok(result);
  }

  /**
   * Transform array elements that may contain $fieldValue objects
   */
  private transformArray(
    arr: unknown[],
    parentPath: string,
    depth: number
  ): Result<unknown[], FieldValueTransformError> {
    const result: unknown[] = [];

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const itemPath = `${parentPath}[${i}]`;

      if (isFieldValueSpec(item)) {
        const transformResult = this.transformFieldValue(item, itemPath);
        if (transformResult.isErr()) {
          return err(transformResult.error);
        }
        result.push(transformResult.value);
      } else if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedResult = this.transformRecursive(
          item as Record<string, unknown>,
          itemPath,
          depth
        );
        if (nestedResult.isErr()) {
          return err(nestedResult.error);
        }
        result.push(nestedResult.value);
      } else if (Array.isArray(item)) {
        const nestedArrayResult = this.transformArray(item, itemPath, depth);
        if (nestedArrayResult.isErr()) {
          return err(nestedArrayResult.error);
        }
        result.push(nestedArrayResult.value);
      } else {
        result.push(item);
      }
    }

    return ok(result);
  }

  /**
   * Transform a single $fieldValue specification to a FieldValue sentinel
   */
  private transformFieldValue(
    spec: FieldValueSpec,
    fieldPath: string
  ): Result<FieldValue, FieldValueTransformError> {
    // Validate and transform based on the operation type
    // We do manual validation first to return specific error types
    switch (spec.$fieldValue) {
      case 'serverTimestamp':
        return ok(FieldValue.serverTimestamp());

      case 'increment': {
        // Validate operand first before Zod schema
        if (spec.operand === undefined || spec.operand === null || typeof spec.operand !== 'number') {
          return err({
            type: 'INVALID_OPERAND',
            message: `${t('err.fieldValue.atPath')} "${fieldPath}" ${t('err.fieldValue.invalidOperand')}`,
            fieldPath,
            expected: 'number',
            actual: spec.operand === undefined ? 'undefined' : spec.operand === null ? 'null' : typeof spec.operand,
          });
        }
        return ok(FieldValue.increment(spec.operand));
      }

      case 'arrayUnion': {
        // Validate elements first before Zod schema
        if (!Array.isArray(spec.elements)) {
          return err({
            type: 'INVALID_ELEMENTS',
            message: `${t('err.fieldValue.atPath')} "${fieldPath}" ${t('err.fieldValue.invalidElements')}`,
            fieldPath,
          });
        }
        return ok(FieldValue.arrayUnion(...spec.elements));
      }

      case 'arrayRemove': {
        // Validate elements first before Zod schema
        if (!Array.isArray(spec.elements)) {
          return err({
            type: 'INVALID_ELEMENTS',
            message: `${t('err.fieldValue.atPath')} "${fieldPath}" ${t('err.fieldValue.invalidElements')}`,
            fieldPath,
          });
        }
        return ok(FieldValue.arrayRemove(...spec.elements));
      }

      case 'delete':
        return ok(FieldValue.delete());

      default:
        return err({
          type: 'INVALID_FIELD_VALUE_TYPE',
          message: `${t('err.fieldValue.atPath')} "${fieldPath}" ${t('err.fieldValue.invalidType')} "${spec.$fieldValue}". ${t('err.fieldValue.validTypes')}`,
          fieldPath,
          value: String(spec.$fieldValue),
        });
    }
  }
}
