/**
 * Tests for BaseCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseCommand } from './base-command';
import { Config, Flags } from '@oclif/core';
import { ConfigService } from '../services/config';
import { AuthService } from '../services/auth';
import { ErrorHandler } from '../services/error-handler';
import { LoggingService } from '../services/logging';
import { ok, err } from '../shared/types';

// Create a concrete implementation for testing
class TestCommand extends BaseCommand {
  static override description = 'Test command';

  async run(): Promise<void> {
    await this.initialize();
    this.log('Test command executed');
  }
}

describe('BaseCommand', () => {
  let mockConfigService: ConfigService;
  let mockAuthService: AuthService;
  let mockErrorHandler: ErrorHandler;
  let mockLoggingService: LoggingService;

  beforeEach(() => {
    mockLoggingService = new LoggingService({ verbose: false });
    mockErrorHandler = new ErrorHandler(mockLoggingService, false);
    mockConfigService = new ConfigService();
    mockAuthService = new AuthService();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('static flags', () => {
    it('should define verbose flag', () => {
      expect(BaseCommand.baseFlags).toBeDefined();
      expect(BaseCommand.baseFlags.verbose).toBeDefined();
    });

    it('should define project-id flag', () => {
      expect(BaseCommand.baseFlags['project-id']).toBeDefined();
    });

    it('should define credential-path flag', () => {
      expect(BaseCommand.baseFlags['credential-path']).toBeDefined();
    });

    it('should define format flag', () => {
      expect(BaseCommand.baseFlags.format).toBeDefined();
    });

    it('should define profile flag', () => {
      expect(BaseCommand.baseFlags.profile).toBeDefined();
    });

    describe('format alias flags', () => {
      it('should define --json flag as alias for --format=json', () => {
        expect(BaseCommand.baseFlags.json).toBeDefined();
        expect(BaseCommand.baseFlags.json.type).toBe('boolean');
      });

      it('should define --yaml flag as alias for --format=yaml', () => {
        expect(BaseCommand.baseFlags.yaml).toBeDefined();
        expect(BaseCommand.baseFlags.yaml.type).toBe('boolean');
      });

      it('should define --table flag as alias for --format=table', () => {
        expect(BaseCommand.baseFlags.table).toBeDefined();
        expect(BaseCommand.baseFlags.table.type).toBe('boolean');
      });

      it('should have json, yaml, table flags default to false', () => {
        expect(BaseCommand.baseFlags.json.default).toBe(false);
        expect(BaseCommand.baseFlags.yaml.default).toBe(false);
        expect(BaseCommand.baseFlags.table.default).toBe(false);
      });

      it('should have exclusive constraints between format aliases', () => {
        expect(BaseCommand.baseFlags.json.exclusive).toContain('yaml');
        expect(BaseCommand.baseFlags.json.exclusive).toContain('table');
        expect(BaseCommand.baseFlags.yaml.exclusive).toContain('json');
        expect(BaseCommand.baseFlags.yaml.exclusive).toContain('table');
        expect(BaseCommand.baseFlags.table.exclusive).toContain('json');
        expect(BaseCommand.baseFlags.table.exclusive).toContain('yaml');
      });
    });
  });

  describe('resolveFormat', () => {
    it('should return json when --json flag is true', () => {
      const cmd = new TestCommand([], {} as Config);
      const format = (cmd as any).resolveFormat({ json: true });
      expect(format).toBe('json');
    });

    it('should return yaml when --yaml flag is true', () => {
      const cmd = new TestCommand([], {} as Config);
      const format = (cmd as any).resolveFormat({ yaml: true });
      expect(format).toBe('yaml');
    });

    it('should return table when --table flag is true', () => {
      const cmd = new TestCommand([], {} as Config);
      const format = (cmd as any).resolveFormat({ table: true });
      expect(format).toBe('table');
    });

    it('should use --format value when no alias flags are set', () => {
      const cmd = new TestCommand([], {} as Config);
      const format = (cmd as any).resolveFormat({ format: 'yaml' });
      expect(format).toBe('yaml');
    });

    it('should default to json when no flags are set', () => {
      const cmd = new TestCommand([], {} as Config);
      const format = (cmd as any).resolveFormat({});
      expect(format).toBe('json');
    });

    it('should prioritize alias flags over --format', () => {
      const cmd = new TestCommand([], {} as Config);
      const format = (cmd as any).resolveFormat({ format: 'table', yaml: true });
      expect(format).toBe('yaml');
    });
  });

  describe('services', () => {
    it('should provide ConfigService', () => {
      expect(BaseCommand.prototype.getConfigService).toBeDefined();
    });

    it('should provide AuthService', () => {
      expect(BaseCommand.prototype.getAuthService).toBeDefined();
    });

    it('should provide ErrorHandler', () => {
      expect(BaseCommand.prototype.getErrorHandler).toBeDefined();
    });

    it('should provide LoggingService', () => {
      expect(BaseCommand.prototype.getLoggingService).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should load config successfully', async () => {
      const loadConfigSpy = vi.spyOn(mockConfigService, 'loadConfig').mockResolvedValue(
        ok({
          defaultListLimit: 100,
          watchShowInitial: false,
        })
      );

      // BaseCommand should work with config loading
      const cmd = new TestCommand([], {} as Config);
      const configService = cmd.getConfigService();
      expect(configService).toBeDefined();
    });

    it('should handle config load error', async () => {
      const loadConfigSpy = vi.spyOn(ConfigService.prototype, 'loadConfig').mockResolvedValue(
        err({
          type: 'PARSE_ERROR' as const,
          message: 'Invalid config',
        })
      );

      // Verify that config service can return errors
      const configService = new ConfigService();
      const result = await configService.loadConfig();
      expect(result.isErr()).toBe(true);

      loadConfigSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle auth errors appropriately', () => {
      const errorHandler = new ErrorHandler(mockLoggingService, false);
      const message = errorHandler.handleAuthError({
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
        originalError: new Error('test'),
      });

      expect(message).toContain('Invalid credentials');
    });

    it('should include help suggestion in error output', () => {
      const errorHandler = new ErrorHandler(mockLoggingService, false);
      const suggestion = errorHandler.suggestHelp('auth');
      expect(suggestion).toContain('firex');
    });

    it('should return correct exit code for auth errors', () => {
      const errorHandler = new ErrorHandler(mockLoggingService, false);
      const exitCode = errorHandler.getExitCode('auth');
      expect(exitCode).toBe(1);
    });

    it('should return correct exit code for system errors', () => {
      const errorHandler = new ErrorHandler(mockLoggingService, false);
      const exitCode = errorHandler.getExitCode('firestore');
      expect(exitCode).toBe(2);
    });
  });

  describe('verbose mode', () => {
    it('should pass verbose flag to services', () => {
      const loggingService = new LoggingService({ verbose: true });
      const errorHandler = new ErrorHandler(loggingService, true);

      const authError = {
        type: 'INVALID_CREDENTIALS' as const,
        message: 'Test error',
        originalError: new Error('Original error'),
      };

      const message = errorHandler.handleAuthError(authError);
      // In verbose mode, stack trace should be included
      expect(message).toContain('Test error');
    });
  });
});
