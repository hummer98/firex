/**
 * MCP Tool: firestore_list
 *
 * Query documents from a Firestore collection.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { QueryBuilder } from '../../domain/query-builder.js';
import type { WhereCondition, OrderBy, FirestoreOperator, OrderDirection, OutputFormat } from '../../shared/types.js';
import { OutputFormatter, TimestampFormatOptions } from '../../presentation/output-formatter.js';
import { DEFAULT_DATE_FORMAT } from '../../presentation/date-formatter.js';
import { TimezoneService } from '../../services/timezone.js';

const WhereConditionSchema = z.object({
  field: z.string().describe('Field name to filter on'),
  operator: z
    .enum(['==', '!=', '<', '<=', '>', '>=', 'array-contains', 'array-contains-any', 'in', 'not-in'])
    .describe('Comparison operator'),
  value: z.unknown().describe('Value to compare against'),
});

const OrderBySchema = z.object({
  field: z.string().describe('Field name to order by'),
  direction: z.enum(['asc', 'desc']).describe('Sort direction'),
});

const ListSchema = {
  path: z.string().describe('Collection path (e.g., users)'),
  where: z.array(WhereConditionSchema).optional().describe('Filter conditions'),
  orderBy: z.array(OrderBySchema).optional().describe('Sort order'),
  limit: z.number().optional().describe('Maximum number of documents to return'),
  format: z.enum(['json', 'toon']).optional().default('json').describe('Output format (json or toon)'),
  timezone: z.string().optional().describe('Timezone (IANA format, e.g., Asia/Tokyo)'),
  dateFormat: z.string().optional().describe('Date format pattern (e.g., yyyy-MM-dd)'),
  rawOutput: z.boolean().optional().default(false).describe('Disable all formatting'),
};

export function registerListTool(server: McpServer, firestore: Firestore): void {
  server.tool(
    'firestore_list',
    'Query documents from a Firestore collection with optional filters, sorting, and pagination',
    ListSchema,
    async ({ path, where, orderBy, limit, format, timezone, dateFormat, rawOutput }) => {
      const queryBuilder = new QueryBuilder(firestore);

      const whereConditions: WhereCondition[] | undefined = where?.map((w) => ({
        field: w.field,
        operator: w.operator as FirestoreOperator,
        value: w.value,
      }));

      const orderBySpecs: OrderBy[] | undefined = orderBy?.map((o) => ({
        field: o.field,
        direction: o.direction as OrderDirection,
      }));

      const result = await queryBuilder.executeQuery(path, {
        where: whereConditions,
        orderBy: orderBySpecs,
        limit,
      });

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

      const { documents, executionTimeMs } = result.value;
      const outputFormatter = new OutputFormatter();
      const formatResult = outputFormatter.formatDocuments(
        documents,
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

      // For JSON format, wrap with metadata; for TOON, return raw formatted data
      if (format === 'json') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  count: documents.length,
                  executionTimeMs,
                  documents: documents.map((doc) => ({
                    data: doc.data,
                    metadata: {
                      id: doc.metadata.id,
                      path: doc.metadata.path,
                      createTime: doc.metadata.createTime?.toISOString(),
                      updateTime: doc.metadata.updateTime?.toISOString(),
                    },
                  })),
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
