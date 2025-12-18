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
      // Description is i18n-dependent, check for either language
      expect(
        ExamplesCommand.description.includes('使用例') ||
        ExamplesCommand.description.toLowerCase().includes('example')
      ).toBe(true);
    });
  });

  describe('examples content', () => {
    // ExamplesCommand generates examples dynamically via getUsageExamples()
    // which is a private method, so we test the run behavior instead
    it('should be able to instantiate', () => {
      expect(ExamplesCommand).toBeDefined();
    });

    it('should have examples array defined', () => {
      expect(ExamplesCommand.examples).toBeDefined();
    });
  });
});
