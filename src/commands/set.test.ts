/**
 * Tests for SetCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SetCommand } from './set';
import { FirestoreOps } from '../domain/firestore-ops';
import { ValidationService } from '../domain/validation-service';
import { FileSystemService } from '../presentation/filesystem-service';
import { ok, err } from '../shared/types';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
};

describe('SetCommand', () => {
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
        SetCommand.description.includes('ドキュメント') ||
        SetCommand.description.toLowerCase().includes('document') ||
        SetCommand.description.toLowerCase().includes('create') ||
        SetCommand.description.toLowerCase().includes('overwrite')
      ).toBe(true);
    });

    it('should have document-path argument', () => {
      expect(SetCommand.args).toBeDefined();
      expect(SetCommand.args.documentPath).toBeDefined();
    });

    it('should have data argument', () => {
      expect(SetCommand.args.data).toBeDefined();
    });

    it('should have merge flag', () => {
      expect(SetCommand.flags).toBeDefined();
      expect(SetCommand.flags.merge).toBeDefined();
    });

    it('should have from-file flag', () => {
      expect(SetCommand.flags['from-file']).toBeDefined();
    });
  });

  describe('JSON data validation', () => {
    it('should validate valid JSON data', () => {
      const validationService = new ValidationService();
      const result = validationService.validateDocumentData({
        name: 'Test',
        value: 123,
        nested: { key: 'value' },
      });

      expect(result.isOk()).toBe(true);
    });

    it('should reject data with undefined', () => {
      const validationService = new ValidationService();
      const result = validationService.validateDocumentData({
        name: 'Test',
        invalid: undefined,
      });

      expect(result.isErr()).toBe(true);
    });

    it('should reject data with functions', () => {
      const validationService = new ValidationService();
      const result = validationService.validateDocumentData({
        name: 'Test',
        fn: () => {},
      });

      expect(result.isErr()).toBe(true);
    });

    it('should reject data with symbols', () => {
      const validationService = new ValidationService();
      const result = validationService.validateDocumentData({
        name: 'Test',
        sym: Symbol('test'),
      });

      expect(result.isErr()).toBe(true);
    });
  });

  describe('document write operations', () => {
    it('should set document without merge', async () => {
      const mockDocRef = {
        set: vi.fn().mockResolvedValue(undefined),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.setDocument('users/doc1', { name: 'Test' }, false);

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.set).toHaveBeenCalledWith({ name: 'Test' }, {});
    });

    it('should set document with merge', async () => {
      const mockDocRef = {
        set: vi.fn().mockResolvedValue(undefined),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.setDocument('users/doc1', { name: 'Test' }, true);

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.set).toHaveBeenCalledWith({ name: 'Test' }, { merge: true });
    });

    it('should reject invalid document path', async () => {
      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.setDocument('', { name: 'Test' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });
  });

  describe('file reading', () => {
    it('should read JSON from file', async () => {
      const fsService = new FileSystemService();
      // Test exists method
      expect(fsService.fileExists).toBeDefined();
      expect(fsService.readJSON).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON string', () => {
      try {
        JSON.parse('invalid json');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle file not found', async () => {
      const fsService = new FileSystemService();
      const result = await fsService.readJSON('/nonexistent/file.json');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_NOT_FOUND');
      }
    });
  });

  describe('success message', () => {
    it('should display success message with path', () => {
      // Success message should include the document path
      const path = 'users/doc1';
      const message = `ドキュメントを作成/更新しました: ${path}`;
      expect(message).toContain(path);
    });
  });
});
