/**
 * MCP Tool: firestore_get
 *
 * Get a document from Firestore by path.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { FirestoreOps } from '../../domain/firestore-ops.js';
import { OutputFormatter } from '../../presentation/output-formatter.js';
import type { OutputFormat } from '../../shared/types.js';

const GetSchema = {
  path: z.string().describe('Document path (e.g., users/user123)'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
};

export function registerGetTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_get',
    'Get a document from Firestore by its path',
    GetSchema,
    async ({ path, format }) => {
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
      const outputFormatter = new OutputFormatter();
      const formatResult = outputFormatter.formatDocument(
        doc,
        format as OutputFormat,
        { includeMetadata: true }
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
