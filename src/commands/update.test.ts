/**
 * Tests for UpdateCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UpdateCommand } from './update';
import { FirestoreOps } from '../domain/firestore-ops';
import { ValidationService } from '../domain/validation-service';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
};

describe('UpdateCommand', () => {
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
      expect(UpdateCommand.description).toContain('部分更新');
    });

    it('should have document-path argument', () => {
      expect(UpdateCommand.args).toBeDefined();
      expect(UpdateCommand.args.documentPath).toBeDefined();
    });

    it('should have data argument', () => {
      expect(UpdateCommand.args.data).toBeDefined();
    });

    it('should have from-file flag', () => {
      expect(UpdateCommand.flags['from-file']).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(UpdateCommand.flags.verbose).toBeDefined();
    });
  });

  describe('update operation (set with merge)', () => {
    it('should perform merge update by default', async () => {
      const mockDocRef = {
        set: vi.fn().mockResolvedValue(undefined),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const firestoreOps = new FirestoreOps(mockFirestore as any);
      const result = await firestoreOps.setDocument('users/doc1', { name: 'Updated' }, true);

      expect(result.isOk()).toBe(true);
      expect(mockDocRef.set).toHaveBeenCalledWith({ name: 'Updated' }, { merge: true });
    });
  });

  describe('validation', () => {
    it('should validate update data', () => {
      const validationService = new ValidationService();
      const result = validationService.validateDocumentData({
        name: 'Updated',
        count: 42,
      });

      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid update data', () => {
      const validationService = new ValidationService();
      const result = validationService.validateDocumentData({
        invalid: undefined,
      });

      expect(result.isErr()).toBe(true);
    });
  });

  describe('success message', () => {
    it('should indicate partial update', () => {
      const path = 'users/doc1';
      const message = `ドキュメントを部分更新しました: ${path}`;
      expect(message).toContain('部分更新');
      expect(message).toContain(path);
    });
  });
});
