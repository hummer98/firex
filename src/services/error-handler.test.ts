/**
 * Tests for ErrorHandler service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from './error-handler';
import { LoggingService } from './logging';
import type { AuthError } from './auth';
import type { ConfigError } from './config';
import { err, ok } from '../shared/types';
import { setLocale, getLocale, type SupportedLocale } from '../shared/i18n';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let loggingService: LoggingService;
  let originalLocale: SupportedLocale;

  beforeEach(() => {
    originalLocale = getLocale();
    setLocale('ja'); // Set Japanese locale for testing Japanese error messages
    loggingService = new LoggingService();
    errorHandler = new ErrorHandler(loggingService);
  });

  afterEach(() => {
    setLocale(originalLocale);
  });

  describe('handleAuthError', () => {
    it('should format INVALID_CREDENTIALS error', () => {
      const error: AuthError = {
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
        originalError: new Error('Test error'),
      };

      const message = errorHandler.handleAuthError(error);

      expect(message).toContain('認証エラー');
      expect(message).toContain('Invalid credentials');
    });

    it('should format CONNECTION_TIMEOUT error with retry suggestion', () => {
      const error: AuthError = {
        type: 'CONNECTION_TIMEOUT',
        message: 'Connection timeout',
        retryable: true,
      };

      const message = errorHandler.handleAuthError(error);

      expect(message).toContain('接続タイムアウト');
      expect(message).toContain('再試行');
    });

    it('should format PROJECT_NOT_FOUND error', () => {
      const error: AuthError = {
        type: 'PROJECT_NOT_FOUND',
        projectId: 'test-project',
      };

      const message = errorHandler.handleAuthError(error);

      expect(message).toContain('プロジェクトが見つかりません');
      expect(message).toContain('test-project');
    });

    it('should format PERMISSION_DENIED error', () => {
      const error: AuthError = {
        type: 'PERMISSION_DENIED',
        message: 'Permission denied',
      };

      const message = errorHandler.handleAuthError(error);

      expect(message).toContain('アクセス権限がありません');
      expect(message).toContain('Permission denied');
    });

    it('should format UNINITIALIZED error', () => {
      const error: AuthError = {
        type: 'UNINITIALIZED',
        message: 'Not initialized',
      };

      const message = errorHandler.handleAuthError(error);

      expect(message).toContain('初期化されていません');
    });
  });

  describe('handleConfigError', () => {
    it('should format FILE_NOT_FOUND error', () => {
      const error: ConfigError = {
        type: 'FILE_NOT_FOUND',
        path: '/path/to/config',
      };

      const message = errorHandler.handleConfigError(error);

      expect(message).toContain('設定ファイルが見つかりません');
      expect(message).toContain('/path/to/config');
    });

    it('should format PARSE_ERROR error', () => {
      const error: ConfigError = {
        type: 'PARSE_ERROR',
        message: 'Invalid YAML',
        originalError: new Error('Syntax error'),
      };

      const message = errorHandler.handleConfigError(error);

      expect(message).toContain('設定ファイルの解析エラー');
      expect(message).toContain('Invalid YAML');
    });

    it('should format VALIDATION_ERROR error', () => {
      const error: ConfigError = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid config',
      };

      const message = errorHandler.handleConfigError(error);

      expect(message).toContain('設定値が不正です');
      expect(message).toContain('Invalid config');
    });
  });

  describe('handleFirestoreError', () => {
    it('should handle document not found error', () => {
      const error = new Error('Document not found');
      (error as any).code = 'NOT_FOUND';

      const message = errorHandler.handleFirestoreError(error);

      expect(message).toContain('ドキュメントが見つかりません');
    });

    it('should handle permission denied error', () => {
      const error = new Error('Permission denied');
      (error as any).code = 'PERMISSION_DENIED';

      const message = errorHandler.handleFirestoreError(error);

      expect(message).toContain('アクセス権限がありません');
    });

    it('should handle quota exceeded error', () => {
      const error = new Error('Quota exceeded');
      (error as any).code = 'RESOURCE_EXHAUSTED';

      const message = errorHandler.handleFirestoreError(error);

      expect(message).toContain('クォータを超過しました');
    });

    it('should handle unknown Firestore errors', () => {
      const error = new Error('Unknown error');

      const message = errorHandler.handleFirestoreError(error);

      expect(message).toContain('Firestoreエラー');
      expect(message).toContain('Unknown error');
    });
  });

  describe('handleValidationError', () => {
    it('should format validation error with field info', () => {
      const message = errorHandler.handleValidationError(
        'field',
        'Field must be a string'
      );

      expect(message).toContain('バリデーションエラー');
      expect(message).toContain('field');
      expect(message).toContain('Field must be a string');
    });

    it('should format validation error without field info', () => {
      const message = errorHandler.handleValidationError(
        undefined,
        'Invalid data'
      );

      expect(message).toContain('バリデーションエラー');
      expect(message).toContain('Invalid data');
      expect(message).not.toContain('undefined');
    });
  });

  describe('formatErrorWithStack', () => {
    it('should format error with stack trace when verbose is true', () => {
      const verboseHandler = new ErrorHandler(loggingService, true);
      const error = new Error('Test error');

      const formatted = verboseHandler.formatErrorWithStack(error);

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('スタックトレース:');
      expect(formatted).toContain('at ');
    });

    it('should format error without stack trace when verbose is false', () => {
      const error = new Error('Test error');

      const formatted = errorHandler.formatErrorWithStack(error);

      expect(formatted).toContain('Test error');
      expect(formatted).not.toContain('スタックトレース:');
    });

    it('should handle error without stack property', () => {
      const error = new Error('Test error');
      delete (error as any).stack;

      const formatted = errorHandler.formatErrorWithStack(error);

      expect(formatted).toContain('Test error');
    });
  });

  describe('suggestHelp', () => {
    it('should suggest help for auth-related commands', () => {
      const suggestion = errorHandler.suggestHelp('auth');

      expect(suggestion).toContain('ヘルプ');
      expect(suggestion).toContain('firex --help');
    });

    it('should suggest help for config-related commands', () => {
      const suggestion = errorHandler.suggestHelp('config');

      expect(suggestion).toContain('設定');
      expect(suggestion).toContain('firex config --help');
    });

    it('should provide generic help for unknown commands', () => {
      const suggestion = errorHandler.suggestHelp('unknown');

      expect(suggestion).toContain('ヘルプ');
      expect(suggestion).toContain('firex --help');
    });

    it('should return empty string when context is undefined', () => {
      const suggestion = errorHandler.suggestHelp();

      expect(suggestion).toBe('');
    });
  });

  describe('getExitCode', () => {
    it('should return 1 for user errors (auth, config, validation)', () => {
      expect(errorHandler.getExitCode('auth')).toBe(1);
      expect(errorHandler.getExitCode('config')).toBe(1);
      expect(errorHandler.getExitCode('validation')).toBe(1);
    });

    it('should return 2 for system errors (firestore, unknown)', () => {
      expect(errorHandler.getExitCode('firestore')).toBe(2);
      expect(errorHandler.getExitCode('unknown')).toBe(2);
    });

    it('should return 2 when error type is undefined', () => {
      expect(errorHandler.getExitCode()).toBe(2);
    });
  });

  describe('i18n locale switching', () => {
    it('should return English messages when locale is set to en', () => {
      setLocale('en');
      const error: AuthError = {
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      };

      const message = errorHandler.handleAuthError(error);
      expect(message).toContain('Authentication error');
    });

    it('should return Japanese messages when locale is set to ja', () => {
      setLocale('ja');
      const error: AuthError = {
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      };

      const message = errorHandler.handleAuthError(error);
      expect(message).toContain('認証エラー');
    });

    it('should switch languages for config errors', () => {
      const error: ConfigError = {
        type: 'FILE_NOT_FOUND',
        path: '/path/to/config',
      };

      setLocale('en');
      const enMessage = errorHandler.handleConfigError(error);
      expect(enMessage).toContain('Configuration file not found');

      setLocale('ja');
      const jaMessage = errorHandler.handleConfigError(error);
      expect(jaMessage).toContain('設定ファイルが見つかりません');
    });

    it('should switch languages for Firestore errors', () => {
      const error = new Error('Document not found');
      (error as any).code = 'NOT_FOUND';

      setLocale('en');
      const enMessage = errorHandler.handleFirestoreError(error);
      expect(enMessage).toContain('Document not found');

      setLocale('ja');
      const jaMessage = errorHandler.handleFirestoreError(error);
      expect(jaMessage).toContain('ドキュメントが見つかりません');
    });

    it('should switch languages for help suggestions', () => {
      setLocale('en');
      const enSuggestion = errorHandler.suggestHelp('auth');
      expect(enSuggestion).toContain('Show help');

      setLocale('ja');
      const jaSuggestion = errorHandler.suggestHelp('auth');
      expect(jaSuggestion).toContain('ヘルプを表示');
    });
  });
});
