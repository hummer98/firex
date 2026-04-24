/**
 * Tests for FirestoreManager
 *
 * Focuses on cache key isolation when projectId / databaseId / credentialPath
 * vary, and on getCachedProjectIds() behavior under mixed cache entries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreManager } from './firestore-manager.js';
import { ok } from '../shared/types.js';

const initializeSpy = vi.fn();

vi.mock('../services/auth.js', () => {
  return {
    AuthService: vi.fn().mockImplementation(function () {
      // Intentionally assigned for test observability
      this.initialize = vi.fn(async (config: unknown, appName?: string) => {
        initializeSpy(config, appName);
        return ok({ __appName: appName } as unknown as import('firebase-admin/firestore').Firestore);
      });
    }),
  };
});

describe('FirestoreManager', () => {
  let manager: FirestoreManager;

  beforeEach(() => {
    initializeSpy.mockReset();
    manager = new FirestoreManager();
  });

  describe('cache isolation', () => {
    it('should cache separately for the same projectId but different databaseId', async () => {
      const r1 = await manager.getFirestore({ projectId: 'p1', databaseId: 'db-a' });
      const r2 = await manager.getFirestore({ projectId: 'p1', databaseId: 'db-b' });

      expect(r1.isOk()).toBe(true);
      expect(r2.isOk()).toBe(true);
      // Two different AuthService instances => two initialize calls
      expect(initializeSpy).toHaveBeenCalledTimes(2);
      if (r1.isOk() && r2.isOk()) {
        expect(r1.value).not.toBe(r2.value);
      }
    });

    it('should hit the cache when called twice with the same projectId/databaseId', async () => {
      const r1 = await manager.getFirestore({ projectId: 'p1', databaseId: 'db-a' });
      const r2 = await manager.getFirestore({ projectId: 'p1', databaseId: 'db-a' });

      expect(r1.isOk()).toBe(true);
      expect(r2.isOk()).toBe(true);
      expect(initializeSpy).toHaveBeenCalledTimes(1);
      if (r1.isOk() && r2.isOk()) {
        expect(r1.value).toBe(r2.value);
      }
    });

    it('should treat undefined databaseId and the literal "(default)" as distinct cache keys', async () => {
      const r1 = await manager.getFirestore({ projectId: 'p1' });
      const r2 = await manager.getFirestore({ projectId: 'p1', databaseId: '(default)' });

      expect(r1.isOk()).toBe(true);
      expect(r2.isOk()).toBe(true);
      // These must produce two distinct cache entries
      expect(initializeSpy).toHaveBeenCalledTimes(2);
      if (r1.isOk() && r2.isOk()) {
        expect(r1.value).not.toBe(r2.value);
      }
    });

    it('should cache separately for different projectIds', async () => {
      const r1 = await manager.getFirestore({ projectId: 'p1', databaseId: 'db-a' });
      const r2 = await manager.getFirestore({ projectId: 'p2', databaseId: 'db-a' });

      expect(r1.isOk()).toBe(true);
      expect(r2.isOk()).toBe(true);
      expect(initializeSpy).toHaveBeenCalledTimes(2);
      if (r1.isOk() && r2.isOk()) {
        expect(r1.value).not.toBe(r2.value);
      }
    });
  });

  describe('getCachedProjectIds', () => {
    it('should return an empty array before any getFirestore call', () => {
      expect(manager.getCachedProjectIds()).toEqual([]);
    });

    it('should deduplicate projectIds when multiple databaseIds share the same project', async () => {
      await manager.getFirestore({ projectId: 'p1', databaseId: 'db-a' });
      await manager.getFirestore({ projectId: 'p1', databaseId: 'db-b' });
      await manager.getFirestore({ projectId: 'p2', databaseId: 'db-a' });

      const ids = manager.getCachedProjectIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('p1');
      expect(ids).toContain('p2');
    });

    it('should return projectIds even when databaseId is undefined', async () => {
      await manager.getFirestore({ projectId: 'p1' });
      await manager.getFirestore({ projectId: 'p2', databaseId: 'db-a' });

      const ids = manager.getCachedProjectIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('p1');
      expect(ids).toContain('p2');
    });
  });

  describe('isConnected', () => {
    it('should be false before any getFirestore call', () => {
      expect(manager.isConnected()).toBe(false);
    });

    it('should be true after at least one successful getFirestore call', async () => {
      await manager.getFirestore({ projectId: 'p1', databaseId: 'db-a' });
      expect(manager.isConnected()).toBe(true);
    });
  });
});
