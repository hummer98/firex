/**
 * MCP Tool: firestore_update
 *
 * Update specific fields in an existing Firestore document.
 * Supports $fieldValue syntax for serverTimestamp, increment, arrayUnion, arrayRemove, delete.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValueTransformer } from '../../domain/field-value-transformer.js';
import { ToonEncoder } from '../../presentation/toon-encoder.js';

const UpdateSchema = {
  path: z.string().describe('Document path (e.g., users/user123)'),
  data: z.record(z.string(), z.unknown()).describe('Fields to update. Supports $fieldValue syntax: {"$fieldValue": "serverTimestamp"}, {"$fieldValue": "increment", "operand": 1}, {"$fieldValue": "arrayUnion", "elements": [...]}, {"$fieldValue": "arrayRemove", "elements": [...]}, {"$fieldValue": "delete"}'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
};

export function registerUpdateTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_update',
    'Update specific fields in an existing Firestore document. The document must exist. Supports $fieldValue syntax for serverTimestamp, increment, arrayUnion, arrayRemove, delete operations.',
    UpdateSchema,
    async ({ path, data, format }) => {
      try {
        // Transform $fieldValue objects to FieldValue sentinels
        const transformer = new FieldValueTransformer();
        const transformResult = transformer.transform(data as Record<string, unknown>);

        if (transformResult.isErr()) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${transformResult.error.message}`,
              },
            ],
            isError: true,
          };
        }

        const transformedData = transformResult.value;
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
        await docRef.update(transformedData);

        const response = {
          success: true,
          path,
          updatedFields: Object.keys(data as Record<string, unknown>),
          message: `Document updated successfully at ${path}`,
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
