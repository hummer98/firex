/**
 * Tests for FirebaseChecker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebaseChecker } from './firebase-checker';

describe('FirebaseChecker', () => {
  describe('checkFirebaseRC', () => {
    it('should return success when .firebaserc exists with valid project', async () => {
      const checker = new FirebaseChecker({
        readFile: async (path) => JSON.stringify({
          projects: {
            default: 'my-project-id',
          },
        }),
        fileExists: () => true,
      });

      const result = await checker.checkFirebaseRC('/path/to/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('firebaserc');
        expect(result.value.message).toContain('my-project-id');
      }
    });

    it('should search parent directories for .firebaserc', async () => {
      let searchedPaths: string[] = [];
      const checker = new FirebaseChecker({
        readFile: async (path) => {
          searchedPaths.push(path);
          if (path === '/parent/.firebaserc') {
            return JSON.stringify({ projects: { default: 'found-project' } });
          }
          throw new Error('Not found');
        },
        fileExists: (path) => path === '/parent/.firebaserc',
      });

      const result = await checker.checkFirebaseRC('/parent/child/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.message).toContain('found-project');
      }
    });

    it('should return warning when .firebaserc does not exist', async () => {
      const checker = new FirebaseChecker({
        readFile: async () => { throw new Error('Not found'); },
        fileExists: () => false,
      });

      const result = await checker.checkFirebaseRC('/path/to/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('warning');
        expect(result.value.category).toBe('firebaserc');
        expect(result.value.guidance).toContain('firebase init');
      }
    });

    it('should return error when .firebaserc has invalid JSON', async () => {
      const checker = new FirebaseChecker({
        readFile: async () => 'invalid json {',
        fileExists: () => true,
      });

      const result = await checker.checkFirebaseRC('/path/to/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('firebaserc');
      }
    });
  });

  describe('checkFirestoreAPI', () => {
    it('should return success when Firestore API is accessible', async () => {
      const mockFirestore = {
        listCollections: vi.fn().mockResolvedValue([]),
      };

      const checker = new FirebaseChecker({
        getFirestore: () => mockFirestore as any,
      });

      const result = await checker.checkFirestoreAPI('my-project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('firestore-api');
      }
    });

    it('should return error when Firestore API is not enabled', async () => {
      const mockFirestore = {
        listCollections: vi.fn().mockRejectedValue(new Error('Firestore has not been used')),
      };

      const checker = new FirebaseChecker({
        getFirestore: () => mockFirestore as any,
      });

      const result = await checker.checkFirestoreAPI('my-project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('firestore-api');
        expect(result.value.guidance).toContain('console.cloud.google.com');
      }
    });
  });

  describe('checkFirestoreAccess', () => {
    it('should return success when access is granted', async () => {
      const mockFirestore = {
        listCollections: vi.fn().mockResolvedValue([{ id: 'users' }, { id: 'posts' }]),
      };

      const checker = new FirebaseChecker({
        getFirestore: () => mockFirestore as any,
      });

      const result = await checker.checkFirestoreAccess({
        projectId: 'my-project',
        defaultListLimit: 100,
        watchShowInitial: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('firestore-access');
        expect(result.value.details).toContain('2');
      }
    });

    it('should return error when permission is denied', async () => {
      const mockFirestore = {
        listCollections: vi.fn().mockRejectedValue(new Error('PERMISSION_DENIED')),
      };

      const checker = new FirebaseChecker({
        getFirestore: () => mockFirestore as any,
      });

      const result = await checker.checkFirestoreAccess({
        projectId: 'my-project',
        defaultListLimit: 100,
        watchShowInitial: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('firestore-access');
        expect(result.value.guidance).toBeDefined();
      }
    });
  });

  describe('checkEmulatorConnection', () => {
    it('should return success when emulator is reachable', async () => {
      const checker = new FirebaseChecker({
        httpGet: async () => ({ status: 200 }),
      });

      const result = await checker.checkEmulatorConnection('localhost:8080');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('emulator-connection');
      }
    });

    it('should return error when emulator is not reachable', async () => {
      const checker = new FirebaseChecker({
        httpGet: async () => { throw new Error('ECONNREFUSED'); },
      });

      const result = await checker.checkEmulatorConnection('localhost:8080');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('emulator-connection');
        expect(result.value.guidance).toContain('emulator');
      }
    });
  });
});
