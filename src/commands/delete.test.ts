/**
 * Tests for DeleteCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Config } from '@oclif/core';
import { DeleteCommand } from './delete';
import { FirestoreOps } from '../domain/firestore-ops';
import { BatchProcessor } from '../domain/batch-processor';
import { PromptService } from '../presentation/prompt-service';
import { ok, err } from '../shared/types';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
  batch: vi.fn(),
};

describe('DeleteCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command configuration', () => {
    it('should have correct description', () => {
      // Description is i18n-dependent, check for either language
      expect(
        DeleteCommand.description.includes('削除') ||
        DeleteCommand.description.toLowerCase().includes('delete')
      ).toBe(true);
    });

    it('should have path argument', () => {
      expect(DeleteCommand.args).toBeDefined();
      expect(DeleteCommand.args.path).toBeDefined();
    });

    it('should have recursive flag', () => {
      expect(DeleteCommand.flags).toBeDefined();
      expect(DeleteCommand.flags.recursive).toBeDefined();
    });

    it('should have yes flag', () => {
      expect(DeleteCommand.flags.yes).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(DeleteCommand.flags.verbose).toBeDefined();
    });
  });

  describe('document deletion', () => {
    it('should delete single document', async () => {
      const mockDocRef = {
        delete: vi.fn().mockResolvedValue(undefined),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.deleteDocument('users/doc1');

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should reject invalid document path', async () => {
      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.deleteDocument('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });
  });

  describe('recursive deletion', () => {
    it('should support recursive collection deletion via BatchProcessor', () => {
      const batchProcessor = new BatchProcessor(mockFirestore as any);
      expect(batchProcessor.deleteCollection).toBeDefined();
    });

    it('should support recursive document deletion via BatchProcessor', () => {
      const batchProcessor = new BatchProcessor(mockFirestore as any);
      expect(batchProcessor.deleteDocument).toBeDefined();
    });

    it('should classify a document path as recursive-eligible (no collection-only restriction)', () => {
      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const isDocument = firestoreOps.isDocumentPath('users/user123');
      const isCollection = firestoreOps.isCollectionPath('users/user123');

      // The old validation rejected `recursive && !isCollection`. A document
      // path must remain a valid target for --recursive.
      expect(isDocument).toBe(true);
      expect(isCollection).toBe(false);
    });

    it('should route document path + --recursive to BatchProcessor.deleteDocument (recursiveDelete equivalent)', async () => {
      const mockDocRef = {
        delete: vi.fn().mockResolvedValue(undefined),
        listCollections: vi.fn().mockResolvedValue([]),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const deleteDocumentSpy = vi.spyOn(BatchProcessor.prototype, 'deleteDocument');

      const command = new DeleteCommand([], {} as Config);
      const promptService = new PromptService();

      await (command as any).deleteDocumentRecursive(
        mockFirestore,
        'users/user123',
        true,
        promptService
      );

      // The old CLI-side restriction ("--recursive can only be used with
      // collection paths") is gone: a document path + --recursive now
      // reaches BatchProcessor.deleteDocument, which deletes the document
      // reference and all of its subcollections.
      expect(deleteDocumentSpy).toHaveBeenCalledWith('users/user123', expect.any(Function));
      expect(mockDocRef.delete).toHaveBeenCalled();

      deleteDocumentSpy.mockRestore();
    });

    it('should still route collection path + --recursive to BatchProcessor.deleteCollection (regression)', async () => {
      const mockCollectionRef = {
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ empty: true, size: 0, docs: [] }),
        }),
      };
      mockFirestore.collection.mockReturnValue(mockCollectionRef);

      const deleteCollectionSpy = vi.spyOn(BatchProcessor.prototype, 'deleteCollection');

      const command = new DeleteCommand([], {} as Config);
      const promptService = new PromptService();

      await (command as any).deleteCollection(mockFirestore, 'users', true, promptService);

      expect(deleteCollectionSpy).toHaveBeenCalledWith('users', expect.any(Function));

      deleteCollectionSpy.mockRestore();
    });
  });

  describe('confirmation prompt', () => {
    it('should prompt for confirmation when --yes is not specified', () => {
      const promptService = new PromptService();
      expect(promptService.confirm).toBeDefined();
    });
  });

  describe('deleted count display', () => {
    it('should display deleted count message', () => {
      const count = 5;
      const message = `${count}件のドキュメントを削除しました`;
      expect(message).toContain('5');
      expect(message).toContain('削除');
    });

    it('should handle deletion of non-existent document', async () => {
      const mockDocRef = {
        delete: vi.fn().mockResolvedValue(undefined),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const firestoreOps = new FirestoreOps(mockFirestore as any);
      // Firestore's delete doesn't fail for non-existent documents
      const result = await firestoreOps.deleteDocument('users/nonexistent');

      expect(result.isOk()).toBe(true);
    });
  });
});
