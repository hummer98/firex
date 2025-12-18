/**
 * Tests for QueryBuilder service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryBuilder, QueryBuilderError } from './query-builder';
import type { Firestore, Query, CollectionReference, QuerySnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import type { WhereCondition, OrderBy } from '../shared/types';

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder;
  let mockFirestore: Partial<Firestore>;
  let mockCollectionRef: any;
  let mockQuery: any;
  let mockQuerySnapshot: Partial<QuerySnapshot>;
  let mockDocSnapshots: Partial<DocumentSnapshot>[];

  beforeEach(() => {
    mockDocSnapshots = [
      {
        exists: true,
        id: 'doc1',
        ref: { path: 'users/doc1' } as any,
        data: vi.fn().mockReturnValue({ name: 'Alice', age: 30 }),
        createTime: { toDate: () => new Date('2024-01-01') } as any,
        updateTime: { toDate: () => new Date('2024-01-02') } as any,
        readTime: { toDate: () => new Date('2024-01-03') } as any,
      },
      {
        exists: true,
        id: 'doc2',
        ref: { path: 'users/doc2' } as any,
        data: vi.fn().mockReturnValue({ name: 'Bob', age: 25 }),
        createTime: { toDate: () => new Date('2024-01-01') } as any,
        updateTime: { toDate: () => new Date('2024-01-02') } as any,
        readTime: { toDate: () => new Date('2024-01-03') } as any,
      },
    ];

    mockQuerySnapshot = {
      docs: mockDocSnapshots as any[],
      empty: false,
      size: 2,
    };

    mockQuery = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    };

    mockCollectionRef = {
      ...mockQuery,
      path: 'users',
    };

    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollectionRef),
    };

    queryBuilder = new QueryBuilder(mockFirestore as Firestore);
  });

  describe('validateWhereCondition', () => {
    it('should validate correct where condition', () => {
      const condition: WhereCondition = {
        field: 'age',
        operator: '>',
        value: 18,
      };

      const result = queryBuilder.validateWhereCondition(condition);
      expect(result.isOk()).toBe(true);
    });

    it('should reject empty field name', () => {
      const condition: WhereCondition = {
        field: '',
        operator: '==',
        value: 'test',
      };

      const result = queryBuilder.validateWhereCondition(condition);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_QUERY');
      }
    });

    it('should validate all supported operators', () => {
      const operators = ['==', '!=', '<', '<=', '>', '>=', 'array-contains', 'array-contains-any', 'in', 'not-in'] as const;

      operators.forEach((op) => {
        const condition: WhereCondition = {
          field: 'field',
          operator: op,
          value: 'test',
        };
        const result = queryBuilder.validateWhereCondition(condition);
        expect(result.isOk()).toBe(true);
      });
    });
  });

  describe('validateOrderBy', () => {
    it('should validate correct order by', () => {
      const orderBy: OrderBy = {
        field: 'age',
        direction: 'asc',
      };

      const result = queryBuilder.validateOrderBy(orderBy);
      expect(result.isOk()).toBe(true);
    });

    it('should reject empty field name', () => {
      const orderBy: OrderBy = {
        field: '',
        direction: 'asc',
      };

      const result = queryBuilder.validateOrderBy(orderBy);
      expect(result.isErr()).toBe(true);
    });

    it('should validate both asc and desc directions', () => {
      const asc: OrderBy = { field: 'name', direction: 'asc' };
      const desc: OrderBy = { field: 'name', direction: 'desc' };

      expect(queryBuilder.validateOrderBy(asc).isOk()).toBe(true);
      expect(queryBuilder.validateOrderBy(desc).isOk()).toBe(true);
    });
  });

  describe('executeQuery', () => {
    it('should execute simple query without conditions', async () => {
      const result = await queryBuilder.executeQuery('users');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.documents).toHaveLength(2);
        expect(result.value.documents[0].data.name).toBe('Alice');
        expect(result.value.executionTimeMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should execute query with where condition', async () => {
      const conditions: WhereCondition[] = [
        { field: 'age', operator: '>', value: 25 },
      ];

      const result = await queryBuilder.executeQuery('users', { where: conditions });

      expect(result.isOk()).toBe(true);
      expect(mockQuery.where).toHaveBeenCalledWith('age', '>', 25);
    });

    it('should execute query with multiple where conditions', async () => {
      const conditions: WhereCondition[] = [
        { field: 'age', operator: '>', value: 18 },
        { field: 'status', operator: '==', value: 'active' },
      ];

      const result = await queryBuilder.executeQuery('users', { where: conditions });

      expect(result.isOk()).toBe(true);
      expect(mockQuery.where).toHaveBeenCalledTimes(2);
      expect(mockQuery.where).toHaveBeenCalledWith('age', '>', 18);
      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'active');
    });

    it('should execute query with orderBy', async () => {
      const orderBy: OrderBy[] = [
        { field: 'age', direction: 'desc' },
      ];

      const result = await queryBuilder.executeQuery('users', { orderBy });

      expect(result.isOk()).toBe(true);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('age', 'desc');
    });

    it('should execute query with multiple orderBy', async () => {
      const orderBy: OrderBy[] = [
        { field: 'age', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ];

      const result = await queryBuilder.executeQuery('users', { orderBy });

      expect(result.isOk()).toBe(true);
      expect(mockQuery.orderBy).toHaveBeenCalledTimes(2);
    });

    it('should execute query with limit', async () => {
      const result = await queryBuilder.executeQuery('users', { limit: 10 });

      expect(result.isOk()).toBe(true);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should execute complex query with all options', async () => {
      const conditions: WhereCondition[] = [
        { field: 'age', operator: '>=', value: 18 },
      ];
      const orderBy: OrderBy[] = [
        { field: 'name', direction: 'asc' },
      ];

      const result = await queryBuilder.executeQuery('users', {
        where: conditions,
        orderBy,
        limit: 5,
      });

      expect(result.isOk()).toBe(true);
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.orderBy).toHaveBeenCalled();
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should reject invalid where condition', async () => {
      const conditions: WhereCondition[] = [
        { field: '', operator: '==', value: 'test' },
      ];

      const result = await queryBuilder.executeQuery('users', { where: conditions });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_QUERY');
      }
    });

    it('should reject invalid orderBy', async () => {
      const orderBy: OrderBy[] = [
        { field: '', direction: 'asc' },
      ];

      const result = await queryBuilder.executeQuery('users', { orderBy });

      expect(result.isErr()).toBe(true);
    });

    it('should handle Firestore errors', async () => {
      // Create a new mock that rejects
      const errorQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValue(new Error('Permission denied')),
      };

      mockFirestore.collection = vi.fn().mockReturnValue(errorQuery);

      const result = await queryBuilder.executeQuery('users');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FIRESTORE_ERROR');
      }
    });

    it('should measure execution time', async () => {
      const result = await queryBuilder.executeQuery('users');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.executionTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.value.executionTimeMs).toBeLessThan(10000); // Should be fast
      }
    });

    it('should return empty result when no documents match', async () => {
      mockQuerySnapshot.docs = [];
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.size = 0;

      const result = await queryBuilder.executeQuery('users');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.documents).toHaveLength(0);
      }
    });
  });
});
