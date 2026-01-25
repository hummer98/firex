/**
 * MCP Tool: firestore_get
 *
 * Get a document from Firestore by path.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FirestoreManager } from '../firestore-manager.js';
import { FirestoreOps } from '../../domain/firestore-ops.js';
import { OutputFormatter, TimestampFormatOptions } from '../../presentation/output-formatter.js';
import type { OutputFormat } from '../../shared/types.js';
import { DEFAULT_DATE_FORMAT } from '../../presentation/date-formatter.js';
import { TimezoneService } from '../../services/timezone.js';

const GetSchema = {
  projectId: z.string().optional().describe('Firebase project ID (optional, uses default if not specified)'),
  path: z.string().describe('Document path (e.g., users/user123)'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
  timezone: z.string().optional().describe('Timezone (IANA format, e.g., Asia/Tokyo)'),
  dateFormat: z.string().optional().describe('Date format pattern (e.g., yyyy-MM-dd)'),
  rawOutput: z.boolean().optional().default(false).describe('Disable all formatting'),
};

export function registerGetTool(server: McpServer, firestoreManager: FirestoreManager): void {
  server.tool(
    'firestore_get',
    'Get a document from Firestore by its path',
    GetSchema,
    async ({ projectId, path, format, timezone, dateFormat, rawOutput }) => {
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

      // Resolve timezone
      const timezoneService = new TimezoneService();
      let resolvedTimezone = timezone;
      if (!resolvedTimezone) {
        resolvedTimezone = timezoneService.getSystemTimezone();
      } else {
        const resolution = timezoneService.resolveTimezone(resolvedTimezone);
        resolvedTimezone = resolution.timezone;
      }

      // Build timestamp options
      const timestampOptions: TimestampFormatOptions | undefined = rawOutput
        ? undefined
        : {
            dateFormat: dateFormat ?? DEFAULT_DATE_FORMAT,
            timezone: resolvedTimezone,
            noDateFormat: false,
          };

      const doc = result.value;
      const outputFormatter = new OutputFormatter();
      const formatResult = outputFormatter.formatDocument(
        doc,
        format as OutputFormat,
        { includeMetadata: true },
        timestampOptions
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
