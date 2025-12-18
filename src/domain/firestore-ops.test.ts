/**
 * Tests for FirestoreOps service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirestoreOps, FirestoreOpsError } from './firestore-ops';
import type { Firestore, DocumentReference, DocumentSnapshot, CollectionReference } from 'firebase-admin/firestore';

describe('FirestoreOps', () => {
  let firestoreOps: FirestoreOps;
  let mockFirestore: Partial<Firestore>;
  let mockDocRef: Partial<DocumentReference>;
  let mockDocSnapshot: Partial<DocumentSnapshot>;
  let mockCollectionRef: Partial<CollectionReference>;

  beforeEach(() => {
    mockDocRef = {
      id: 'doc1',
      path: 'users/doc1',
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockDocSnapshot = {
      exists: true,
      id: 'doc1',
      ref: mockDocRef as DocumentReference,
      data: vi.fn().mockReturnValue({ name: 'Test', value: 123 }),
      createTime: { toDate: () => new Date('2024-01-01') } as any,
      updateTime: { toDate: () => new Date('2024-01-02') } as any,
      readTime: { toDate: () => new Date('2024-01-03') } as any,
    };

    mockDocRef.get = vi.fn().mockResolvedValue(mockDocSnapshot);

    mockCollectionRef = {
      path: 'users',
      listDocuments: vi.fn().mockResolvedValue([mockDocRef, mockDocRef]),
    };

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      collection: vi.fn().mockReturnValue(mockCollectionRef),
    };

    firestoreOps = new FirestoreOps(mockFirestore as Firestore);
  });

  describe('validatePath', () => {
    it('should validate correct document path (even segments)', () => {
      const result = firestoreOps.validatePath('users/doc1');
      expect(result.isOk()).toBe(true);
    });

    it('should validate correct collection path (odd segments)', () => {
      const result = firestoreOps.validatePath('users');
      expect(result.isOk()).toBe(true);
    });

    it('should validate nested collection path', () => {
      const result = firestoreOps.validatePath('users/doc1/orders');
      expect(result.isOk()).toBe(true);
    });

    it('should reject empty path', () => {
      const result = firestoreOps.validatePath('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject path with consecutive slashes', () => {
      const result = firestoreOps.validatePath('users//doc1');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject path starting with slash', () => {
      const result = firestoreOps.validatePath('/users/doc1');
      expect(result.isErr()).toBe(true);
    });

    it('should reject path ending with slash', () => {
      const result = firestoreOps.validatePath('users/doc1/');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('isDocumentPath', () => {
    it('should return true for document path (even segments)', () => {
      expect(firestoreOps.isDocumentPath('users/doc1')).toBe(true);
      expect(firestoreOps.isDocumentPath('users/doc1/orders/order1')).toBe(true);
    });

    it('should return false for collection path (odd segments)', () => {
      expect(firestoreOps.isDocumentPath('users')).toBe(false);
      expect(firestoreOps.isDocumentPath('users/doc1/orders')).toBe(false);
    });
  });

  describe('getDocument', () => {
    it('should get document with metadata', async () => {
      const result = await firestoreOps.getDocument('users/doc1');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.data).toEqual({ name: 'Test', value: 123 });
        expect(result.value.metadata.id).toBe('doc1');
        expect(result.value.metadata.path).toBe('users/doc1');
        expect(result.value.metadata.createTime).toBeInstanceOf(Date);
        expect(result.value.metadata.updateTime).toBeInstanceOf(Date);
        expect(result.value.metadata.readTime).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid path', async () => {
      const result = await firestoreOps.getDocument('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject collection path', async () => {
      const result = await firestoreOps.getDocument('users');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
        expect(result.error.message).toContain('ドキュメントパス');
      }
    });

    it('should return NOT_FOUND when document does not exist', async () => {
      mockDocSnapshot.exists = false;
      mockDocRef.get = vi.fn().mockResolvedValue(mockDocSnapshot);

      const result = await firestoreOps.getDocument('users/doc1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NOT_FOUND');
        expect(result.error.path).toBe('users/doc1');
      }
    });

    it('should handle Firestore errors', async () => {
      mockDocRef.get = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await firestoreOps.getDocument('users/doc1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FIRESTORE_ERROR');
      }
    });
  });

  describe('listDocuments', () => {
    it('should list documents in collection', async () => {
      const result = await firestoreOps.listDocuments('users');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].data).toEqual({ name: 'Test', value: 123 });
      }
    });

    it('should reject invalid path', async () => {
      const result = await firestoreOps.listDocuments('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject document path', async () => {
      const result = await firestoreOps.listDocuments('users/doc1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
        expect(result.error.message).toContain('コレクションパス');
      }
    });

    it('should handle Firestore errors', async () => {
      mockCollectionRef.listDocuments = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await firestoreOps.listDocuments('users');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FIRESTORE_ERROR');
      }
    });
  });

  describe('setDocument', () => {
    it('should set document data', async () => {
      const data = { name: 'New User', age: 30 };
      const result = await firestoreOps.setDocument('users/doc1', data);

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.set).toHaveBeenCalledWith(data, {});
    });

    it('should set document with merge option', async () => {
      const data = { name: 'Updated User' };
      const result = await firestoreOps.setDocument('users/doc1', data, true);

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.set).toHaveBeenCalledWith(data, { merge: true });
    });

    it('should reject invalid path', async () => {
      const result = await firestoreOps.setDocument('', {});

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject collection path', async () => {
      const result = await firestoreOps.setDocument('users', {});

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should handle Firestore errors', async () => {
      mockDocRef.set = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const result = await firestoreOps.setDocument('users/doc1', {});

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FIRESTORE_ERROR');
      }
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', async () => {
      const result = await firestoreOps.deleteDocument('users/doc1');

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should reject invalid path', async () => {
      const result = await firestoreOps.deleteDocument('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject collection path', async () => {
      const result = await firestoreOps.deleteDocument('users');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should handle Firestore errors', async () => {
      mockDocRef.delete = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const result = await firestoreOps.deleteDocument('users/doc1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FIRESTORE_ERROR');
      }
    });
  });
});
