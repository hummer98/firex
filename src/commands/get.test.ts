/**
 * Tests for GetCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetCommand } from './get';
import { FirestoreOps } from '../domain/firestore-ops';
import { WatchService } from '../domain/watch-service';
import { OutputFormatter } from '../presentation/output-formatter';
import { ok, err, DocumentWithMeta } from '../shared/types';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
};

// Mock document data
const mockDocument: DocumentWithMeta = {
  data: { name: 'Test', value: 123 },
  metadata: {
    id: 'doc1',
    path: 'users/doc1',
    createTime: new Date('2024-01-01'),
    updateTime: new Date('2024-01-02'),
  },
};

describe('GetCommand', () => {
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
      expect(GetCommand.description).toContain('ドキュメント');
    });

    it('should have document-path argument', () => {
      expect(GetCommand.args).toBeDefined();
      expect(GetCommand.args.documentPath).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(GetCommand.flags).toBeDefined();
      expect(GetCommand.flags.verbose).toBeDefined();
      expect(GetCommand.flags.format).toBeDefined();
    });

    it('should have watch flag', () => {
      expect(GetCommand.flags.watch).toBeDefined();
    });

    it('should have show-initial flag', () => {
      expect(GetCommand.flags['show-initial']).toBeDefined();
    });
  });

  describe('document path validation', () => {
    it('should validate document path format (even segments)', () => {
      // Document paths must have even number of segments (collection/doc)
      const firestoreOps = new FirestoreOps(mockFirestore as any);

      // Valid document path
      const validResult = firestoreOps.validatePath('users/doc1');
      expect(validResult.isOk()).toBe(true);

      // Even segment count check
      expect(firestoreOps.isDocumentPath('users/doc1')).toBe(true);
      expect(firestoreOps.isDocumentPath('users')).toBe(false);
    });

    it('should reject collection paths (odd segments)', () => {
      const firestoreOps = new FirestoreOps(mockFirestore as any);

      // Collection paths have odd number of segments
      expect(firestoreOps.isCollectionPath('users')).toBe(true);
      expect(firestoreOps.isCollectionPath('users/doc1')).toBe(false);
    });
  });

  describe('output formatting', () => {
    it('should format document as JSON', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatDocument(mockDocument, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed.name).toBe('Test');
        expect(parsed.value).toBe(123);
      }
    });

    it('should format document as YAML', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatDocument(mockDocument, 'yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('name: Test');
        expect(result.value).toContain('value: 123');
      }
    });

    it('should format document as table', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatDocument(mockDocument, 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('name');
        expect(result.value).toContain('Test');
      }
    });

    it('should include metadata when requested', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatDocument(mockDocument, 'json', {
        includeMetadata: true,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed._metadata).toBeDefined();
        expect(parsed._metadata.id).toBe('doc1');
      }
    });
  });

  describe('error handling', () => {
    it('should handle document not found', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({ exists: false, id: 'doc1', ref: { path: 'users/doc1' } }),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.getDocument('users/doc1');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NOT_FOUND');
      }
    });

    it('should handle invalid path format', async () => {
      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.getDocument('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });
  });

  describe('watch mode', () => {
    it('should support watch flag for real-time monitoring', () => {
      const watchService = new WatchService(mockFirestore as any);

      // Verify watch service can be instantiated
      expect(watchService).toBeDefined();
      expect(watchService.watchDocument).toBeDefined();
    });

    it('should format document changes correctly', () => {
      const formatter = new OutputFormatter();
      const change = {
        type: 'modified' as const,
        document: mockDocument,
      };

      const result = formatter.formatChange(change, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed.changeType).toBe('modified');
        expect(parsed.data.name).toBe('Test');
      }
    });
  });
});
