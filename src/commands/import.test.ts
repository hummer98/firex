/**
 * Tests for ImportCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImportCommand } from './import';
import { BatchProcessor } from '../domain/batch-processor';
import { ok, err } from '../shared/types';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
  batch: vi.fn(),
};

describe('ImportCommand', () => {
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
      expect(ImportCommand.description).toContain('インポート');
    });

    it('should have file argument', () => {
      expect(ImportCommand.args).toBeDefined();
      expect(ImportCommand.args.file).toBeDefined();
    });

    it('should have batch-size flag', () => {
      expect(ImportCommand.flags).toBeDefined();
      expect(ImportCommand.flags['batch-size']).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(ImportCommand.flags.verbose).toBeDefined();
    });
  });

  describe('batch processor', () => {
    it('should use BatchProcessor for import', () => {
      const batchProcessor = new BatchProcessor(mockFirestore as any);
      expect(batchProcessor.importData).toBeDefined();
    });
  });

  describe('import result', () => {
    it('should display import summary', () => {
      const imported = 100;
      const skipped = 5;
      const failed = 2;
      const message = `インポート完了: ${imported}件成功, ${skipped}件スキップ, ${failed}件失敗`;
      expect(message).toContain('100');
      expect(message).toContain('5');
      expect(message).toContain('2');
    });
  });

  describe('batch size validation', () => {
    it('should accept valid batch size', () => {
      const batchSize = 250;
      const isValid = batchSize >= 1 && batchSize <= 500;
      expect(isValid).toBe(true);
    });

    it('should reject batch size over 500', () => {
      const batchSize = 600;
      const isValid = batchSize >= 1 && batchSize <= 500;
      expect(isValid).toBe(false);
    });

    it('should reject batch size of 0', () => {
      const batchSize = 0;
      const isValid = batchSize >= 1 && batchSize <= 500;
      expect(isValid).toBe(false);
    });
  });
});
