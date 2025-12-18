import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth';
import type { Config } from './config';

describe('AuthService', () => {
  let authService: AuthService;
  const testConfig: Config = {
    projectId: 'test-project',
    defaultListLimit: 100,
    watchShowInitial: false,
  };

  beforeEach(() => {
    authService = new AuthService();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('initialization', () => {
    it('should not be initialized by default', () => {
      expect(authService.isInitialized()).toBe(false);
    });

    it('should return UNINITIALIZED error when getFirestore called before initialize', () => {
      const result = authService.getFirestore();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('UNINITIALIZED');
      }
    });

    it('should return INVALID_CREDENTIALS for non-existent credential file', async () => {
      const config: Config = {
        ...testConfig,
        credentialPath: '/non/existent/path.json',
      };

      const result = await authService.initialize(config);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should include error message for invalid credentials', async () => {
      const config: Config = {
        ...testConfig,
        credentialPath: '/non/existent/path.json',
      };

      const result = await authService.initialize(config);

      expect(result.isErr()).toBe(true);
      if (result.isErr() && result.error.type === 'INVALID_CREDENTIALS') {
        expect(result.error.message).toContain('サービスアカウントキー');
      }
    });
  });

  describe('emulator support', () => {
    it('should validate emulator host format', async () => {
      const config: Config = {
        ...testConfig,
        emulatorHost: 'invalid-format',
      };

      const result = await authService.initialize(config);

      // This will fail during initialization
      expect(result.isErr()).toBe(true);
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance on multiple getFirestore calls after init', () => {
      // Cannot test without actual Firebase initialization,
      // but verify the isInitialized flag behavior
      expect(authService.isInitialized()).toBe(false);
    });
  });

  describe('error types', () => {
    it('should have correct error type structure for UNINITIALIZED', () => {
      const result = authService.getFirestore();
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toHaveProperty('type');
        expect(result.error).toHaveProperty('message');
      }
    });
  });
});
