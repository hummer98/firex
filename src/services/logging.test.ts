import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoggingService } from './logging';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('LoggingService', () => {
  let tmpDir: string;
  let logFile: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'firex-log-test-'));
    logFile = path.join(tmpDir, 'test.log');

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('console logging', () => {
    it('should log error messages to console.error', () => {
      const logger = new LoggingService();
      logger.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain('ERROR');
      expect(call).toContain('Test error');
    });

    it('should log warn messages to console.warn', () => {
      const logger = new LoggingService();
      logger.warn('Test warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0][0];
      expect(call).toContain('WARN');
      expect(call).toContain('Test warning');
    });

    it('should log info messages to console.log', () => {
      const logger = new LoggingService();
      logger.info('Test info');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('INFO');
      expect(call).toContain('Test info');
    });

    it('should only log debug messages when verbose is true', () => {
      const logger = new LoggingService({ verbose: true });
      logger.debug('Test debug');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('DEBUG');
      expect(call).toContain('Test debug');
    });

    it('should not log debug messages when verbose is false', () => {
      const logger = new LoggingService({ verbose: false });
      logger.debug('Test debug');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('credential masking', () => {
    it('should mask service account key paths', () => {
      const logger = new LoggingService();
      logger.info('Using credential: /path/to/service-account.json');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[REDACTED]');
      expect(call).not.toContain('service-account.json');
    });

    it('should mask API keys', () => {
      const logger = new LoggingService();
      logger.info('API Key: AIza1234567890abcdefg');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[REDACTED]');
      expect(call).not.toContain('AIza1234567890abcdefg');
    });
  });

  describe('file logging', () => {
    it('should write logs to file when logFile is specified', async () => {
      const logger = new LoggingService({ logFile });
      logger.info('Test message');

      // Wait a bit for file write
      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await fs.readFile(logFile, 'utf-8');
      expect(content).toContain('INFO');
      expect(content).toContain('Test message');
    });

    it('should include timestamp in file logs', async () => {
      const logger = new LoggingService({ logFile });
      logger.info('Test message');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await fs.readFile(logFile, 'utf-8');
      // Should contain ISO timestamp
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should append to existing log file', async () => {
      const logger = new LoggingService({ logFile });
      logger.info('First message');
      logger.info('Second message');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await fs.readFile(logFile, 'utf-8');
      expect(content).toContain('First message');
      expect(content).toContain('Second message');
    });
  });

  describe('structured metadata', () => {
    it('should log metadata as JSON', () => {
      const logger = new LoggingService();
      logger.info('Test message', { userId: '123', action: 'login' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('userId');
      expect(call).toContain('123');
    });
  });
});
