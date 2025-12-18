/**
 * Shared types used across the application
 */

// Re-export Result types from neverthrow
export { Result, Ok, Err, ok, err } from 'neverthrow';

/**
 * Output format types
 */
export type OutputFormat = 'json' | 'yaml' | 'table';

/**
 * Document with metadata
 */
export interface DocumentWithMeta<T = Record<string, unknown>> {
  data: T;
  metadata: DocumentMetadata;
}

/**
 * Document metadata from Firestore
 */
export interface DocumentMetadata {
  id: string;
  path: string;
  createTime?: Date;
  updateTime?: Date;
  readTime?: Date;
}

/**
 * Base application error type
 */
export interface AppError {
  type: string;
  message: string;
  details?: unknown;
}

/**
 * Change type for watch operations
 */
export type ChangeType = 'added' | 'modified' | 'removed';

/**
 * Document change event
 */
export interface DocumentChange<T = Record<string, unknown>> {
  type: ChangeType;
  document: DocumentWithMeta<T>;
}

/**
 * Query where condition
 */
export interface WhereCondition {
  field: string;
  operator: FirestoreOperator;
  value: unknown;
}

/**
 * Firestore query operators
 */
export type FirestoreOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

/**
 * Order by direction
 */
export type OrderDirection = 'asc' | 'desc';

/**
 * Order by specification
 */
export interface OrderBy {
  field: string;
  direction: OrderDirection;
}
