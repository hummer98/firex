/**
 * MCP Tool: firestore_update
 *
 * Update specific fields in an existing Firestore document.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';

const UpdateSchema = {
  path: z.string().describe('Document path (e.g., users/user123)'),
  data: z.record(z.string(), z.unknown()).describe('Fields to update (supports dot notation for nested fields)'),
};

export function registerUpdateTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_update',
    'Update specific fields in an existing Firestore document. The document must exist.',
    UpdateSchema,
    async ({ path, data }) => {
      try {
        const docRef = firestore.doc(path);

        // Check if document exists
        const snapshot = await docRef.get();
        if (!snapshot.exists) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Document not found at ${path}`,
              },
            ],
            isError: true,
          };
        }

        // Update the document
        await docRef.update(data as Record<string, unknown>);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  path,
                  updatedFields: Object.keys(data as Record<string, unknown>),
                  message: `Document updated successfully at ${path}`,
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
