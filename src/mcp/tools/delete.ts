/**
 * MCP Tool: firestore_delete
 *
 * Delete a document or collection from Firestore.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { FirestoreOps } from '../../domain/firestore-ops.js';
import { BatchProcessor } from '../../domain/batch-processor.js';

const DeleteSchema = {
  path: z.string().describe('Document or collection path'),
  recursive: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true and path is a collection, delete all documents recursively'),
};

export function registerDeleteTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_delete',
    'Delete a document from Firestore. Use recursive=true to delete an entire collection.',
    DeleteSchema,
    async ({ path, recursive }) => {
      const ops = new FirestoreOps(firestore);

      // Check if it's a document or collection path
      const isDocPath = ops.isDocumentPath(path);

      if (isDocPath) {
        // Delete single document
        const result = await ops.deleteDocument(path);

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
                  success: true,
                  path,
                  type: 'document',
                  message: `Document deleted successfully at ${path}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Collection path
      if (!recursive) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: Cannot delete collection without recursive=true. Path "${path}" is a collection.`,
            },
          ],
          isError: true,
        };
      }

      // Delete collection recursively
      const batchProcessor = new BatchProcessor(firestore);
      const result = await batchProcessor.deleteCollection(
        path,
        async () => true // Auto-confirm in MCP context
      );

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
                success: true,
                path,
                type: 'collection',
                deletedCount: result.value.deletedCount,
                message: `Collection deleted successfully. ${result.value.deletedCount} documents removed.`,
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
