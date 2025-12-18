/**
 * Tests for ExamplesCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExamplesCommand } from './examples';

describe('ExamplesCommand', () => {
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
      expect(ExamplesCommand.description).toContain('使用例');
    });
  });

  describe('examples content', () => {
    it('should have EXAMPLES constant with usage examples', () => {
      expect(ExamplesCommand.USAGE_EXAMPLES).toBeDefined();
      expect(ExamplesCommand.USAGE_EXAMPLES.length).toBeGreaterThan(0);
    });

    it('should include get command example', () => {
      const hasGetExample = ExamplesCommand.USAGE_EXAMPLES.some(
        (example) => example.command.includes('get')
      );
      expect(hasGetExample).toBe(true);
    });

    it('should include set command example', () => {
      const hasSetExample = ExamplesCommand.USAGE_EXAMPLES.some(
        (example) => example.command.includes('set')
      );
      expect(hasSetExample).toBe(true);
    });

    it('should include list command example', () => {
      const hasListExample = ExamplesCommand.USAGE_EXAMPLES.some(
        (example) => example.command.includes('list')
      );
      expect(hasListExample).toBe(true);
    });

    it('should include delete command example', () => {
      const hasDeleteExample = ExamplesCommand.USAGE_EXAMPLES.some(
        (example) => example.command.includes('delete')
      );
      expect(hasDeleteExample).toBe(true);
    });

    it('should include export/import examples', () => {
      const hasExportExample = ExamplesCommand.USAGE_EXAMPLES.some(
        (example) => example.command.includes('export')
      );
      const hasImportExample = ExamplesCommand.USAGE_EXAMPLES.some(
        (example) => example.command.includes('import')
      );
      expect(hasExportExample).toBe(true);
      expect(hasImportExample).toBe(true);
    });
  });
});
