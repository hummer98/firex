/**
 * Error handler service for user-friendly error messages
 */

import type { AuthError } from './auth';
import type { ConfigError } from './config';
import type { LoggingService } from './logging';
import { t } from '../shared/i18n';

/**
 * Error category for exit code determination
 */
export type ErrorCategory = 'auth' | 'config' | 'validation' | 'firestore' | 'unknown';

/**
 * Service for handling and formatting errors
 */
export class ErrorHandler {
  private verbose: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_loggingService: LoggingService, verbose = false) {
    this.verbose = verbose;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: AuthError): string {
    switch (error.type) {
      case 'INVALID_CREDENTIALS':
        return `${t('err.handler.auth.invalid')}: ${error.message}${
          this.verbose && error.originalError
            ? '\n' + this.formatErrorWithStack(error.originalError)
            : ''
        }`;

      case 'CONNECTION_TIMEOUT':
        return `${t('err.handler.auth.timeout')}: ${error.message}${
          error.retryable ? '\n' + t('err.handler.auth.retryHint') : ''
        }`;

      case 'PROJECT_NOT_FOUND':
        return `${t('err.handler.auth.projectNotFound')}: ${error.projectId}\n${t('err.handler.auth.checkProjectId')}`;

      case 'PERMISSION_DENIED':
        return `${t('err.handler.auth.permissionDenied')}: ${error.message}\n${t('err.handler.auth.checkPermission')}`;

      case 'UNINITIALIZED':
        return `${t('err.handler.auth.uninitialized')}: ${error.message}`;

      default:
        return `${t('err.handler.auth.generic')}: ${JSON.stringify(error)}`;
    }
  }

  /**
   * Handle configuration errors
   */
  handleConfigError(error: ConfigError): string {
    switch (error.type) {
      case 'FILE_NOT_FOUND':
        return `${t('err.handler.config.fileNotFound')}: ${error.path}`;

      case 'PARSE_ERROR':
        return `${t('err.handler.config.parseError')}: ${error.message}${
          this.verbose && error.originalError
            ? '\n' + this.formatErrorWithStack(error.originalError)
            : ''
        }`;

      case 'VALIDATION_ERROR':
        return `${t('err.handler.config.validationError')}: ${error.message}`;

      default:
        return `${t('err.handler.config.generic')}: ${JSON.stringify(error)}`;
    }
  }

  /**
   * Handle Firestore API errors
   */
  handleFirestoreError(error: Error): string {
    const code = (error as any).code;

    switch (code) {
      case 'NOT_FOUND':
        return `${t('err.handler.firestore.notFound')}: ${error.message}`;

      case 'PERMISSION_DENIED':
        return `${t('err.handler.firestore.permissionDenied')}: ${error.message}\n${t('err.handler.firestore.checkRules')}`;

      case 'RESOURCE_EXHAUSTED':
        return `${t('err.handler.firestore.quotaExceeded')}: ${error.message}\n${t('err.handler.firestore.waitAndRetry')}`;

      case 'UNAVAILABLE':
        return `${t('err.handler.firestore.unavailable')}: ${error.message}\n${t('err.handler.firestore.checkConnection')}`;

      case 'DEADLINE_EXCEEDED':
        return `${t('err.handler.firestore.timeout')}: ${error.message}\n${t('err.handler.firestore.retry')}`;

      case 'ALREADY_EXISTS':
        return `${t('err.handler.firestore.alreadyExists')}: ${error.message}`;

      case 'INVALID_ARGUMENT':
        return `${t('err.handler.firestore.invalidArgument')}: ${error.message}`;

      default:
        return `${t('err.handler.firestore.generic')}: ${error.message}${
          this.verbose ? '\n' + this.formatErrorWithStack(error) : ''
        }`;
    }
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string | undefined, message: string): string {
    if (field) {
      return `${t('err.handler.validation.withField').replace('{field}', field)}: ${message}`;
    }
    return `${t('err.handler.validation.generic')}: ${message}`;
  }

  /**
   * Format error with stack trace (when verbose)
   */
  formatErrorWithStack(error: Error): string {
    if (!this.verbose || !error.stack) {
      return error.message;
    }

    return `${error.message}\n${t('err.handler.stackTrace')}:\n${error.stack}`;
  }

  /**
   * Suggest help command based on error context
   */
  suggestHelp(context?: string): string {
    if (!context) {
      return '';
    }

    switch (context) {
      case 'auth':
        return '\n' + t('err.handler.help.showHelp');

      case 'config':
        return '\n' + t('err.handler.help.configHelp');

      case 'get':
        return '\n' + t('err.handler.help.commandHelp').replace('{command}', 'get');

      case 'set':
        return '\n' + t('err.handler.help.commandHelp').replace('{command}', 'set');

      case 'list':
        return '\n' + t('err.handler.help.commandHelp').replace('{command}', 'list');

      case 'delete':
        return '\n' + t('err.handler.help.commandHelp').replace('{command}', 'delete');

      default:
        return '\n' + t('err.handler.help.showHelp');
    }
  }

  /**
   * Get appropriate exit code for error category
   *
   * Exit codes:
   * - 0: Success
   * - 1: User error (invalid input, configuration, validation)
   * - 2: System error (Firestore API, network, unknown)
   */
  getExitCode(errorCategory?: ErrorCategory): number {
    if (!errorCategory) {
      return 2;
    }

    switch (errorCategory) {
      case 'auth':
      case 'config':
      case 'validation':
        return 1; // User error

      case 'firestore':
      case 'unknown':
      default:
        return 2; // System error
    }
  }
}
