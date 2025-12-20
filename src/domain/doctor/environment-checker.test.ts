/**
 * Tests for EnvironmentChecker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnvironmentChecker } from './environment-checker';

describe('EnvironmentChecker', () => {
  let checker: EnvironmentChecker;

  beforeEach(() => {
    checker = new EnvironmentChecker();
  });

  describe('checkNodeVersion', () => {
    it('should return success when Node.js version meets minimum requirement', () => {
      // Mock process.version to v20.0.0
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', { value: 'v20.0.0', configurable: true });

      const result = checker.checkNodeVersion();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('node-version');
        expect(result.value.message).toContain('v20.0.0');
      }

      Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
    });

    it('should return success for Node.js 18.0.0 (minimum version)', () => {
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', { value: 'v18.0.0', configurable: true });

      const result = checker.checkNodeVersion();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
      }

      Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
    });

    it('should return error when Node.js version is below minimum requirement', () => {
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', { value: 'v16.0.0', configurable: true });

      const result = checker.checkNodeVersion();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('node-version');
        expect(result.value.guidance).toBeDefined();
        expect(result.value.guidance).toContain('18');
      }

      Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
    });

    it('should handle edge case version v17.9.9', () => {
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', { value: 'v17.9.9', configurable: true });

      const result = checker.checkNodeVersion();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
      }

      Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
    });
  });

  describe('checkFirebaseCLI', () => {
    it('should return success when Firebase CLI is installed', async () => {
      // Create checker with mock exec
      const mockChecker = new EnvironmentChecker({
        execCommand: async () => '13.0.0',
      });

      const result = await mockChecker.checkFirebaseCLI();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('firebase-cli');
        expect(result.value.message).toContain('13.0.0');
      }
    });

    it('should return warning when Firebase CLI is not installed', async () => {
      const mockChecker = new EnvironmentChecker({
        execCommand: async () => {
          throw new Error('command not found');
        },
      });

      const result = await mockChecker.checkFirebaseCLI();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('warning');
        expect(result.value.category).toBe('firebase-cli');
        expect(result.value.guidance).toContain('npm install -g firebase-tools');
      }
    });
  });

  describe('checkAuthStatus', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return success when GOOGLE_APPLICATION_CREDENTIALS is set', async () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: () => true,
        readFile: () => JSON.stringify({
          client_email: 'test@project.iam.gserviceaccount.com',
          project_id: 'test-project',
        }),
        getEnv: (name) => {
          if (name === 'GOOGLE_APPLICATION_CREDENTIALS') return '/path/to/service-account.json';
          return undefined;
        },
      });

      const result = await mockChecker.checkAuthStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('auth-status');
        expect(result.value.details).toContain('Service Account');
        expect(result.value.details).toContain('test@project.iam.gserviceaccount.com');
      }
    });

    it('should return error when GOOGLE_APPLICATION_CREDENTIALS file does not exist', async () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: () => false,
        getEnv: (name) => {
          if (name === 'GOOGLE_APPLICATION_CREDENTIALS') return '/path/to/nonexistent.json';
          return undefined;
        },
        getHomedir: () => '/home/user',
      });

      const result = await mockChecker.checkAuthStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.guidance).toBeDefined();
      }
    });

    it('should check for ADC when no service account is set', async () => {
      // Simulate ADC available (gcloud logged in)
      const mockChecker = new EnvironmentChecker({
        fileExists: (path) => path.includes('.config/gcloud'),
        readFile: () => JSON.stringify({ quota_project_id: 'my-project' }),
        getHomedir: () => '/home/user',
        getEnv: () => undefined,
        execCommand: async () => 'user@example.com',
      });

      const result = await mockChecker.checkAuthStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.details).toContain('ADC');
      }
    });

    it('should return error when no authentication is available', async () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: () => false,
        getHomedir: () => '/home/user',
        getEnv: () => undefined,
      });

      const result = await mockChecker.checkAuthStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('auth-status');
        expect(result.value.guidance).toBeDefined();
        expect(result.value.guidance).toContain('gcloud');
      }
    });

    it('should skip auth check when emulator mode is enabled', async () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: () => false,
        getEnv: (name) => {
          if (name === 'FIRESTORE_EMULATOR_HOST') return 'localhost:8080';
          return undefined;
        },
      });

      const result = await mockChecker.checkAuthStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.details).toContain('Emulator');
      }
    });
  });

  describe('detectAuthInfo', () => {
    it('should detect service account with details', () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: () => true,
        readFile: () => JSON.stringify({
          client_email: 'sa@project.iam.gserviceaccount.com',
          project_id: 'my-project',
        }),
        getEnv: (name) => {
          if (name === 'GOOGLE_APPLICATION_CREDENTIALS') return '/path/to/sa.json';
          return undefined;
        },
      });

      const info = mockChecker.detectAuthInfo();

      expect(info.type).toBe('service-account');
      expect(info.account).toBe('sa@project.iam.gserviceaccount.com');
      expect(info.projectId).toBe('my-project');
      expect(info.filePath).toBe('/path/to/sa.json');
    });

    it('should detect ADC', () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: (path) => path.includes('.config/gcloud'),
        readFile: () => JSON.stringify({ quota_project_id: 'my-quota-project' }),
        getHomedir: () => '/home/user',
        getEnv: () => undefined,
      });

      const info = mockChecker.detectAuthInfo();

      expect(info.type).toBe('adc');
      expect(info.projectId).toBe('my-quota-project');
    });

    it('should detect emulator mode', () => {
      const mockChecker = new EnvironmentChecker({
        getEnv: (name) => {
          if (name === 'FIRESTORE_EMULATOR_HOST') return 'localhost:8080';
          return undefined;
        },
      });

      const info = mockChecker.detectAuthInfo();

      expect(info.type).toBe('emulator');
    });

    it('should return none when no auth is configured', () => {
      const mockChecker = new EnvironmentChecker({
        fileExists: () => false,
        getHomedir: () => '/home/user',
        getEnv: () => undefined,
      });

      const info = mockChecker.detectAuthInfo();

      expect(info.type).toBe('none');
    });
  });
});
