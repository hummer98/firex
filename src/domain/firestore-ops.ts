/**
 * Firestore operations service
 */

import type { Firestore, DocumentSnapshot } from 'firebase-admin/firestore';
import { Result, ok, err, DocumentWithMeta, DocumentMetadata } from '../shared/types';

/**
 * Firestore operations error types
 */
export type FirestoreOpsError =
  | { type: 'INVALID_PATH'; message: string; path: string }
  | { type: 'NOT_FOUND'; message: string; path: string }
  | { type: 'FIRESTORE_ERROR'; message: string; originalError: Error };

/**
 * Path validation regex
 * - Must not start or end with /
 * - Must not contain consecutive /
 * - Must contain valid segment names (alphanumeric, underscore, hyphen)
 */
const PATH_VALIDATION_REGEX = /^[^/]+(\/[^/]+)*$/;

/**
 * Service for Firestore document and collection operations
 */
export class FirestoreOps {
  constructor(private firestore: Firestore) {}

  /**
   * Validate Firestore path format
   */
  validatePath(path: string): Result<void, FirestoreOpsError> {
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
        message: 'パスの形式が不正です（先頭・末尾のスラッシュ、連続したスラッシュは使用できません）',
        path,
      });
    }

    return ok(undefined);
  }

  /**
   * Check if path is a document path (even number of segments)
   */
  isDocumentPath(path: string): boolean {
    const segments = path.split('/');
    return segments.length % 2 === 0;
  }

  /**
   * Check if path is a collection path (odd number of segments)
   */
  isCollectionPath(path: string): boolean {
    return !this.isDocumentPath(path);
  }

  /**
   * Get document by path
   */
  async getDocument(path: string): Promise<Result<DocumentWithMeta, FirestoreOpsError>> {
    // Validate path
    const validation = this.validatePath(path);
    if (validation.isErr()) {
      return err(validation.error);
    }

    // Check if it's a document path
    if (!this.isDocumentPath(path)) {
      return err({
        type: 'INVALID_PATH',
        message: 'ドキュメントパスを指定してください（偶数のセグメント数が必要です）',
        path,
      });
    }

    try {
      const docRef = this.firestore.doc(path);
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        return err({
          type: 'NOT_FOUND',
          message: `ドキュメントが見つかりません: ${path}`,
          path,
        });
      }

      return ok(this.snapshotToDocumentWithMeta(snapshot));
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `ドキュメントの取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * List all documents in a collection
   */
  async listDocuments(path: string): Promise<Result<DocumentWithMeta[], FirestoreOpsError>> {
    // Validate path
    const validation = this.validatePath(path);
    if (validation.isErr()) {
      return err(validation.error);
    }

    // Check if it's a collection path
    if (!this.isCollectionPath(path)) {
      return err({
        type: 'INVALID_PATH',
        message: 'コレクションパスを指定してください（奇数のセグメント数が必要です）',
        path,
      });
    }

    try {
      const collectionRef = this.firestore.collection(path);
      const docRefs = await collectionRef.listDocuments();

      // Fetch all documents
      const snapshots = await Promise.all(docRefs.map((ref) => ref.get()));

      // Filter out non-existing documents and convert to DocumentWithMeta
      const documents = snapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => this.snapshotToDocumentWithMeta(snapshot));

      return ok(documents);
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `ドキュメント一覧の取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Set document data (create or overwrite)
   */
  async setDocument(
    path: string,
    data: Record<string, unknown>,
    merge = false
  ): Promise<Result<void, FirestoreOpsError>> {
    // Validate path
    const validation = this.validatePath(path);
    if (validation.isErr()) {
      return err(validation.error);
    }

    // Check if it's a document path
    if (!this.isDocumentPath(path)) {
      return err({
        type: 'INVALID_PATH',
        message: 'ドキュメントパスを指定してください（偶数のセグメント数が必要です）',
        path,
      });
    }

    try {
      const docRef = this.firestore.doc(path);
      await docRef.set(data, merge ? { merge: true } : {});
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `ドキュメントの書き込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(path: string): Promise<Result<void, FirestoreOpsError>> {
    // Validate path
    const validation = this.validatePath(path);
    if (validation.isErr()) {
      return err(validation.error);
    }

    // Check if it's a document path
    if (!this.isDocumentPath(path)) {
      return err({
        type: 'INVALID_PATH',
        message: 'ドキュメントパスを指定してください（偶数のセグメント数が必要です）',
        path,
      });
    }

    try {
      const docRef = this.firestore.doc(path);
      await docRef.delete();
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `ドキュメントの削除に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * List all root-level collections in the database
   */
  async listRootCollections(): Promise<Result<string[], FirestoreOpsError>> {
    try {
      const collections = await this.firestore.listCollections();
      const collectionNames = collections.map((col) => col.id);
      return ok(collectionNames);
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `ルートコレクション一覧の取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * List all subcollections under a document
   */
  async listSubcollections(documentPath: string): Promise<Result<string[], FirestoreOpsError>> {
    // Validate path
    const validation = this.validatePath(documentPath);
    if (validation.isErr()) {
      return err(validation.error);
    }

    // Check if it's a document path
    if (!this.isDocumentPath(documentPath)) {
      return err({
        type: 'INVALID_PATH',
        message: 'ドキュメントパスを指定してください（偶数のセグメント数が必要です）',
        path: documentPath,
      });
    }

    try {
      const docRef = this.firestore.doc(documentPath);

      // Check if document exists
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        return err({
          type: 'NOT_FOUND',
          message: `ドキュメントが見つかりません: ${documentPath}`,
          path: documentPath,
        });
      }

      // Get subcollections
      const collections = await docRef.listCollections();
      const collectionNames = collections.map((col) => col.id);
      return ok(collectionNames);
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `サブコレクション一覧の取得に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Convert DocumentSnapshot to DocumentWithMeta
   */
  private snapshotToDocumentWithMeta(snapshot: DocumentSnapshot): DocumentWithMeta {
    const data = snapshot.data() || {};
    const metadata: DocumentMetadata = {
      id: snapshot.id,
      path: snapshot.ref.path,
      createTime: snapshot.createTime?.toDate(),
      updateTime: snapshot.updateTime?.toDate(),
      readTime: snapshot.readTime?.toDate(),
    };

    return {
      data,
      metadata,
    };
  }
}
