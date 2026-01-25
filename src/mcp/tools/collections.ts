/**
 * MCP Tool: firestore_collections
 *
 * List collections in Firestore (root or under a document).
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FirestoreManager } from '../firestore-manager.js';
import { FirestoreOps } from '../../domain/firestore-ops.js';
import { OutputFormatter } from '../../presentation/output-formatter.js';
import type { OutputFormat } from '../../shared/types.js';

const CollectionsSchema = {
  projectId: z.string().optional().describe('Firebase project ID (optional, uses default if not specified)'),
  documentPath: z
    .string()
    .optional()
    .describe('Document path to list subcollections from. If omitted, lists root collections.'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
};

export function registerCollectionsTool(server: McpServer, firestoreManager: FirestoreManager): void {
  server.tool(
    'firestore_collections',
    'List collections in Firestore. Provide a document path to list its subcollections, or omit to list root collections.',
    CollectionsSchema,
    async ({ projectId, documentPath, format }) => {
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

      const ops = new FirestoreOps(firestoreResult.value);
      const outputFormatter = new OutputFormatter();

      if (documentPath) {
        // List subcollections under a document
        const result = await ops.listSubcollections(documentPath);

        if (result.isErr()) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${result.error.message}`,
              },
            ],
            isError: true,
          };
        }

        const formatResult = outputFormatter.formatCollections(
          result.value,
          format as OutputFormat
        );

        if (formatResult.isErr()) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${formatResult.error.message}`,
              },
            ],
            isError: true,
          };
        }

        // For JSON, include parent document info
        if (format === 'json') {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    parentDocument: documentPath,
                    collections: result.value,
                    count: result.value.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: formatResult.value,
            },
          ],
        };
      }

      // List root collections
      const result = await ops.listRootCollections();

      if (result.isErr()) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${result.error.message}`,
            },
          ],
          isError: true,
        };
      }

      const formatResult = outputFormatter.formatCollections(
        result.value,
        format as OutputFormat
      );

      if (formatResult.isErr()) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${formatResult.error.message}`,
            },
          ],
          isError: true,
        };
      }

      // For JSON, use standard format
      if (format === 'json') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  collections: result.value,
                  count: result.value.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: formatResult.value,
          },
        ],
      };
    }
  );
}
