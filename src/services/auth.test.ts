import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth';
import type { Config } from './config';

// Mock firebase-admin/app
const mockDeleteApp = vi.fn().mockResolvedValue(undefined);
const mockListCollections = vi.fn().mockResolvedValue([]);
const mockApp = { name: '[DEFAULT]' };
const mockFirestore = { listCollections: mockListCollections };

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => mockApp),
  deleteApp: (...args: unknown[]) => mockDeleteApp(...args),
  cert: vi.fn(() => ({})),
  applicationDefault: vi.fn(() => ({})),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
}));

// Import mocked modules for assertions
import { initializeApp } from 'firebase-admin/app';
const mockInitializeApp = vi.mocked(initializeApp);

describe('AuthService', () => {
  let authService: AuthService;
  const testConfig: Config = {
    projectId: 'test-project',
    defaultListLimit: 100,
    watchShowInitial: false,
  };

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
    mockListCollections.mockResolvedValue([]);
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

    it('should initialize successfully with valid config', async () => {
      const result = await authService.initialize(testConfig);

      expect(result.isOk()).toBe(true);
      expect(authService.isInitialized()).toBe(true);
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });

    it('should return cached instance on second call', async () => {
      const result1 = await authService.initialize(testConfig);
      const result2 = await authService.initialize(testConfig);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      // initializeApp should only be called once
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on verification failure', () => {
    it('should clean up app when listCollections fails', async () => {
      mockListCollections.mockRejectedValueOnce(new Error('connection error'));

      const result = await authService.initialize(testConfig);

      expect(result.isErr()).toBe(true);
      expect(mockDeleteApp).toHaveBeenCalledWith(mockApp);
      expect(authService.isInitialized()).toBe(false);
    });

    it('should allow retry after verification failure', async () => {
      // First attempt: listCollections fails
      mockListCollections.mockRejectedValueOnce(new Error('connection error'));
      const result1 = await authService.initialize(testConfig);
      expect(result1.isErr()).toBe(true);

      // Second attempt: listCollections succeeds
      mockListCollections.mockResolvedValueOnce([]);
      const result2 = await authService.initialize(testConfig);
      expect(result2.isOk()).toBe(true);

      // initializeApp should be called twice (once per attempt)
      expect(mockInitializeApp).toHaveBeenCalledTimes(2);
      // deleteApp should be called twice: cleanup after failure + cleanup before re-init
      // (first cleanup after failure, second cleanup of leftover app before re-init is
      //  not triggered because cleanup already nullified this.app)
      expect(mockDeleteApp).toHaveBeenCalledTimes(1);
    });

    it('should return PERMISSION_DENIED on permission error', async () => {
      mockListCollections.mockRejectedValueOnce(new Error('permission denied'));

      const result = await authService.initialize(testConfig);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PERMISSION_DENIED');
      }
      expect(mockDeleteApp).toHaveBeenCalledWith(mockApp);
    });

    it('should return PROJECT_NOT_FOUND on project error', async () => {
      mockListCollections.mockRejectedValueOnce(new Error('project not found'));

      const result = await authService.initialize(testConfig);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PROJECT_NOT_FOUND');
      }
      expect(mockDeleteApp).toHaveBeenCalledWith(mockApp);
    });

    it('should return CONNECTION_TIMEOUT on timeout error', async () => {
      mockListCollections.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      const result = await authService.initialize(testConfig);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('CONNECTION_TIMEOUT');
      }
      expect(mockDeleteApp).toHaveBeenCalledWith(mockApp);
    });
  });

  describe('emulator support', () => {
    it('should validate emulator host format', async () => {
      const config: Config = {
        ...testConfig,
        emulatorHost: 'invalid-format',
      };

      const result = await authService.initialize(config);

      expect(result.isErr()).toBe(true);
      // App should be cleaned up on invalid emulator host
      expect(mockDeleteApp).toHaveBeenCalledWith(mockApp);
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
