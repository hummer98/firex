/**
 * Validation service for Firestore data and paths
 */

import { Result, ok, err } from '../shared/types';

/**
 * Validation error types
 */
export type ValidationError =
  | { type: 'INVALID_DATA'; message: string; field?: string }
  | { type: 'INVALID_PATH'; message: string; path: string }
  | { type: 'INVALID_STRUCTURE'; message: string; line?: number };

/**
 * Path validation regex
 * - Must not start or end with /
 * - Must not contain consecutive /
 * - Must contain valid segment names (alphanumeric, underscore, hyphen)
 */
const PATH_VALIDATION_REGEX = /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/;

// Note: Import file structures are validated inline in validateImportFileStructure
// to avoid TypeScript unused declaration warnings

/**
 * Service for validating Firestore data and paths
 */
export class ValidationService {
  /**
   * Validate Firestore document data
   * Checks for invalid types that Firestore doesn't support
   */
  validateFirestoreData(
    data: Record<string, unknown>,
    fieldPrefix = ''
  ): Result<void, ValidationError> {
    for (const [key, value] of Object.entries(data)) {
      const fieldPath = fieldPrefix ? `${fieldPrefix}.${key}` : key;

      // Check for undefined
      if (value === undefined) {
        return err({
          type: 'INVALID_DATA',
          message: `フィールド「${fieldPath}」にundefinedが含まれています。Firestoreはundefinedをサポートしていません。nullを使用してください。`,
          field: fieldPath,
        });
      }

      // Check for function
      if (typeof value === 'function') {
        return err({
          type: 'INVALID_DATA',
          message: `フィールド「${fieldPath}」に関数が含まれています。Firestoreは関数をサポートしていません。`,
          field: fieldPath,
        });
      }

      // Check for symbol
      if (typeof value === 'symbol') {
        return err({
          type: 'INVALID_DATA',
          message: `フィールド「${fieldPath}」にSymbolが含まれています。FirestoreはSymbolをサポートしていません。`,
          field: fieldPath,
        });
      }

      // Recursively validate nested objects
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const nestedResult = this.validateFirestoreData(
          value as Record<string, unknown>,
          fieldPath
        );
        if (nestedResult.isErr()) {
          return nestedResult;
        }
      }

      // Validate arrays
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          const arrayFieldPath = `${fieldPath}[${i}]`;

          if (item === undefined) {
            return err({
              type: 'INVALID_DATA',
              message: `配列「${arrayFieldPath}」にundefinedが含まれています。`,
              field: arrayFieldPath,
            });
          }

          if (typeof item === 'function') {
            return err({
              type: 'INVALID_DATA',
              message: `配列「${arrayFieldPath}」に関数が含まれています。`,
              field: arrayFieldPath,
            });
          }

          if (typeof item === 'symbol') {
            return err({
              type: 'INVALID_DATA',
              message: `配列「${arrayFieldPath}」にSymbolが含まれています。`,
              field: arrayFieldPath,
            });
          }

          // Recursively validate nested objects in arrays
          if (item !== null && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date)) {
            const nestedResult = this.validateFirestoreData(
              item as Record<string, unknown>,
              arrayFieldPath
            );
            if (nestedResult.isErr()) {
              return nestedResult;
            }
          }
        }
      }
    }

    return ok(undefined);
  }

  /**
   * Validate Firestore path format
   */
  validateFirestorePath(path: string): Result<void, ValidationError> {
    if (!path || path.trim() === '') {
      return err({
        type: 'INVALID_PATH',
        message: 'パスが空です',
        path,
      });
    }

    if (!PATH_VALIDATION_REGEX.test(path)) {
      return err({
        type: 'INVALID_PATH',
        message: 'パスの形式が不正です（先頭・末尾のスラッシュ、連続したスラッシュ、無効な文字は使用できません）',
        path,
      });
    }

    return ok(undefined);
  }

  /**
   * Validate import file structure
   */
  validateImportFileStructure(
    structure: unknown
  ): Result<void, ValidationError> {
    // Check if structure is an object
    if (typeof structure !== 'object' || structure === null) {
      return err({
        type: 'INVALID_STRUCTURE',
        message: 'インポートファイルの形式が不正です。オブジェクトである必要があります。',
      });
    }

    const data = structure as Record<string, unknown>;

    // Check for documents field
    if (!('documents' in data)) {
      return err({
        type: 'INVALID_STRUCTURE',
        message: 'インポートファイルにdocumentsフィールドが必要です。',
      });
    }

    // Check if documents is an array
    if (!Array.isArray(data.documents)) {
      return err({
        type: 'INVALID_STRUCTURE',
        message: 'documentsフィールドは配列である必要があります。',
      });
    }

    // Validate each document
    const documents = data.documents as unknown[];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Check if document is an object
      if (typeof doc !== 'object' || doc === null) {
        return err({
          type: 'INVALID_STRUCTURE',
          message: `ドキュメント[${i}]がオブジェクトではありません。`,
          line: i,
        });
      }

      const docObj = doc as Record<string, unknown>;

      // Check for required fields
      if (!('id' in docObj)) {
        return err({
          type: 'INVALID_STRUCTURE',
          message: `ドキュメント[${i}]にidフィールドが必要です。`,
          line: i,
        });
      }

      if (!('path' in docObj)) {
        return err({
          type: 'INVALID_STRUCTURE',
          message: `ドキュメント[${i}]にpathフィールドが必要です。`,
          line: i,
        });
      }

      if (!('data' in docObj)) {
        return err({
          type: 'INVALID_STRUCTURE',
          message: `ドキュメント[${i}]にdataフィールドが必要です。`,
          line: i,
        });
      }

      // Validate path format
      if (typeof docObj.path === 'string') {
        const pathResult = this.validateFirestorePath(docObj.path);
        if (pathResult.isErr()) {
          return err({
            type: 'INVALID_STRUCTURE',
            message: `ドキュメント[${i}]のパスが不正です: ${pathResult.error.message}`,
            line: i,
          });
        }
      } else {
        return err({
          type: 'INVALID_STRUCTURE',
          message: `ドキュメント[${i}]のpathフィールドは文字列である必要があります。`,
          line: i,
        });
      }

      // Validate document data
      if (typeof docObj.data === 'object' && docObj.data !== null) {
        const dataResult = this.validateFirestoreData(
          docObj.data as Record<string, unknown>
        );
        if (dataResult.isErr()) {
          return err({
            type: 'INVALID_STRUCTURE',
            message: `ドキュメント[${i}]のデータが不正です: ${dataResult.error.message}`,
            line: i,
          });
        }
      } else {
        return err({
          type: 'INVALID_STRUCTURE',
          message: `ドキュメント[${i}]のdataフィールドはオブジェクトである必要があります。`,
          line: i,
        });
      }
    }

    return ok(undefined);
  }

  /**
   * Validate document data (alias for validateFirestoreData)
   */
  validateDocumentData(
    data: Record<string, unknown>
  ): Result<void, ValidationError> {
    return this.validateFirestoreData(data);
  }
}
