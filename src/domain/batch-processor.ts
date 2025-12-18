/**
 * Batch processor for import/export and bulk operations
 */

import type { Firestore, WriteBatch } from 'firebase-admin/firestore';
import { Result, ok, err } from '../shared/types';
import { promises as fs } from 'fs';

/**
 * Export options
 */
export interface ExportOptions {
  collectionPath: string;
  outputPath: string;
  includeSubcollections: boolean;
  progressCallback?: (current: number, total: number) => void;
}

/**
 * Import options
 */
export interface ImportOptions {
  inputPath: string;
  batchSize: number;
  progressCallback?: (current: number, total: number) => void;
}

/**
 * Export result
 */
export interface ExportResult {
  exportedCount: number;
  filePath: string;
}

/**
 * Import result
 */
export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  failedCount: number;
}

/**
 * Delete result
 */
export interface DeleteResult {
  deletedCount: number;
}

/**
 * Batch processor error types
 */
export type BatchProcessorError =
  | { type: 'BATCH_COMMIT_ERROR'; message: string; partialSuccess: boolean; committedCount: number }
  | { type: 'FILE_IO_ERROR'; path: string; message: string }
  | { type: 'VALIDATION_ERROR'; message: string; line?: number }
  | { type: 'INVALID_BATCH_SIZE'; message: string; size: number }
  | { type: 'FIRESTORE_ERROR'; message: string; originalError: Error };

/**
 * Exported document structure
 */
interface ExportedDocument {
  id: string;
  path: string;
  data: Record<string, unknown>;
  subcollections?: Record<string, ExportedDocument[]>;
}

/**
 * Import file structure
 */
interface ImportFileStructure {
  documents: ExportedDocument[];
}

/**
 * Service for batch operations on Firestore
 */
export class BatchProcessor {
  private readonly MAX_BATCH_SIZE = 500;
  private readonly MIN_BATCH_SIZE = 1;

  constructor(private firestore: Firestore) {}

  /**
   * Export collection to JSON file
   */
  async exportCollection(
    options: ExportOptions
  ): Promise<Result<ExportResult, BatchProcessorError>> {
    try {
      const { collectionPath, outputPath, includeSubcollections, progressCallback } = options;

      // Get collection reference
      const collectionRef = this.firestore.collection(collectionPath);
      const snapshot = await collectionRef.get();

      const documents: ExportedDocument[] = [];
      let processed = 0;
      const total = snapshot.size;

      // Export each document
      for (const doc of snapshot.docs) {
        const exportedDoc: ExportedDocument = {
          id: doc.id,
          path: doc.ref.path,
          data: doc.data(),
        };

        // Include subcollections if requested
        if (includeSubcollections) {
          const subcollections = await doc.ref.listCollections();
          if (subcollections.length > 0) {
            exportedDoc.subcollections = {};

            for (const subcol of subcollections) {
              const subResult = await this.exportCollection({
                collectionPath: subcol.path,
                outputPath: '', // Not used for subcollections
                includeSubcollections: true,
                progressCallback: undefined, // Don't report subcollection progress
              });

              if (subResult.isOk()) {
                // Extract documents from the recursive export
                const subSnapshot = await subcol.get();
                exportedDoc.subcollections[subcol.id] = subSnapshot.docs.map((subDoc) => ({
                  id: subDoc.id,
                  path: subDoc.ref.path,
                  data: subDoc.data(),
                }));
              }
            }
          }
        }

        documents.push(exportedDoc);
        processed++;

        if (progressCallback) {
          progressCallback(processed, total);
        }
      }

      // If this is a top-level export, write to file
      if (outputPath) {
        const exportData: ImportFileStructure = { documents };
        await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
      }

      return ok({
        exportedCount: documents.length,
        filePath: outputPath,
      });
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `エクスポートに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Import data from JSON file
   */
  async importData(
    options: ImportOptions
  ): Promise<Result<ImportResult, BatchProcessorError>> {
    const { inputPath, batchSize, progressCallback } = options;

    // Validate batch size
    if (batchSize < this.MIN_BATCH_SIZE || batchSize > this.MAX_BATCH_SIZE) {
      return err({
        type: 'INVALID_BATCH_SIZE',
        message: `バッチサイズは${this.MIN_BATCH_SIZE}から${this.MAX_BATCH_SIZE}の範囲で指定してください`,
        size: batchSize,
      });
    }

    try {
      // Read file
      const fileContent = await fs.readFile(inputPath, 'utf-8');

      // Parse JSON
      let importData: ImportFileStructure;
      try {
        importData = JSON.parse(fileContent);
      } catch (parseError) {
        return err({
          type: 'VALIDATION_ERROR',
          message: `JSONファイルの解析に失敗しました: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`,
        });
      }

      // Validate structure
      if (!importData.documents || !Array.isArray(importData.documents)) {
        return err({
          type: 'VALIDATION_ERROR',
          message: 'インポートファイルの形式が不正です。documentsプロパティが必要です',
        });
      }

      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      const documents = importData.documents;
      const totalBatches = Math.ceil(documents.length / batchSize);

      // Process in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, documents.length);
        const batchDocs = documents.slice(start, end);

        const batch: WriteBatch = this.firestore.batch();

        // Add documents to batch
        for (const doc of batchDocs) {
          try {
            const docRef = this.firestore.doc(doc.path);
            batch.set(docRef, doc.data);
          } catch (error) {
            failedCount++;
            continue;
          }
        }

        // Commit batch
        try {
          await batch.commit();
          importedCount += batchDocs.length - failedCount;

          if (progressCallback) {
            progressCallback(end, documents.length);
          }
        } catch (error) {
          return err({
            type: 'BATCH_COMMIT_ERROR',
            message: `バッチコミットに失敗しました: ${
              error instanceof Error ? error.message : String(error)
            }`,
            partialSuccess: importedCount > 0,
            committedCount: importedCount,
          });
        }
      }

      return ok({
        importedCount,
        skippedCount,
        failedCount,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return err({
          type: 'FILE_IO_ERROR',
          path: inputPath,
          message: `ファイルが見つかりません: ${inputPath}`,
        });
      }

      return err({
        type: 'FILE_IO_ERROR',
        path: inputPath,
        message: `ファイルの読み込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  /**
   * Delete all documents in a collection recursively
   */
  async deleteCollection(
    collectionPath: string,
    confirmCallback: () => Promise<boolean>
  ): Promise<Result<DeleteResult, BatchProcessorError>> {
    try {
      // Ask for confirmation
      const confirmed = await confirmCallback();
      if (!confirmed) {
        return ok({ deletedCount: 0 });
      }

      let deletedCount = 0;
      const collectionRef = this.firestore.collection(collectionPath);

      // Delete in batches
      let hasMore = true;

      while (hasMore) {
        const snapshot = await collectionRef.limit(this.MAX_BATCH_SIZE).get();

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        const batch: WriteBatch = this.firestore.batch();

        for (const doc of snapshot.docs) {
          // Recursively delete subcollections
          const subcollections = await doc.ref.listCollections();
          for (const subcol of subcollections) {
            const subResult = await this.deleteCollection(
              subcol.path,
              async () => true // Auto-confirm for subcollections
            );

            if (subResult.isOk()) {
              deletedCount += subResult.value.deletedCount;
            }
          }

          // Delete document
          batch.delete(doc.ref);
        }

        await batch.commit();
        deletedCount += snapshot.size;

        // Check if there are more documents
        hasMore = snapshot.size === this.MAX_BATCH_SIZE;
      }

      return ok({ deletedCount });
    } catch (error) {
      return err({
        type: 'FIRESTORE_ERROR',
        message: `コレクションの削除に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}
