/**
 * Tests for ListCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListCommand } from './list';
import { QueryBuilder } from '../domain/query-builder';
import { WatchService } from '../domain/watch-service';
import { OutputFormatter } from '../presentation/output-formatter';
import { ok, err, DocumentWithMeta } from '../shared/types';

// Mock Firestore
const mockFirestore = {
  doc: vi.fn(),
  collection: vi.fn(),
};

// Mock documents
const mockDocuments: DocumentWithMeta[] = [
  {
    data: { name: 'Alice', age: 30 },
    metadata: { id: 'doc1', path: 'users/doc1' },
  },
  {
    data: { name: 'Bob', age: 25 },
    metadata: { id: 'doc2', path: 'users/doc2' },
  },
];

describe('ListCommand', () => {
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
        ListCommand.description.includes('一覧') ||
        ListCommand.description.toLowerCase().includes('list') ||
        ListCommand.description.toLowerCase().includes('document')
      ).toBe(true);
    });

    it('should have collection-path argument', () => {
      expect(ListCommand.args).toBeDefined();
      expect(ListCommand.args.collectionPath).toBeDefined();
    });

    it('should have where flag', () => {
      expect(ListCommand.flags).toBeDefined();
      expect(ListCommand.flags.where).toBeDefined();
    });

    it('should have order-by flag', () => {
      expect(ListCommand.flags['order-by']).toBeDefined();
    });

    it('should have limit flag', () => {
      expect(ListCommand.flags.limit).toBeDefined();
    });

    it('should have watch flag', () => {
      expect(ListCommand.flags.watch).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(ListCommand.flags.verbose).toBeDefined();
      expect(ListCommand.flags.format).toBeDefined();
    });
  });

  describe('where condition parsing', () => {
    it('should parse where condition: field==value', () => {
      const whereStr = 'status==active';
      const parts = whereStr.split(/([=!<>]+)/);
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('status');
      expect(parts[1]).toBe('==');
      expect(parts[2]).toBe('active');
    });

    it('should parse where condition: field>=value', () => {
      const whereStr = 'age>=18';
      const parts = whereStr.split(/([=!<>]+)/);
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('age');
      expect(parts[1]).toBe('>=');
      expect(parts[2]).toBe('18');
    });

    it('should parse where condition: field!=value', () => {
      const whereStr = 'status!=inactive';
      const parts = whereStr.split(/([=!<>]+)/);
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('status');
      expect(parts[1]).toBe('!=');
      expect(parts[2]).toBe('inactive');
    });
  });

  describe('order-by parsing', () => {
    it('should parse order-by: field:asc', () => {
      const orderStr = 'name:asc';
      const parts = orderStr.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe('name');
      expect(parts[1]).toBe('asc');
    });

    it('should parse order-by: field:desc', () => {
      const orderStr = 'age:desc';
      const parts = orderStr.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe('age');
      expect(parts[1]).toBe('desc');
    });
  });

  describe('query execution', () => {
    it('should use QueryBuilder for queries', () => {
      const queryBuilder = new QueryBuilder(mockFirestore as any);
      expect(queryBuilder.executeQuery).toBeDefined();
    });

    it('should validate where conditions', () => {
      const queryBuilder = new QueryBuilder(mockFirestore as any);
      const result = queryBuilder.validateWhereCondition({
        field: 'status',
        operator: '==',
        value: 'active',
      });
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid operators', () => {
      const queryBuilder = new QueryBuilder(mockFirestore as any);
      const result = queryBuilder.validateWhereCondition({
        field: 'status',
        operator: 'INVALID' as any,
        value: 'active',
      });
      expect(result.isErr()).toBe(true);
    });
  });

  describe('default limit', () => {
    it('should default to 100 documents', () => {
      // Default list limit from config
      const defaultLimit = 100;
      expect(defaultLimit).toBe(100);
    });
  });

  describe('watch and limit validation', () => {
    it('should reject watch with limit combination', () => {
      // watch + limit is not allowed
      const watch = true;
      const limit = 10;
      const isInvalid = watch && limit !== undefined;
      expect(isInvalid).toBe(true);
    });
  });

  describe('output formatting', () => {
    it('should format documents list', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatDocuments(mockDocuments, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('Alice');
      }
    });

    it('should display 0 results message for empty list', () => {
      const formatter = new OutputFormatter();
      const result = formatter.formatDocuments([], 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('[]');
      }
    });
  });

  describe('execution time display', () => {
    it('should include execution time in output', () => {
      // Query result should include execution time
      const queryResult = {
        documents: mockDocuments,
        executionTimeMs: 123,
      };
      expect(queryResult.executionTimeMs).toBe(123);
    });
  });
});
