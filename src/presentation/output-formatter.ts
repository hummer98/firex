/**
 * Output formatter for different output formats
 */

import { Result, ok, err, DocumentWithMeta, DocumentChange, OutputFormat, DocumentMetadata } from '../shared/types';
import Table from 'cli-table3';
import { stringify as stringifyYaml } from 'yaml';

/**
 * Format options
 */
export interface FormatOptions {
  includeMetadata?: boolean;
  colorize?: boolean;
  quiet?: boolean;
}

/**
 * Format error types
 */
export type FormatError = {
  type: 'FORMAT_ERROR';
  message: string;
  originalError?: Error;
};

/**
 * Service for formatting output in different formats
 */
export class OutputFormatter {
  /**
   * Format a single document
   */
  formatDocument(
    document: DocumentWithMeta,
    format: OutputFormat,
    options: FormatOptions = {}
  ): Result<string, FormatError> {
    try {
      const data = options.includeMetadata
        ? { ...document.data, _metadata: document.metadata }
        : document.data;

      switch (format) {
        case 'json':
          return ok(JSON.stringify(data, null, 2));

        case 'yaml':
          return ok(stringifyYaml(data));

        case 'table':
          return this.formatAsTable([data]);

        default:
          return err({
            type: 'FORMAT_ERROR',
            message: `サポートされていない出力形式です: ${format}`,
          });
      }
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `ドキュメントのフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Format multiple documents
   */
  formatDocuments(
    documents: DocumentWithMeta[],
    format: OutputFormat,
    options: FormatOptions = {}
  ): Result<string, FormatError> {
    try {
      if (documents.length === 0) {
        return ok('[]');
      }

      const dataArray = documents.map((doc) =>
        options.includeMetadata
          ? { ...doc.data, _metadata: doc.metadata }
          : doc.data
      );

      switch (format) {
        case 'json':
          return ok(JSON.stringify(dataArray, null, 2));

        case 'yaml':
          return ok(stringifyYaml(dataArray));

        case 'table':
          return this.formatAsTable(dataArray);

        default:
          return err({
            type: 'FORMAT_ERROR',
            message: `サポートされていない出力形式です: ${format}`,
          });
      }
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `ドキュメントリストのフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Format a document change (for watch mode)
   */
  formatChange(
    change: DocumentChange,
    format: OutputFormat,
    options: FormatOptions = {}
  ): Result<string, FormatError> {
    try {
      const changeWithType = {
        changeType: change.type,
        data: change.document.data,
        ...(options.includeMetadata && { metadata: change.document.metadata }),
      };

      switch (format) {
        case 'json':
          return ok(JSON.stringify(changeWithType, null, 2));

        case 'yaml':
          return ok(stringifyYaml(changeWithType));

        case 'table': {
          const table = new Table({
            head: ['Change Type', 'Field', 'Value'],
          });

          table.push(['', 'Type', change.type]);

          // Add document data
          this.flattenObject(change.document.data).forEach(([key, value]) => {
            table.push(['', key, String(value)]);
          });

          return ok(table.toString());
        }

        default:
          return err({
            type: 'FORMAT_ERROR',
            message: `サポートされていない出力形式です: ${format}`,
          });
      }
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `変更のフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Format metadata as table
   */
  formatMetadata(metadata: DocumentMetadata): Result<string, FormatError> {
    try {
      const table = new Table({
        head: ['Property', 'Value'],
      });

      table.push(['ID', metadata.id]);
      table.push(['Path', metadata.path]);

      if (metadata.createTime) {
        table.push(['Created', metadata.createTime.toISOString()]);
      }

      if (metadata.updateTime) {
        table.push(['Updated', metadata.updateTime.toISOString()]);
      }

      if (metadata.readTime) {
        table.push(['Read Time', metadata.readTime.toISOString()]);
      }

      return ok(table.toString());
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `メタデータのフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Format data as table
   */
  private formatAsTable(data: Record<string, unknown>[]): Result<string, FormatError> {
    try {
      if (data.length === 0) {
        return ok('(No data)');
      }

      // Collect all unique keys from all objects
      const allKeys = new Set<string>();
      data.forEach((item) => {
        Object.keys(item).forEach((key) => allKeys.add(key));
      });

      const keys = Array.from(allKeys);

      const table = new Table({
        head: keys,
      });

      // Add rows
      data.forEach((item) => {
        const row = keys.map((key) => {
          const value = item[key];

          if (value === null) return 'null';
          if (value === undefined) return 'undefined';

          if (typeof value === 'object') {
            return JSON.stringify(value);
          }

          return String(value);
        });

        table.push(row);
      });

      return ok(table.toString());
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `テーブルのフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Flatten nested object into key-value pairs
   */
  private flattenObject(
    obj: Record<string, unknown>,
    prefix = ''
  ): [string, unknown][] {
    const result: [string, unknown][] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result.push(...this.flattenObject(value as Record<string, unknown>, fullKey));
      } else {
        result.push([fullKey, value]);
      }
    }

    return result;
  }

  /**
   * Format collection names list
   * @param collections - Array of collection names
   * @param format - Output format (json, yaml, table)
   * @param options - Format options (quiet mode for array-only output)
   */
  formatCollections(
    collections: string[],
    format: OutputFormat,
    options: FormatOptions = {}
  ): Result<string, FormatError> {
    try {
      const quiet = options.quiet ?? false;

      switch (format) {
        case 'json': {
          if (quiet) {
            return ok(JSON.stringify(collections, null, 2));
          }
          return ok(JSON.stringify({ collections, count: collections.length }, null, 2));
        }

        case 'yaml': {
          if (quiet) {
            return ok(stringifyYaml(collections));
          }
          return ok(stringifyYaml({ collections, count: collections.length }));
        }

        case 'table': {
          if (collections.length === 0) {
            return ok('(No collections)');
          }

          const table = new Table({
            head: ['Collection'],
          });

          collections.forEach((collection) => {
            table.push([collection]);
          });

          return ok(table.toString());
        }

        default:
          return err({
            type: 'FORMAT_ERROR',
            message: `サポートされていない出力形式です: ${format}`,
          });
      }
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `コレクション一覧のフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }
}
