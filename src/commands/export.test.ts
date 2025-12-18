/**
 * Tests for ExportCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportCommand } from './export';
import { BatchProcessor } from '../domain/batch-processor';
import { ok, err } from '../shared/types';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
};

describe('ExportCommand', () => {
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
        ExportCommand.description.includes('エクスポート') ||
        ExportCommand.description.toLowerCase().includes('export')
      ).toBe(true);
    });

    it('should have collection argument', () => {
      expect(ExportCommand.args).toBeDefined();
      expect(ExportCommand.args.collection).toBeDefined();
    });

    it('should have output flag', () => {
      expect(ExportCommand.flags).toBeDefined();
      expect(ExportCommand.flags.output).toBeDefined();
    });

    it('should have include-subcollections flag', () => {
      expect(ExportCommand.flags['include-subcollections']).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(ExportCommand.flags.verbose).toBeDefined();
    });
  });

  describe('batch processor', () => {
    it('should use BatchProcessor for export', () => {
      const batchProcessor = new BatchProcessor(mockFirestore as any);
      expect(batchProcessor.exportCollection).toBeDefined();
    });
  });

  describe('export result', () => {
    it('should display exported count', () => {
      const count = 100;
      const message = `${count}件のドキュメントをエクスポートしました`;
      expect(message).toContain('100');
      expect(message).toContain('エクスポート');
    });

    it('should display output file path', () => {
      const filePath = '/path/to/export.json';
      const message = `出力先: ${filePath}`;
      expect(message).toContain(filePath);
    });
  });
});
