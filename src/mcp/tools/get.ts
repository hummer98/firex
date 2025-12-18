/**
 * MCP Tool: firestore_get
 *
 * Get a document from Firestore by path.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { FirestoreOps } from '../../domain/firestore-ops.js';

const GetSchema = {
  path: z.string().describe('Document path (e.g., users/user123)'),
};

export function registerGetTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_get',
    'Get a document from Firestore by its path',
    GetSchema,
    async ({ path }) => {
      const ops = new FirestoreOps(firestore);
      const result = await ops.getDocument(path);

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

      const doc = result.value;
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                data: doc.data,
                metadata: {
                  id: doc.metadata.id,
                  path: doc.metadata.path,
                  createTime: doc.metadata.createTime?.toISOString(),
                  updateTime: doc.metadata.updateTime?.toISOString(),
                },
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
