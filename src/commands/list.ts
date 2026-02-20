/**
 * ListCommand - List documents in a collection with query support
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { QueryBuilder, QueryOptions } from '../domain/query-builder';
import { WatchService } from '../domain/watch-service';
import { OutputFormatter, TimestampFormatOptions } from '../presentation/output-formatter';
import { TimezoneService } from '../services/timezone';
import { OutputOptionsResolver } from '../services/output-options-resolver';
import { t } from '../shared/i18n';
import type { OutputFormat, WhereCondition, OrderBy, DocumentChange, FirestoreOperator } from '../shared/types';

export class ListCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.list.description');

  static override examples = [
    {
      command: '<%= config.bin %> list',
      description: 'List root-level collections in the database',
    },
    {
      command: '<%= config.bin %> list users',
      description: 'List documents in the "users" collection (default: 100)',
    },
    {
      command: '<%= config.bin %> list users --limit=10',
      description: 'Limit results to 10 documents',
    },
    {
      command: '<%= config.bin %> list users --yaml',
      description: 'Output in YAML format',
    },
    {
      command: '<%= config.bin %> list users --table',
      description: 'Output in table format',
    },
    {
      command: '<%= config.bin %> list users --toon',
      description: 'TOON format (token-efficient output for LLMs)',
    },
    {
      command: '<%= config.bin %> list users --quiet',
      description: 'Output only data without summary/metadata',
    },
    // Query examples
    {
      command: '<%= config.bin %> list users --where="age>=18"',
      description: 'Filter: documents where age >= 18',
    },
    {
      command: '<%= config.bin %> list users --where="age>=18" --order-by="age:desc"',
      description: 'Filter with sorting (descending by age)',
    },
    {
      command: '<%= config.bin %> list posts --where="status==published" --where="author==alice"',
      description: 'Multiple AND conditions',
    },
    {
      command: '<%= config.bin %> list users --order-by="createdAt:desc" --limit=5',
      description: 'Latest 5 users sorted by creation date',
    },
    // Watch mode
    {
      command: '<%= config.bin %> list users --watch',
      description: 'Watch for realtime changes on the collection',
    },
    {
      command: '<%= config.bin %> list users --watch --show-initial',
      description: 'Watch mode with initial snapshot displayed',
    },
    // Subcollection path
    {
      command: '<%= config.bin %> list users/user123/orders',
      description: 'List documents in a subcollection',
    },
    // Timestamp formatting examples
    {
      command: '<%= config.bin %> list users --timezone=Asia/Tokyo',
      description: 'Display timestamps in Asia/Tokyo timezone',
    },
    {
      command: '<%= config.bin %> list users --date-format="yyyy-MM-dd HH:mm:ss"',
      description: 'Custom date format (e.g. 2025-06-01 09:00:00)',
    },
    {
      command: '<%= config.bin %> list users --date-format="yyyy/MM/dd" --timezone=UTC',
      description: 'Combine date format and timezone',
    },
    {
      command: '<%= config.bin %> list users --no-date-format',
      description: 'Disable date formatting (show raw Firestore Timestamp objects)',
    },
    {
      command: '<%= config.bin %> list users --raw-output',
      description: 'Disable all formatting including timestamp conversion',
    },
  ];

  static override args = {
    collectionPath: Args.string({
      description: t('arg.collectionPath'),
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    where: Flags.string({
      char: 'w',
      description: t('flag.where'),
      multiple: true,
    }),
    'order-by': Flags.string({
      char: 'o',
      description: t('flag.orderBy'),
      multiple: true,
    }),
    limit: Flags.integer({
      char: 'l',
      description: t('flag.limit'),
    }),
    watch: Flags.boolean({
      description: t('flag.watch'),
      default: false,
    }),
    'show-initial': Flags.boolean({
      description: t('flag.showInitial'),
      default: false,
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: t('flag.quiet'),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ListCommand);
    const collectionPath = args.collectionPath;
    const format = this.resolveFormat(flags);
    const whereConditions = flags.where || [];
    const orderByConditions = flags['order-by'] || [];
    const limit = flags.limit;
    const watch = flags.watch;
    const showInitial = flags['show-initial'];
    const quiet = flags.quiet;

    // Initialize config
    const initResult = await this.initialize();
    if (initResult.isErr()) {
      this.handleError(initResult.error.message, 'config');
      return;
    }

    // Initialize auth
    const authResult = await this.initializeAuth();
    if (authResult.isErr()) {
      this.handleError(authResult.error.message, 'auth');
      return;
    }

    const firestore = authResult.value;
    const firestoreOps = new FirestoreOps(firestore);
    const outputFormatter = new OutputFormatter();

    // Resolve timestamp options from CLI flags and config
    const timezoneService = new TimezoneService();
    const resolver = new OutputOptionsResolver(timezoneService);
    const resolvedOptions = resolver.resolve({
      cliFlags: {
        timezone: flags.timezone,
        dateFormat: flags['date-format'],
        rawOutput: flags['raw-output'],
        noColor: flags['no-color'],
        noDateFormat: flags['no-date-format'],
      },
      config: this.loadedConfig?.output ?? {},
    });

    // Build timestamp options (undefined if rawOutput is true)
    const timestampOptions: TimestampFormatOptions | undefined = resolvedOptions.rawOutput
      ? undefined
      : {
          dateFormat: resolvedOptions.dateFormat,
          timezone: resolvedOptions.timezone,
          noDateFormat: resolvedOptions.noDateFormat,
        };

    // No path: list root collections
    if (!collectionPath) {
      await this.listRootCollections(firestoreOps, format, outputFormatter, quiet);
      return;
    }

    // Validate collection path (must have odd number of segments)
    if (!firestoreOps.isCollectionPath(collectionPath)) {
      this.handleError(
        `${t('err.invalidPath')}: ${collectionPath}`,
        'validation'
      );
      return;
    }

    // Validate watch + limit combination
    if (watch && limit !== undefined) {
      this.handleError(
        '--watch and --limit cannot be used together',
        'validation'
      );
      return;
    }

    // Parse where conditions
    const parsedWhere = this.parseWhereConditions(whereConditions);
    if (parsedWhere instanceof Error) {
      this.handleError(parsedWhere.message, 'validation');
      return;
    }

    // Parse order-by conditions
    const parsedOrderBy = this.parseOrderByConditions(orderByConditions);
    if (parsedOrderBy instanceof Error) {
      this.handleError(parsedOrderBy.message, 'validation');
      return;
    }

    if (watch) {
      // Watch mode
      await this.watchCollection(
        firestore,
        collectionPath,
        parsedWhere,
        parsedOrderBy,
        format,
        showInitial || this.loadedConfig?.watchShowInitial || false,
        outputFormatter
      );
    } else {
      // Query mode
      const effectiveLimit = limit ?? this.loadedConfig?.defaultListLimit ?? 100;
      await this.queryCollection(
        firestore,
        collectionPath,
        parsedWhere,
        parsedOrderBy,
        effectiveLimit,
        format,
        outputFormatter,
        quiet,
        timestampOptions
      );
    }
  }

  /**
   * Parse where condition strings to WhereCondition objects
   */
  private parseWhereConditions(conditions: string[]): WhereCondition[] | Error {
    const parsed: WhereCondition[] = [];

    for (const condition of conditions) {
      // Match operators: ==, !=, <, <=, >, >=
      const match = condition.match(/^([^=!<>]+)(==|!=|<=|>=|<|>)(.+)$/);

      if (!match) {
        return new Error(`Invalid where condition: ${condition} (format: field==value)`);
      }

      const [, field, operator, valueStr] = match;

      // Parse value (try number, boolean, then string)
      let value: unknown = valueStr;
      if (valueStr === 'true') {
        value = true;
      } else if (valueStr === 'false') {
        value = false;
      } else if (valueStr === 'null') {
        value = null;
      } else if (!isNaN(Number(valueStr))) {
        value = Number(valueStr);
      }

      parsed.push({
        field: field.trim(),
        operator: operator as FirestoreOperator,
        value,
      });
    }

    return parsed;
  }

  /**
   * Parse order-by condition strings to OrderBy objects
   */
  private parseOrderByConditions(conditions: string[]): OrderBy[] | Error {
    const parsed: OrderBy[] = [];

    for (const condition of conditions) {
      const parts = condition.split(':');

      if (parts.length !== 2) {
        return new Error(`Invalid order-by condition: ${condition} (format: field:asc or field:desc)`);
      }

      const [field, direction] = parts;

      if (direction !== 'asc' && direction !== 'desc') {
        return new Error(`Invalid sort direction: ${direction} (use asc or desc)`);
      }

      parsed.push({
        field: field.trim(),
        direction,
      });
    }

    return parsed;
  }

  /**
   * Query collection and display results
   */
  private async queryCollection(
    firestore: any,
    collectionPath: string,
    where: WhereCondition[],
    orderBy: OrderBy[],
    limit: number,
    format: OutputFormat,
    outputFormatter: OutputFormatter,
    quiet: boolean,
    timestampOptions?: TimestampFormatOptions
  ): Promise<void> {
    const queryBuilder = new QueryBuilder(firestore);

    const queryOptions: QueryOptions = {
      where: where.length > 0 ? where : undefined,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
    };

    const result = await queryBuilder.executeQuery(collectionPath, queryOptions);

    if (result.isErr()) {
      this.handleError(result.error.message, 'firestore');
      return;
    }

    const { documents, executionTimeMs } = result.value;

    if (documents.length === 0) {
      if (!quiet) {
        console.log('No matching documents found');
        console.log(`\nExecution time: ${executionTimeMs}ms`);
      }
      return;
    }

    // Format and display documents with timestamp options
    const formatResult = outputFormatter.formatDocuments(
      documents,
      format,
      {},
      timestampOptions
    );

    if (formatResult.isErr()) {
      this.handleError(formatResult.error.message, 'unknown');
      return;
    }

    console.log(formatResult.value);
    if (!quiet) {
      console.log(`\nFound: ${documents.length} documents`);
      console.log(`Execution time: ${executionTimeMs}ms`);
    }
  }

  /**
   * Watch collection for changes
   */
  private async watchCollection(
    firestore: any,
    collectionPath: string,
    _where: WhereCondition[],
    _orderBy: OrderBy[],
    format: OutputFormat,
    showInitial: boolean,
    outputFormatter: OutputFormatter
  ): Promise<void> {
    const watchService = new WatchService(firestore);

    console.log(`Watching ${collectionPath} for changes...`);
    console.log('Press Ctrl+C to stop.\n');

    const onChange = (change: DocumentChange): void => {
      const formatResult = outputFormatter.formatChange(change, format, {
        includeMetadata: true,
      });

      if (formatResult.isOk()) {
        console.log(`[${new Date().toISOString()}] ${change.type.toUpperCase()}`);
        console.log(formatResult.value);
        console.log('');
      }
    };

    const onError = (error: Error): void => {
      this.loggingService.error(`Watch error: ${error.message}`);
    };

    const watchResult = watchService.watchCollection(collectionPath, {
      onChange,
      onError,
      showInitial,
    });

    if (watchResult.isErr()) {
      this.handleError(watchResult.error.message, 'firestore');
      return;
    }

    // Keep process alive and handle Ctrl+C
    const unsubscribe = watchResult.value;

    process.on('SIGINT', () => {
      console.log('\nStopping watch...');
      unsubscribe();
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => {});
  }

  /**
   * List root-level collections (alias for `firex collections`)
   */
  private async listRootCollections(
    firestoreOps: FirestoreOps,
    format: OutputFormat,
    outputFormatter: OutputFormatter,
    quiet: boolean
  ): Promise<void> {
    const result = await firestoreOps.listRootCollections();

    if (result.isErr()) {
      this.handleError(result.error.message, 'firestore');
      return;
    }

    const collections = result.value;

    if (collections.length === 0) {
      if (!quiet) {
        console.log(t('msg.noCollectionsFound'));
      }
      const formatResult = outputFormatter.formatCollections(collections, format, { quiet });
      if (formatResult.isOk()) {
        console.log(formatResult.value);
      }
      return;
    }

    const formatResult = outputFormatter.formatCollections(collections, format, { quiet });

    if (formatResult.isErr()) {
      this.handleError(formatResult.error.message, 'unknown');
      return;
    }

    console.log(formatResult.value);

    if (!quiet) {
      console.log(`\n${collections.length} ${t('msg.collectionsFound')}`);
    }
  }
}
