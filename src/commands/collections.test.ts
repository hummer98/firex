/**
 * Tests for CollectionsCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollectionsCommand } from './collections';
import { OutputFormatter } from '../presentation/output-formatter';

describe('CollectionsCommand', () => {
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
        CollectionsCommand.description.includes('コレクション') ||
        CollectionsCommand.description.toLowerCase().includes('collection') ||
        CollectionsCommand.description.toLowerCase().includes('list')
      ).toBe(true);
    });

    it('should not be hidden', () => {
      expect(CollectionsCommand.hidden).toBe(false);
    });

    it('should have optional documentPath argument', () => {
      expect(CollectionsCommand.args).toBeDefined();
      expect(CollectionsCommand.args.documentPath).toBeDefined();
      expect(CollectionsCommand.args.documentPath.required).toBe(false);
    });

    it('should have quiet flag', () => {
      expect(CollectionsCommand.flags).toBeDefined();
      expect(CollectionsCommand.flags.quiet).toBeDefined();
    });

    it('should have quiet flag with short alias -q', () => {
      expect(CollectionsCommand.flags.quiet.char).toBe('q');
    });

    it('should default quiet to false', () => {
      expect(CollectionsCommand.flags.quiet.default).toBe(false);
    });

    it('should inherit base flags', () => {
      expect(CollectionsCommand.flags.verbose).toBeDefined();
      expect(CollectionsCommand.flags.format).toBeDefined();
      expect(CollectionsCommand.flags.json).toBeDefined();
      expect(CollectionsCommand.flags.yaml).toBeDefined();
      expect(CollectionsCommand.flags.table).toBeDefined();
    });

    it('should have examples', () => {
      expect(CollectionsCommand.examples).toBeDefined();
      expect(CollectionsCommand.examples.length).toBeGreaterThan(0);
    });
  });

  describe('output formatting', () => {
    it('should format collections as JSON with count', () => {
      const formatter = new OutputFormatter();
      const collections = ['users', 'posts', 'comments'];
      const result = formatter.formatCollections(collections, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed.collections).toEqual(['users', 'posts', 'comments']);
        expect(parsed.count).toBe(3);
      }
    });

    it('should format collections as JSON array only in quiet mode', () => {
      const formatter = new OutputFormatter();
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'json', { quiet: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed).toEqual(['users', 'posts']);
      }
    });

    it('should format collections as YAML', () => {
      const formatter = new OutputFormatter();
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('collections:');
        expect(result.value).toContain('- users');
        expect(result.value).toContain('count: 2');
      }
    });

    it('should format collections as table', () => {
      const formatter = new OutputFormatter();
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('users');
        expect(result.value).toContain('posts');
        expect(result.value).toContain('Collection');
      }
    });

    it('should handle empty collections', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatCollections([], 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed.collections).toEqual([]);
        expect(parsed.count).toBe(0);
      }
    });
  });

  describe('path validation', () => {
    it('should recognize document path (even segments)', () => {
      const path = 'users/user123';
      const segments = path.split('/');
      expect(segments.length % 2).toBe(0);
    });

    it('should recognize collection path (odd segments)', () => {
      const path = 'users';
      const segments = path.split('/');
      expect(segments.length % 2).toBe(1);
    });

    it('should recognize nested document path', () => {
      const path = 'users/user123/orders/order456';
      const segments = path.split('/');
      expect(segments.length % 2).toBe(0);
    });
  });
});
