/**
 * Query builder service for Firestore queries
 */

import type { Firestore, Query } from 'firebase-admin/firestore';
import {
  Result,
  ok,
  err,
  WhereCondition,
  OrderBy,
  DocumentWithMeta,
  DocumentMetadata,
  FirestoreOperator,
} from '../shared/types';

/**
 * Query builder error types
 */
export type QueryBuilderError =
  | { type: 'INVALID_QUERY'; message: string }
  | { type: 'FIRESTORE_ERROR'; message: string; originalError: Error };

/**
 * Query execution options
 */
export interface QueryOptions {
  where?: WhereCondition[];
  orderBy?: OrderBy[];
  limit?: number;
  startAfter?: unknown;
}

/**
 * Query execution result
 */
export interface QueryResult {
  documents: DocumentWithMeta[];
  executionTimeMs: number;
}

/**
 * Service for building and executing Firestore queries
 */
export class QueryBuilder {
  constructor(private firestore: Firestore) {}

  /**
   * Validate where condition
   */
  validateWhereCondition(condition: WhereCondition): Result<void, QueryBuilderError> {
    if (!condition.field || condition.field.trim() === '') {
      return err({
        type: 'INVALID_QUERY',
        message: 'フィールド名が空です',
      });
    }

    // Validate operator
    const validOperators: FirestoreOperator[] = [
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>=',
      'array-contains',
      'array-contains-any',
      'in',
      'not-in',
    ];

    if (!validOperators.includes(condition.operator)) {
      return err({
        type: 'INVALID_QUERY',
        message: `無効な演算子です: ${condition.operator}`,
      });
    }

    return ok(undefined);
  }

  /**
   * Validate order by specification
   */
  validateOrderBy(orderBy: OrderBy): Result<void, QueryBuilderError> {
    if (!orderBy.field || orderBy.field.trim() === '') {
      return err({
        type: 'INVALID_QUERY',
        message: 'ソートフィールド名が空です',
      });
    }

    if (orderBy.direction !== 'asc' && orderBy.direction !== 'desc') {
      return err({
        type: 'INVALID_QUERY',
        message: `無効なソート方向です: ${orderBy.direction}`,
      });
    }

    return ok(undefined);
  }

  /**
   * Execute query with given options
   */
  async executeQuery(
    collectionPath: string,
    options: QueryOptions = {}
  ): Promise<Result<QueryResult, QueryBuilderError>> {
    const startTime = Date.now();

    try {
      // Start with collection reference
      let query: Query = this.firestore.collection(collectionPath);

      // Apply where conditions
      if (options.where) {
        for (const condition of options.where) {
          const validation = this.validateWhereCondition(condition);
          if (validation.isErr()) {
            return err(validation.error);
          }

          query = query.where(condition.field, condition.operator, condition.value);
        }
      }

      // Apply orderBy
      if (options.orderBy) {
        for (const order of options.orderBy) {
          const validation = this.validateOrderBy(order);
          if (validation.isErr()) {
            return err(validation.error);
          }

          query = query.orderBy(order.field, order.direction);
        }
      }

      // Apply limit
      if (options.limit !== undefined && options.limit > 0) {
        query = query.limit(options.limit);
      }

      // Apply startAfter cursor (for pagination)
      if (options.startAfter !== undefined) {
        query = query.startAfter(options.startAfter);
      }

      // Execute query
      const snapshot = await query.get();

      // Convert to DocumentWithMeta
      const documents: DocumentWithMeta[] = snapshot.docs
        .filter((doc) => doc.exists)
        .map((doc) => {
          const data = doc.data();
          const metadata: DocumentMetadata = {
            id: doc.id,
            path: doc.ref.path,
            createTime: doc.createTime?.toDate(),
            updateTime: doc.updateTime?.toDate(),
            readTime: doc.readTime?.toDate(),
          };

          return {
            data,
            metadata,
          };
        });

      const executionTimeMs = Date.now() - startTime;

      return ok({
        documents,
        executionTimeMs,
      });
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `クエリの実行に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}
