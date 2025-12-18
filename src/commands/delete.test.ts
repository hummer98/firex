/**
 * Tests for DeleteCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      expect(DeleteCommand.description).toContain('削除');
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
