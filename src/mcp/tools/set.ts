/**
 * MCP Tool: firestore_set
 *
 * Create or overwrite a document in Firestore.
 * Supports $fieldValue syntax for serverTimestamp, increment, arrayUnion, arrayRemove, delete.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FirestoreManager } from '../firestore-manager.js';
import { FirestoreOps } from '../../domain/firestore-ops.js';
import { FieldValueTransformer } from '../../domain/field-value-transformer.js';
import { ToonEncoder } from '../../presentation/toon-encoder.js';

const SetSchema = {
  projectId: z.string().optional().describe('Firebase project ID (optional, uses default if not specified)'),
  path: z.string().describe('Document path (e.g., users/user123)'),
  data: z.record(z.string(), z.unknown()).describe('Document data to write. Supports $fieldValue syntax: {"$fieldValue": "serverTimestamp"}, {"$fieldValue": "increment", "operand": 1}, {"$fieldValue": "arrayUnion", "elements": [...]}, {"$fieldValue": "arrayRemove", "elements": [...]}, {"$fieldValue": "delete"}. To store a value as Firestore Timestamp type (not a string), use $timestampValue syntax: {"$timestampValue": "2025-02-18T12:00:00Z"}. Without this wrapper, date strings are stored as plain strings.'),
  merge: z.boolean().optional().describe('If true, merge with existing data instead of overwriting'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
};

export function registerSetTool(server: McpServer, firestoreManager: FirestoreManager): void {
  server.tool(
    'firestore_set',
    'Create or update a document in Firestore. Use merge=true to partially update existing documents. Supports $fieldValue syntax for serverTimestamp, increment, arrayUnion, arrayRemove, delete operations. To store a value as Firestore Timestamp type (not a string), use $timestampValue syntax: {"$timestampValue": "2025-02-18T12:00:00Z"}. Without this wrapper, date strings are stored as plain strings.',
    SetSchema,
    async ({ projectId, path, data, merge, format }) => {
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
      const ops = new FirestoreOps(firestoreResult.value);
      const result = await ops.setDocument(path, transformedData, merge ?? false);

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

      const response = {
        success: true,
        path,
        operation: merge ? 'merged' : 'set',
        message: `Document ${merge ? 'merged' : 'written'} successfully at ${path}`,
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
    }
  );
}
