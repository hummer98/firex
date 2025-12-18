/**
 * OutputFormatter unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OutputFormatter } from './output-formatter';
import type { DocumentWithMeta } from '../shared/types';

describe('OutputFormatter', () => {
  let formatter: OutputFormatter;
  let sampleDocument: DocumentWithMeta;

  beforeEach(() => {
    formatter = new OutputFormatter();

    sampleDocument = {
      data: {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        active: true,
      },
      metadata: {
        id: 'user123',
        path: 'users/user123',
        createTime: new Date('2024-01-01T00:00:00Z'),
        updateTime: new Date('2024-01-02T00:00:00Z'),
      },
    };
  });

  describe('formatDocument', () => {
    it('should format document as JSON', () => {
      const result = formatter.formatDocument(sampleDocument, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('"name": "John Doe"');
        expect(output).toContain('"age": 30');
      }
    });

    it('should format document as YAML', () => {
      const result = formatter.formatDocument(sampleDocument, 'yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('name: John Doe');
        expect(output).toContain('age: 30');
      }
    });

    it('should format document as table', () => {
      const result = formatter.formatDocument(sampleDocument, 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('name');
        expect(output).toContain('John Doe');
      }
    });

    it('should include metadata when requested', () => {
      const result = formatter.formatDocument(sampleDocument, 'json', {
        includeMetadata: true,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('user123');
        expect(output).toContain('users/user123');
      }
    });

    it('should exclude metadata by default', () => {
      const result = formatter.formatDocument(sampleDocument, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).not.toContain('metadata');
      }
    });

    it('should handle nested objects', () => {
      const complexDoc: DocumentWithMeta = {
        data: {
          user: {
            profile: {
              name: 'John',
              address: {
                city: 'Tokyo',
              },
            },
          },
        },
        metadata: {
          id: 'doc1',
          path: 'docs/doc1',
        },
      };

      const result = formatter.formatDocument(complexDoc, 'json');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('formatDocuments', () => {
    it('should format multiple documents as JSON array', () => {
      const docs: DocumentWithMeta[] = [
        sampleDocument,
        {
          data: { name: 'Jane Doe', age: 25 },
          metadata: { id: 'user124', path: 'users/user124' },
        },
      ];

      const result = formatter.formatDocuments(docs, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('John Doe');
        expect(output).toContain('Jane Doe');
      }
    });

    it('should format multiple documents as YAML', () => {
      const docs: DocumentWithMeta[] = [sampleDocument];

      const result = formatter.formatDocuments(docs, 'yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('name: John Doe');
      }
    });

    it('should format multiple documents as table', () => {
      const docs: DocumentWithMeta[] = [
        sampleDocument,
        {
          data: { name: 'Jane Doe', age: 25 },
          metadata: { id: 'user124', path: 'users/user124' },
        },
      ];

      const result = formatter.formatDocuments(docs, 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('John Doe');
        expect(output).toContain('Jane Doe');
      }
    });

    it('should handle empty array', () => {
      const result = formatter.formatDocuments([], 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('[]');
      }
    });
  });

  describe('formatChange', () => {
    it('should format document change with type', () => {
      const change = {
        type: 'added' as const,
        document: sampleDocument,
      };

      const result = formatter.formatChange(change, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('added');
        expect(output).toContain('John Doe');
      }
    });

    it('should format modified document', () => {
      const change = {
        type: 'modified' as const,
        document: sampleDocument,
      };

      const result = formatter.formatChange(change, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('modified');
      }
    });

    it('should format removed document', () => {
      const change = {
        type: 'removed' as const,
        document: sampleDocument,
      };

      const result = formatter.formatChange(change, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('removed');
      }
    });

    it('should support table format for changes', () => {
      const change = {
        type: 'added' as const,
        document: sampleDocument,
      };

      const result = formatter.formatChange(change, 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('added');
      }
    });
  });

  describe('formatMetadata', () => {
    it('should format metadata as table', () => {
      const result = formatter.formatMetadata(sampleDocument.metadata);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('user123');
        expect(output).toContain('users/user123');
      }
    });

    it('should include timestamps when available', () => {
      const result = formatter.formatMetadata(sampleDocument.metadata);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('2024');
      }
    });
  });

  describe('error handling', () => {
    it('should handle formatting errors gracefully', () => {
      const invalidDoc: any = {
        data: {
          circular: null,
        },
        metadata: { id: 'doc1', path: 'docs/doc1' },
      };

      // Create circular reference
      invalidDoc.data.circular = invalidDoc.data;

      const result = formatter.formatDocument(invalidDoc, 'json');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FORMAT_ERROR');
      }
    });
  });

  describe('formatCollections', () => {
    it('should format collections as JSON with count', () => {
      const collections = ['users', 'posts', 'comments'];
      const result = formatter.formatCollections(collections, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        const parsed = JSON.parse(output);
        expect(parsed.collections).toEqual(['users', 'posts', 'comments']);
        expect(parsed.count).toBe(3);
      }
    });

    it('should format collections as JSON with quiet mode (array only)', () => {
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'json', { quiet: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        const parsed = JSON.parse(output);
        expect(parsed).toEqual(['users', 'posts']);
      }
    });

    it('should format collections as YAML', () => {
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('collections:');
        expect(output).toContain('- users');
        expect(output).toContain('- posts');
        expect(output).toContain('count: 2');
      }
    });

    it('should format collections as YAML with quiet mode', () => {
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'yaml', { quiet: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('- users');
        expect(output).toContain('- posts');
        expect(output).not.toContain('count:');
      }
    });

    it('should format collections as table', () => {
      const collections = ['users', 'posts'];
      const result = formatter.formatCollections(collections, 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('users');
        expect(output).toContain('posts');
        expect(output).toContain('Collection');
      }
    });

    it('should handle empty collections array for JSON', () => {
      const result = formatter.formatCollections([], 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        const parsed = JSON.parse(output);
        expect(parsed.collections).toEqual([]);
        expect(parsed.count).toBe(0);
      }
    });

    it('should handle empty collections array for YAML', () => {
      const result = formatter.formatCollections([], 'yaml');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('collections: []');
        expect(output).toContain('count: 0');
      }
    });

    it('should handle empty collections array for table', () => {
      const result = formatter.formatCollections([], 'table');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const output = result.value;
        expect(output).toContain('(No collections)');
      }
    });
  });
});
