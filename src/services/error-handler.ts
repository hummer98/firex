/**
 * Error handler service for user-friendly error messages
 */

import type { AuthError } from './auth';
import type { ConfigError } from './config';
import type { LoggingService } from './logging';

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
        return `認証エラー: ${error.message}${
          this.verbose && error.originalError
            ? '\n' + this.formatErrorWithStack(error.originalError)
            : ''
        }`;

      case 'CONNECTION_TIMEOUT':
        return `接続タイムアウト: ${error.message}${
          error.retryable ? '\n再試行してください。' : ''
        }`;

      case 'PROJECT_NOT_FOUND':
        return `プロジェクトが見つかりません: ${error.projectId}\nプロジェクトIDを確認してください。`;

      case 'PERMISSION_DENIED':
        return `アクセス権限がありません: ${error.message}\nサービスアカウントの権限を確認してください。`;

      case 'UNINITIALIZED':
        return `初期化されていません: ${error.message}`;

      default:
        return `認証エラー: ${JSON.stringify(error)}`;
    }
  }

  /**
   * Handle configuration errors
   */
  handleConfigError(error: ConfigError): string {
    switch (error.type) {
      case 'FILE_NOT_FOUND':
        return `設定ファイルが見つかりません: ${error.path}`;

      case 'PARSE_ERROR':
        return `設定ファイルの解析エラー: ${error.message}${
          this.verbose && error.originalError
            ? '\n' + this.formatErrorWithStack(error.originalError)
            : ''
        }`;

      case 'VALIDATION_ERROR':
        return `設定値が不正です: ${error.message}`;

      default:
        return `設定エラー: ${JSON.stringify(error)}`;
    }
  }

  /**
   * Handle Firestore API errors
   */
  handleFirestoreError(error: Error): string {
    const code = (error as any).code;

    switch (code) {
      case 'NOT_FOUND':
        return `ドキュメントが見つかりません: ${error.message}`;

      case 'PERMISSION_DENIED':
        return `アクセス権限がありません: ${error.message}\nFirestoreルールを確認してください。`;

      case 'RESOURCE_EXHAUSTED':
        return `クォータを超過しました: ${error.message}\nしばらく待ってから再試行してください。`;

      case 'UNAVAILABLE':
        return `Firestoreが利用できません: ${error.message}\n接続を確認して再試行してください。`;

      case 'DEADLINE_EXCEEDED':
        return `リクエストがタイムアウトしました: ${error.message}\n再試行してください。`;

      case 'ALREADY_EXISTS':
        return `ドキュメントは既に存在します: ${error.message}`;

      case 'INVALID_ARGUMENT':
        return `引数が無効です: ${error.message}`;

      default:
        return `Firestoreエラー: ${error.message}${
          this.verbose ? '\n' + this.formatErrorWithStack(error) : ''
        }`;
    }
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string | undefined, message: string): string {
    if (field) {
      return `バリデーションエラー (${field}): ${message}`;
    }
    return `バリデーションエラー: ${message}`;
  }

  /**
   * Format error with stack trace (when verbose)
   */
  formatErrorWithStack(error: Error): string {
    if (!this.verbose || !error.stack) {
      return error.message;
    }

    return `${error.message}\nスタックトレース:\n${error.stack}`;
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
        return '\nヘルプを表示: firex --help';

      case 'config':
        return '\n設定のヘルプを表示: firex config --help';

      case 'get':
        return '\nヘルプを表示: firex get --help';

      case 'set':
        return '\nヘルプを表示: firex set --help';

      case 'list':
        return '\nヘルプを表示: firex list --help';

      case 'delete':
        return '\nヘルプを表示: firex delete --help';

      default:
        return '\nヘルプを表示: firex --help';
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
