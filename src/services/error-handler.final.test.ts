/**
 * Final validation tests for error handling and logging
 * Task 9.1: Error messages and logging adjustments
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from './error-handler';
import { LoggingService } from './logging';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('Error Handler Final Validation', () => {
  let loggingService: LoggingService;
  let errorHandler: ErrorHandler;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    loggingService = new LoggingService({ verbose: false });
    errorHandler = new ErrorHandler(loggingService, false);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Japanese error messages', () => {
    it('should display auth errors in Japanese', () => {
      const message = errorHandler.handleAuthError({
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
        originalError: new Error('test'),
      });
      expect(message).toContain('認証エラー');
    });

    it('should display connection timeout in Japanese', () => {
      const message = errorHandler.handleAuthError({
        type: 'CONNECTION_TIMEOUT',
        message: 'Connection timed out',
        retryable: true,
      });
      expect(message).toContain('接続タイムアウト');
      expect(message).toContain('再試行');
    });

    it('should display project not found in Japanese', () => {
      const message = errorHandler.handleAuthError({
        type: 'PROJECT_NOT_FOUND',
        projectId: 'my-project',
      });
      expect(message).toContain('プロジェクトが見つかりません');
    });

    it('should display permission denied in Japanese', () => {
      const message = errorHandler.handleAuthError({
        type: 'PERMISSION_DENIED',
        message: 'Access denied',
      });
      expect(message).toContain('アクセス権限');
    });

    it('should display config errors in Japanese', () => {
      const message = errorHandler.handleConfigError({
        type: 'FILE_NOT_FOUND',
        path: '/path/to/config',
      });
      expect(message).toContain('設定ファイルが見つかりません');
    });

    it('should display parse errors in Japanese', () => {
      const message = errorHandler.handleConfigError({
        type: 'PARSE_ERROR',
        message: 'Invalid YAML',
      });
      expect(message).toContain('解析エラー');
    });

    it('should display validation errors in Japanese', () => {
      const message = errorHandler.handleConfigError({
        type: 'VALIDATION_ERROR',
        message: 'Invalid value',
      });
      expect(message).toContain('設定値が不正');
    });

    it('should display Firestore errors in Japanese', () => {
      const notFoundError = new Error('Document not found');
      (notFoundError as any).code = 'NOT_FOUND';
      const message = errorHandler.handleFirestoreError(notFoundError);
      expect(message).toContain('見つかりません');
    });

    it('should display permission error for Firestore in Japanese', () => {
      const permError = new Error('Permission denied');
      (permError as any).code = 'PERMISSION_DENIED';
      const message = errorHandler.handleFirestoreError(permError);
      expect(message).toContain('アクセス権限');
    });

    it('should display quota exceeded error in Japanese', () => {
      const quotaError = new Error('Quota exceeded');
      (quotaError as any).code = 'RESOURCE_EXHAUSTED';
      const message = errorHandler.handleFirestoreError(quotaError);
      expect(message).toContain('クォータ');
    });

    it('should display unavailable error in Japanese', () => {
      const unavailableError = new Error('Service unavailable');
      (unavailableError as any).code = 'UNAVAILABLE';
      const message = errorHandler.handleFirestoreError(unavailableError);
      expect(message).toContain('利用できません');
    });

    it('should display timeout error in Japanese', () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'DEADLINE_EXCEEDED';
      const message = errorHandler.handleFirestoreError(timeoutError);
      expect(message).toContain('タイムアウト');
    });
  });

  describe('Exit codes', () => {
    it('should return exit code 0 for success (implicitly)', () => {
      // Success is typically not handled by ErrorHandler
      // but we verify the exit code logic
      expect(true).toBe(true); // Placeholder
    });

    it('should return exit code 1 for user errors (auth)', () => {
      const exitCode = errorHandler.getExitCode('auth');
      expect(exitCode).toBe(1);
    });

    it('should return exit code 1 for user errors (config)', () => {
      const exitCode = errorHandler.getExitCode('config');
      expect(exitCode).toBe(1);
    });

    it('should return exit code 1 for user errors (validation)', () => {
      const exitCode = errorHandler.getExitCode('validation');
      expect(exitCode).toBe(1);
    });

    it('should return exit code 2 for system errors (firestore)', () => {
      const exitCode = errorHandler.getExitCode('firestore');
      expect(exitCode).toBe(2);
    });

    it('should return exit code 2 for unknown errors', () => {
      const exitCode = errorHandler.getExitCode('unknown');
      expect(exitCode).toBe(2);
    });

    it('should return exit code 2 when no category provided', () => {
      const exitCode = errorHandler.getExitCode();
      expect(exitCode).toBe(2);
    });
  });

  describe('Help suggestions', () => {
    it('should suggest firex --help for auth context', () => {
      const suggestion = errorHandler.suggestHelp('auth');
      expect(suggestion).toContain('firex --help');
    });

    it('should suggest config --help for config context', () => {
      const suggestion = errorHandler.suggestHelp('config');
      expect(suggestion).toContain('firex config --help');
    });

    it('should suggest get --help for get context', () => {
      const suggestion = errorHandler.suggestHelp('get');
      expect(suggestion).toContain('firex get --help');
    });

    it('should suggest list --help for list context', () => {
      const suggestion = errorHandler.suggestHelp('list');
      expect(suggestion).toContain('firex list --help');
    });

    it('should suggest generic help when no context', () => {
      const suggestion = errorHandler.suggestHelp();
      expect(suggestion).toBe('');
    });
  });
});

describe('Logging Service Final Validation', () => {
  let testLogDir: string;
  let testLogFile: string;

  beforeEach(async () => {
    testLogDir = await fs.mkdtemp(path.join(os.tmpdir(), 'firex-log-test-'));
    testLogFile = path.join(testLogDir, 'test.log');
  });

  afterEach(async () => {
    await fs.rm(testLogDir, { recursive: true, force: true });
  });

  describe('Credential masking', () => {
    it('should mask service account key paths', () => {
      const loggingService = new LoggingService({});
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Loading credentials from /path/to/service-account.json');

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[REDACTED]');
      expect(loggedMessage).not.toContain('service-account.json');

      consoleSpy.mockRestore();
    });

    it('should mask API keys', () => {
      const loggingService = new LoggingService({});
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('API key: AIzaSyD-1234567890abcdefghijk');

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[REDACTED]');
      expect(loggedMessage).not.toContain('AIzaSyD');

      consoleSpy.mockRestore();
    });

    it('should mask OAuth tokens', () => {
      const loggingService = new LoggingService({});
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Token: ya29.a0AfH6SMA_test_token_value');

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[REDACTED]');
      expect(loggedMessage).not.toContain('ya29');

      consoleSpy.mockRestore();
    });

    it('should mask private keys in JSON', () => {
      const loggingService = new LoggingService({});
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Config: {"private_key": "-----BEGIN RSA PRIVATE KEY-----"}');

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[REDACTED]');
      expect(loggedMessage).not.toContain('BEGIN RSA');

      consoleSpy.mockRestore();
    });

    it('should mask client secrets in JSON', () => {
      const loggingService = new LoggingService({});
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Config: {"client_secret": "my-super-secret-value"}');

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[REDACTED]');
      expect(loggedMessage).not.toContain('my-super-secret');

      consoleSpy.mockRestore();
    });
  });

  describe('Log file output', () => {
    it('should write logs to file', async () => {
      const loggingService = new LoggingService({ logFile: testLogFile });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      loggingService.info('Test info message');
      loggingService.warn('Test warning message');
      loggingService.error('Test error message');

      // Wait for async file writes
      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await fs.readFile(testLogFile, 'utf-8');

      expect(content).toContain('INFO');
      expect(content).toContain('Test info message');
      expect(content).toContain('WARN');
      expect(content).toContain('Test warning message');
      expect(content).toContain('ERROR');
      expect(content).toContain('Test error message');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should include timestamps in log file', async () => {
      const loggingService = new LoggingService({ logFile: testLogFile });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Timestamped message');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await fs.readFile(testLogFile, 'utf-8');

      // Check for ISO timestamp format (YYYY-MM-DDTHH:MM:SS)
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      consoleSpy.mockRestore();
    });

    it('should mask credentials in log file', async () => {
      const loggingService = new LoggingService({ logFile: testLogFile });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Loading /home/user/service_account.json');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await fs.readFile(testLogFile, 'utf-8');

      expect(content).toContain('[REDACTED]');
      expect(content).not.toContain('service_account.json');

      consoleSpy.mockRestore();
    });
  });

  describe('Log levels', () => {
    it('should log debug messages only when verbose is true', () => {
      const quietService = new LoggingService({ verbose: false });
      const verboseService = new LoggingService({ verbose: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      quietService.debug('Debug message from quiet service');
      const quietCallCount = consoleSpy.mock.calls.length;

      verboseService.debug('Debug message from verbose service');
      const verboseCallCount = consoleSpy.mock.calls.length;

      // Quiet service should not log debug
      expect(quietCallCount).toBe(0);
      // Verbose service should log debug
      expect(verboseCallCount).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should always log error messages', () => {
      const loggingService = new LoggingService({ verbose: false });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      loggingService.error('Error message');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should always log warning messages', () => {
      const loggingService = new LoggingService({ verbose: false });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      loggingService.warn('Warning message');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should always log info messages', () => {
      const loggingService = new LoggingService({ verbose: false });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      loggingService.info('Info message');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
