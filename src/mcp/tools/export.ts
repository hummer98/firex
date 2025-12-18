/**
 * MCP Tool: firestore_export
 *
 * Export a collection's documents as JSON.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, DocumentSnapshot } from 'firebase-admin/firestore';

const ExportSchema = {
  path: z.string().describe('Collection path to export'),
  recursive: z.boolean().optional().default(false).describe('If true, include subcollections'),
  limit: z.number().optional().describe('Maximum number of documents to export'),
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

export function registerExportTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_export',
    'Export documents from a Firestore collection as JSON',
    ExportSchema,
    async ({ path, recursive, limit }) => {
      try {
        let query = firestore.collection(path).orderBy('__name__');

        if (limit) {
          query = query.limit(limit);
        }

        const snapshot = await query.get();

        const documents = await Promise.all(
          snapshot.docs.map((doc) => exportDocument(doc, recursive ?? false))
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  collectionPath: path,
                  count: documents.length,
                  includesSubcollections: recursive ?? false,
                  documents,
                },
                null,
                2
              ),
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
