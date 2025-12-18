/**
 * MCP Tool: firestore_import
 *
 * Import documents into a Firestore collection.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';

const DocumentSchema = z.object({
  id: z.string().optional().describe('Document ID. If omitted, auto-generated.'),
  data: z.record(z.string(), z.unknown()).describe('Document data'),
});

const ImportSchema = {
  path: z.string().describe('Collection path to import into'),
  documents: z.array(DocumentSchema).describe('Array of documents to import'),
  merge: z.boolean().optional().describe('If true, merge with existing documents'),
};

export function registerImportTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_import',
    'Import documents into a Firestore collection',
    ImportSchema,
    async ({ path, documents, merge }) => {
      try {
        const collectionRef = firestore.collection(path);
        const results = {
          imported: 0,
          failed: 0,
          errors: [] as string[],
        };

        // Process documents in batches of 500 (Firestore limit)
        const batchSize = 500;
        const batches = [];

        for (let i = 0; i < documents.length; i += batchSize) {
          const batchDocs = documents.slice(i, i + batchSize);
          const batch = firestore.batch();

          for (const doc of batchDocs) {
            try {
              const docRef = doc.id ? collectionRef.doc(doc.id) : collectionRef.doc();

              if (merge) {
                batch.set(docRef, doc.data, { merge: true });
              } else {
                batch.set(docRef, doc.data);
              }
            } catch (error) {
              results.failed++;
              results.errors.push(
                `Failed to prepare document ${doc.id || '(auto-id)'}: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }

          batches.push(batch);
        }

        // Commit all batches
        for (const batch of batches) {
          try {
            await batch.commit();
            results.imported += batchSize;
          } catch (error) {
            results.failed += batchSize;
            results.errors.push(
              `Batch commit failed: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        // Adjust imported count
        results.imported = Math.min(results.imported, documents.length - results.failed);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: results.failed === 0,
                  collectionPath: path,
                  imported: results.imported,
                  failed: results.failed,
                  total: documents.length,
                  merge,
                  errors: results.errors.length > 0 ? results.errors : undefined,
                  message:
                    results.failed === 0
                      ? `Successfully imported ${results.imported} documents`
                      : `Imported ${results.imported} documents with ${results.failed} failures`,
                },
                null,
                2
              ),
            },
          ],
          isError: results.failed > 0,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
