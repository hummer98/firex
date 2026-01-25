/**
 * MCP Tool: firestore_export
 *
 * Export a collection's documents as JSON.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { FirestoreManager } from '../firestore-manager.js';
import { ToonEncoder } from '../../presentation/toon-encoder.js';

const ExportSchema = {
  projectId: z.string().optional().describe('Firebase project ID (optional, uses default if not specified)'),
  path: z.string().describe('Collection path to export'),
  recursive: z.boolean().optional().default(false).describe('If true, include subcollections'),
  limit: z.number().optional().describe('Maximum number of documents to export'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
};

interface ExportedDocument {
  id: string;
  path: string;
  data: Record<string, unknown>;
  subcollections?: Record<string, ExportedDocument[]>;
}

async function exportDocument(
  doc: DocumentSnapshot,
  includeSubcollections: boolean
): Promise<ExportedDocument> {
  const exported: ExportedDocument = {
    id: doc.id,
    path: doc.ref.path,
    data: doc.data() || {},
  };

  if (includeSubcollections) {
    const subcollections = await doc.ref.listCollections();
    if (subcollections.length > 0) {
      exported.subcollections = {};

      for (const subcol of subcollections) {
        const subSnapshot = await subcol.get();
        exported.subcollections[subcol.id] = await Promise.all(
          subSnapshot.docs.map((subDoc) => exportDocument(subDoc, true))
        );
      }
    }
  }

  return exported;
}

export function registerExportTool(server: McpServer, firestoreManager: FirestoreManager): void {
  server.tool(
    'firestore_export',
    'Export documents from a Firestore collection as JSON',
    ExportSchema,
    async ({ projectId, path, recursive, limit, format }) => {
      const firestoreResult = await firestoreManager.getFirestore({ projectId });

      if (firestoreResult.isErr()) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${firestoreResult.error.message}`,
            },
          ],
          isError: true,
        };
      }

      const firestore = firestoreResult.value;

      try {
        let query = firestore.collection(path).orderBy('__name__');

        if (limit) {
          query = query.limit(limit);
        }

        const snapshot = await query.get();

        const documents = await Promise.all(
          snapshot.docs.map((doc) => exportDocument(doc, recursive ?? false))
        );

        const response = {
          collectionPath: path,
          count: documents.length,
          includesSubcollections: recursive ?? false,
          documents,
        };

        if (format === 'toon') {
          const toonEncoder = new ToonEncoder();
          const toonResult = toonEncoder.encode(response);
          if (toonResult.isErr()) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: ${toonResult.error.message}`,
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: 'text' as const,
                text: toonResult.value,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response, null, 2),
            },
          ],
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
