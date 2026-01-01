/**
 * Doctor command types and interfaces
 * Provides data structures for diagnostic checks and reporting
 */

import { Result } from '../../shared/types';

/**
 * Check result status
 */
export type CheckStatus = 'success' | 'warning' | 'error';

/**
 * Check categories for different diagnostic areas
 */
export type CheckCategory =
  | 'node-version'
  | 'firebase-cli'
  | 'auth-status'
  | 'project-id'
  | 'firebaserc'
  | 'firestore-api'
  | 'firestore-access'
  | 'config-file'
  | 'config-syntax'
  | 'config-schema'
  | 'collection-paths'
  | 'build-status'
  | 'emulator-connection';

/**
 * Individual check result
 */
export interface CheckResult {
  /** Status of the check */
  status: CheckStatus;
  /** Category of the check */
  category: CheckCategory;
  /** Human-readable result message */
  message: string;
  /** Additional details about the check */
  details?: string;
  /** Guidance for fixing issues */
  guidance?: string;
  /** Structured metadata for runtime logic (locale-independent) */
  metadata?: Record<string, unknown>;
}

/**
 * Environment information included in diagnostic reports
 */
export interface Environment {
  /** Node.js version string (e.g., "v20.0.0") */
  nodeVersion: string;
  /** Platform identifier (e.g., "darwin", "linux", "win32") */
  platform: string;
  /** Whether running in emulator mode */
  emulatorMode: boolean;
}

/**
 * Summary of diagnostic results
 */
export interface DiagnosticSummary {
  /** Total number of checks performed */
  total: number;
  /** Number of successful checks */
  success: number;
  /** Number of warnings */
  warnings: number;
  /** Number of errors */
  errors: number;
  /** Whether any errors were found (errors > 0) */
  hasErrors: boolean;
}

/**
 * Complete diagnostic report
 */
export interface DiagnosticReport {
  /** ISO 8601 timestamp of the diagnostic run */
  timestamp: string;
  /** Environment information */
  environment: Environment;
  /** All check results */
  checks: CheckResult[];
  /** Aggregated summary */
  summary: DiagnosticSummary;
}

/**
 * Checker error types for internal error handling
 */
export type CheckerError =
  | { type: 'FILE_READ_ERROR'; path: string; message: string }
  | { type: 'PARSE_ERROR'; message: string; line?: number; column?: number }
  | { type: 'EXECUTION_ERROR'; command: string; message: string }
  | { type: 'VALIDATION_ERROR'; message: string; field?: string };

/**
 * Doctor service error types
 */
export type DoctorError =
  | { type: 'CHECKER_ERROR'; checker: string; error: CheckerError }
  | { type: 'UNEXPECTED_ERROR'; message: string };

/**
 * Options for running diagnostics
 */
export interface DoctorServiceOptions {
  /** Enable verbose logging */
  verbose: boolean;
  /** Skip build status check */
  skipBuildCheck?: boolean;
}

/**
 * Result type alias for checker operations
 */
export type CheckerResult = Result<CheckResult, CheckerError>;

/**
 * Helper function to create a CheckResult
 */
export function createCheckResult(
  status: CheckStatus,
  category: CheckCategory,
  message: string,
  details?: string,
  guidance?: string,
  metadata?: Record<string, unknown>
): CheckResult {
  return {
    status,
    category,
    message,
    ...(details && { details }),
    ...(guidance && { guidance }),
    ...(metadata && { metadata }),
  };
}

/**
 * Helper function to create a DiagnosticSummary from check results
 */
export function createDiagnosticSummary(checks: CheckResult[]): DiagnosticSummary {
  const success = checks.filter((c) => c.status === 'success').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;
  const errors = checks.filter((c) => c.status === 'error').length;

  return {
    total: checks.length,
    success,
    warnings,
    errors,
    hasErrors: errors > 0,
  };
}
