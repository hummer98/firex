/**
 * MCP Tool: firestore_set
 *
 * Create or overwrite a document in Firestore.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { FirestoreOps } from '../../domain/firestore-ops.js';

const SetSchema = {
  path: z.string().describe('Document path (e.g., users/user123)'),
  data: z.record(z.string(), z.unknown()).describe('Document data to write'),
  merge: z.boolean().optional().describe('If true, merge with existing data instead of overwriting'),
};

export function registerSetTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_set',
    'Create or update a document in Firestore. Use merge=true to partially update existing documents.',
    SetSchema,
    async ({ path, data, merge }) => {
      const ops = new FirestoreOps(firestore);
      const result = await ops.setDocument(path, data as Record<string, unknown>, merge ?? false);

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
                operation: merge ? 'merged' : 'set',
                message: `Document ${merge ? 'merged' : 'written'} successfully at ${path}`,
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
