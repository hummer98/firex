/**
 * MCP Tool: firestore_collections
 *
 * List collections in Firestore (root or under a document).
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { FirestoreOps } from '../../domain/firestore-ops.js';

const CollectionsSchema = {
  documentPath: z
    .string()
    .optional()
    .describe('Document path to list subcollections from. If omitted, lists root collections.'),
};

export function registerCollectionsTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_collections',
    'List collections in Firestore. Provide a document path to list its subcollections, or omit to list root collections.',
    CollectionsSchema,
    async ({ documentPath }) => {
      const ops = new FirestoreOps(firestore);

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
  );
}
