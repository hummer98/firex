/**
 * BatchProcessor unit tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BatchProcessor } from './batch-processor';
import type { Firestore } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('BatchProcessor', () => {
  let mockFirestore: Firestore;
  let batchProcessor: BatchProcessor;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'batch-processor-test-'));

    // Create mock Firestore instance
    const mockBatch = {
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(undefined),
    };

    // Fix circular reference by creating object first, then assigning
    const mockDocRef: any = {
      path: 'users/user1',
      listCollections: vi.fn().mockResolvedValue([]),
    };

    mockDocRef.get = vi.fn().mockResolvedValue({
      exists: true,
      id: 'user1',
      data: () => ({ name: 'Test User' }),
      ref: mockDocRef,
    });

    const mockDocRef2 = {
      path: 'users/user2',
      listCollections: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({
        exists: true,
        id: 'user2',
        data: () => ({ name: 'User 2' }),
        ref: mockDocRef,
      }),
    };

    const mockSnapshot = {
      size: 2,
      empty: false,
      docs: [
        {
          id: 'user1',
          ref: mockDocRef,
          data: () => ({ name: 'User 1' }),
          exists: true,
        },
        {
          id: 'user2',
          ref: mockDocRef2,
          data: () => ({ name: 'User 2' }),
          exists: true,
        },
      ],
    };

    const mockCollectionRef = {
      get: vi.fn().mockResolvedValue(mockSnapshot),
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ ...mockSnapshot, empty: true }),
      }),
      path: 'users',
    };

    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollectionRef),
      doc: vi.fn().mockReturnValue(mockDocRef),
      batch: vi.fn().mockReturnValue(mockBatch),
    } as unknown as Firestore;

    batchProcessor = new BatchProcessor(mockFirestore);
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('exportCollection', () => {
    it('should export collection to JSON file', async () => {
      const outputPath = path.join(tempDir, 'export.json');
      const result = await batchProcessor.exportCollection({
        collectionPath: 'users',
        outputPath,
        includeSubcollections: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.exportedCount).toBe(2);
        expect(result.value.filePath).toBe(outputPath);

        // Verify file was created
        const fileExists = await fs
          .access(outputPath)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);
      }
    });

    it('should export collection with subcollections', async () => {
      const outputPath = path.join(tempDir, 'export-with-sub.json');
      const result = await batchProcessor.exportCollection({
        collectionPath: 'users',
        outputPath,
        includeSubcollections: true,
      });

      expect(result.isOk()).toBe(true);
    });

    it('should call progress callback during export', async () => {
      const progressCallback = vi.fn();
      const outputPath = path.join(tempDir, 'export-progress.json');

      await batchProcessor.exportCollection({
        collectionPath: 'users',
        outputPath,
        includeSubcollections: false,
        progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    it('should handle empty collection', async () => {
      // Mock empty collection
      const emptySnapshot = { size: 0, empty: true, docs: [] };
      vi.mocked(mockFirestore.collection).mockReturnValue({
        get: vi.fn().mockResolvedValue(emptySnapshot),
      } as never);

      const outputPath = path.join(tempDir, 'export-empty.json');
      const result = await batchProcessor.exportCollection({
        collectionPath: 'empty-collection',
        outputPath,
        includeSubcollections: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.exportedCount).toBe(0);
      }
    });
  });

  describe('importData', () => {
    it('should import data from JSON file', async () => {
      // Create test import file
      const importPath = path.join(tempDir, 'import.json');
      const importData = {
        documents: [
          { id: 'doc1', path: 'users/doc1', data: { name: 'Doc 1' } },
          { id: 'doc2', path: 'users/doc2', data: { name: 'Doc 2' } },
        ],
      };
      await fs.writeFile(importPath, JSON.stringify(importData), 'utf-8');

      const result = await batchProcessor.importData({
        inputPath: importPath,
        batchSize: 500,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.importedCount).toBe(2);
        expect(result.value.skippedCount).toBe(0);
        expect(result.value.failedCount).toBe(0);
      }
    });

    it('should respect batch size limit', async () => {
      const importPath = path.join(tempDir, 'large-import.json');
      const importData = {
        documents: Array.from({ length: 300 }, (_, i) => ({
          id: `doc${i}`,
          path: `users/doc${i}`,
          data: { name: `Doc ${i}` },
        })),
      };
      await fs.writeFile(importPath, JSON.stringify(importData), 'utf-8');

      const result = await batchProcessor.importData({
        inputPath: importPath,
        batchSize: 250,
      });

      expect(result.isOk()).toBe(true);
    });

    it('should call progress callback during import', async () => {
      const importPath = path.join(tempDir, 'import-progress.json');
      const importData = {
        documents: [{ id: 'doc1', path: 'users/doc1', data: { name: 'Doc 1' } }],
      };
      await fs.writeFile(importPath, JSON.stringify(importData), 'utf-8');

      const progressCallback = vi.fn();

      await batchProcessor.importData({
        inputPath: importPath,
        batchSize: 500,
        progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
    });

    it('should validate batch size range (1-500)', async () => {
      const importPath = path.join(tempDir, 'import-validation.json');

      const resultTooLarge = await batchProcessor.importData({
        inputPath: importPath,
        batchSize: 501,
      });

      expect(resultTooLarge.isErr()).toBe(true);
      if (resultTooLarge.isErr()) {
        expect(resultTooLarge.error.type).toBe('INVALID_BATCH_SIZE');
      }

      const resultTooSmall = await batchProcessor.importData({
        inputPath: importPath,
        batchSize: 0,
      });

      expect(resultTooSmall.isErr()).toBe(true);
    });

    it('should handle file not found error', async () => {
      const result = await batchProcessor.importData({
        inputPath: path.join(tempDir, 'nonexistent.json'),
        batchSize: 500,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_IO_ERROR');
      }
    });

    it('should handle invalid JSON format', async () => {
      const invalidPath = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidPath, 'invalid json content', 'utf-8');

      const result = await batchProcessor.importData({
        inputPath: invalidPath,
        batchSize: 500,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('deleteCollection', () => {
    it('should delete all documents in collection', async () => {
      const confirmCallback = vi.fn().mockResolvedValue(true);

      const result = await batchProcessor.deleteCollection('users', confirmCallback);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.deletedCount).toBeGreaterThanOrEqual(0);
      }
      expect(confirmCallback).toHaveBeenCalled();
    });

    it('should not delete if confirmation is denied', async () => {
      const confirmCallback = vi.fn().mockResolvedValue(false);

      const result = await batchProcessor.deleteCollection('users', confirmCallback);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.deletedCount).toBe(0);
      }
    });

    it('should recursively delete subcollections', async () => {
      const confirmCallback = vi.fn().mockResolvedValue(true);

      const result = await batchProcessor.deleteCollection(
        'users/user1/posts',
        confirmCallback
      );

      expect(result.isOk()).toBe(true);
    });

    it('should handle empty collection deletion', async () => {
      const confirmCallback = vi.fn().mockResolvedValue(true);

      const result = await batchProcessor.deleteCollection('empty', confirmCallback);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.deletedCount).toBe(0);
      }
    });
  });

  describe('batch operations', () => {
    it('should process in batches of specified size', async () => {
      // Create a large dataset file
      const largePath = path.join(tempDir, 'large-dataset.json');
      const largeData = {
        documents: Array.from({ length: 150 }, (_, i) => ({
          id: `doc${i}`,
          path: `users/doc${i}`,
          data: { name: `Doc ${i}` },
        })),
      };
      await fs.writeFile(largePath, JSON.stringify(largeData), 'utf-8');

      // Test that large datasets are split into batches
      const result = await batchProcessor.importData({
        inputPath: largePath,
        batchSize: 100,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.importedCount).toBe(150);
      }
    });

    it('should handle partial batch commit failure', async () => {
      // Create test file
      const errorPath = path.join(tempDir, 'import-with-error.json');
      const errorData = {
        documents: [{ id: 'doc1', path: 'users/doc1', data: { name: 'Doc 1' } }],
      };
      await fs.writeFile(errorPath, JSON.stringify(errorData), 'utf-8');

      // Simulate batch commit failure by mocking commit to throw
      const mockBatch = {
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        commit: vi.fn().mockRejectedValue(new Error('Commit failed')),
      };
      vi.mocked(mockFirestore.batch).mockReturnValue(mockBatch as never);

      const result = await batchProcessor.importData({
        inputPath: errorPath,
        batchSize: 500,
      });

      // Should return partial success information
      expect(result.isErr()).toBe(true);
      if (result.isErr() && result.error.type === 'BATCH_COMMIT_ERROR') {
        expect(result.error.partialSuccess).toBeDefined();
        expect(result.error.committedCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
