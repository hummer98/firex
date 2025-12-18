/**
 * WatchService unit tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WatchService } from './watch-service';
import type { Firestore } from 'firebase-admin/firestore';

describe('WatchService', () => {
  let mockFirestore: Firestore;
  let watchService: WatchService;

  beforeEach(() => {
    // Create mock Firestore instance with onSnapshot support
    const mockUnsubscribe = vi.fn();

    const mockDocRef: any = {
      path: 'users/user1',
      onSnapshot: vi.fn((onNext, onError) => {
        // Simulate initial snapshot
        setTimeout(() => {
          onNext({
            exists: true,
            id: 'user1',
            data: () => ({ name: 'User 1' }),
            ref: mockDocRef,
          });
        }, 10);
        return mockUnsubscribe;
      }),
    };

    const mockQuery: any = {
      onSnapshot: vi.fn((onNext, onError) => {
        // Simulate query snapshot
        setTimeout(() => {
          onNext({
            docs: [
              {
                id: 'user1',
                exists: true,
                data: () => ({ name: 'User 1' }),
                ref: mockDocRef,
              },
            ],
            docChanges: () => [
              {
                type: 'added',
                doc: {
                  id: 'user1',
                  exists: true,
                  data: () => ({ name: 'User 1' }),
                  ref: mockDocRef,
                },
              },
            ],
          });
        }, 10);
        return mockUnsubscribe;
      }),
    };

    const mockCollectionRef = {
      onSnapshot: mockQuery.onSnapshot,
    };

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      collection: vi.fn().mockReturnValue(mockCollectionRef),
    } as unknown as Firestore;

    watchService = new WatchService(mockFirestore);
  });

  afterEach(() => {
    watchService.unsubscribeAll();
  });

  describe('watchDocument', () => {
    it('should watch document changes', async () => {
      const changes: any[] = [];
      const onChangeFn = vi.fn((change) => {
        changes.push(change);
      });

      const result = watchService.watchDocument('users/user1', {
        onChange: onChangeFn,
        showInitial: true,
      });

      expect(result.isOk()).toBe(true);

      // Wait for initial snapshot
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onChangeFn).toHaveBeenCalled();
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should not show initial data when showInitial is false', async () => {
      const onChangeFn = vi.fn();

      const result = watchService.watchDocument('users/user1', {
        onChange: onChangeFn,
        showInitial: false,
      });

      expect(result.isOk()).toBe(true);

      // Initial snapshot should not trigger onChange
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onChangeFn).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockErrorDocRef: any = {
        path: 'users/error',
        onSnapshot: vi.fn((onNext, onError) => {
          setTimeout(() => {
            onError(new Error('Connection lost'));
          }, 10);
          return vi.fn();
        }),
      };

      vi.mocked(mockFirestore.doc).mockReturnValue(mockErrorDocRef);

      const onChangeFn = vi.fn();
      const onErrorFn = vi.fn();

      const result = watchService.watchDocument('users/error', {
        onChange: onChangeFn,
        onError: onErrorFn,
        showInitial: true,
      });

      expect(result.isOk()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onErrorFn).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const result = watchService.watchDocument('users/user1', {
        onChange: vi.fn(),
        showInitial: true,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('function');
      }
    });
  });

  describe('watchCollection', () => {
    it('should watch collection changes', async () => {
      const changes: any[] = [];
      const onChangeFn = vi.fn((change) => {
        changes.push(change);
      });

      const result = watchService.watchCollection('users', {
        onChange: onChangeFn,
        showInitial: true,
      });

      expect(result.isOk()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onChangeFn).toHaveBeenCalled();
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should detect change types', async () => {
      const changes: any[] = [];
      const onChangeFn = vi.fn((change) => {
        changes.push(change);
      });

      const result = watchService.watchCollection('users', {
        onChange: onChangeFn,
        showInitial: true,
      });

      expect(result.isOk()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(changes.some((c) => c.type === 'added')).toBe(true);
    });

    it('should not show initial data when showInitial is false', async () => {
      const onChangeFn = vi.fn();

      const result = watchService.watchCollection('users', {
        onChange: onChangeFn,
        showInitial: false,
      });

      expect(result.isOk()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onChangeFn).not.toHaveBeenCalled();
    });

    it('should handle errors with retry', async () => {
      const mockErrorQuery: any = {
        onSnapshot: vi.fn((onNext, onError) => {
          setTimeout(() => {
            onError(new Error('Connection lost'));
          }, 10);
          return vi.fn();
        }),
      };

      vi.mocked(mockFirestore.collection).mockReturnValue(mockErrorQuery);

      const onChangeFn = vi.fn();
      const onErrorFn = vi.fn();

      const result = watchService.watchCollection('users', {
        onChange: onChangeFn,
        onError: onErrorFn,
        showInitial: true,
        maxRetries: 3,
      });

      expect(result.isOk()).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have called onError at least once
      expect(onErrorFn).toHaveBeenCalled();
      // Should have attempted to set up watching at least once
      expect(mockErrorQuery.onSnapshot).toHaveBeenCalled();
    });
  });

  describe('unsubscribeAll', () => {
    it('should unsubscribe all active watchers', () => {
      const result1 = watchService.watchDocument('users/user1', {
        onChange: vi.fn(),
        showInitial: true,
      });

      const result2 = watchService.watchCollection('posts', {
        onChange: vi.fn(),
        showInitial: true,
      });

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      // Should not throw
      expect(() => watchService.unsubscribeAll()).not.toThrow();
    });
  });

  describe('isWatching', () => {
    it('should return true when watchers are active', () => {
      expect(watchService.isWatching()).toBe(false);

      watchService.watchDocument('users/user1', {
        onChange: vi.fn(),
        showInitial: true,
      });

      expect(watchService.isWatching()).toBe(true);

      watchService.unsubscribeAll();

      expect(watchService.isWatching()).toBe(false);
    });
  });
});
