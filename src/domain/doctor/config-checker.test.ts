/**
 * Tests for ConfigChecker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigChecker } from './config-checker';

describe('ConfigChecker', () => {
  describe('checkConfigFile', () => {
    it('should return success when .firex.yaml exists', async () => {
      const checker = new ConfigChecker({
        fileExists: (path) => path.endsWith('.firex.yaml'),
        readFile: async () => 'projectId: my-project',
      });

      const result = await checker.checkConfigFile('/path/to/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('config-file');
      }
    });

    it('should return success when .firex.json exists', async () => {
      const checker = new ConfigChecker({
        fileExists: (path) => path.endsWith('.firex.json'),
        readFile: async () => '{"projectId": "my-project"}',
      });

      const result = await checker.checkConfigFile('/path/to/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('config-file');
      }
    });

    it('should return info (success) when no config file exists', async () => {
      const checker = new ConfigChecker({
        fileExists: () => false,
      });

      const result = await checker.checkConfigFile('/path/to/project');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Not finding config is OK - uses defaults
        expect(['success', 'warning']).toContain(result.value.status);
        expect(result.value.category).toBe('config-file');
      }
    });
  });

  describe('validateConfigSyntax', () => {
    it('should return success for valid YAML', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSyntax(
        '/path/.firex.yaml',
        'projectId: my-project\ndefaultListLimit: 100'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('config-syntax');
      }
    });

    it('should return success for valid JSON', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSyntax(
        '/path/.firex.json',
        '{"projectId": "my-project", "defaultListLimit": 100}'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('config-syntax');
      }
    });

    it('should return error for invalid YAML with position info', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSyntax(
        '/path/.firex.yaml',
        'projectId: my-project\n  invalid: indentation'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('config-syntax');
        expect(result.value.details).toBeDefined();
      }
    });

    it('should return error for invalid JSON', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSyntax(
        '/path/.firex.json',
        '{"projectId": "my-project"'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('config-syntax');
      }
    });
  });

  describe('validateConfigSchema', () => {
    it('should return success for valid config object', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSchema({
        projectId: 'my-project',
        defaultListLimit: 100,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('config-schema');
      }
    });

    it('should return error for invalid config values', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSchema({
        projectId: 123, // Should be string
        defaultListLimit: 'invalid', // Should be number
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('config-schema');
        expect(result.value.details).toBeDefined();
      }
    });

    it('should return success for empty config (all optional)', () => {
      const checker = new ConfigChecker();

      const result = checker.validateConfigSchema({});

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
      }
    });
  });

  describe('validateCollectionPaths', () => {
    it('should return success for valid collection paths', () => {
      const checker = new ConfigChecker();

      const result = checker.validateCollectionPaths(['users', 'posts', 'users/user1/comments']);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('collection-paths');
      }
    });

    it('should return error for invalid collection paths (even segments)', () => {
      const checker = new ConfigChecker();

      // Document path (even segments) instead of collection path
      const result = checker.validateCollectionPaths(['users/user1']);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.category).toBe('collection-paths');
        expect(result.value.details).toContain('users/user1');
      }
    });

    it('should return success for empty paths array', () => {
      const checker = new ConfigChecker();

      const result = checker.validateCollectionPaths([]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
      }
    });

    it('should detect multiple invalid paths', () => {
      const checker = new ConfigChecker();

      const result = checker.validateCollectionPaths([
        'users', // valid
        'users/user1', // invalid (document)
        'posts/post1', // invalid (document)
      ]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('error');
        expect(result.value.details).toContain('users/user1');
        expect(result.value.details).toContain('posts/post1');
      }
    });
  });
});
