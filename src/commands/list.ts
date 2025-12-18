/**
 * ListCommand - List documents in a collection with query support
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { QueryBuilder, QueryOptions } from '../domain/query-builder';
import { WatchService } from '../domain/watch-service';
import { OutputFormatter } from '../presentation/output-formatter';
import { t } from '../shared/i18n';
import type { OutputFormat, WhereCondition, OrderBy, DocumentChange, FirestoreOperator } from '../shared/types';

export class ListCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.list.description');

  static override examples = [
    '<%= config.bin %> list users',
    '<%= config.bin %> list users --limit=10',
    '<%= config.bin %> list users --where="age>=18" --order-by="age:desc"',
    '<%= config.bin %> list posts --where="status==published" --where="author==alice"',
    '<%= config.bin %> list users --watch',
  ];

  static override args = {
    collectionPath: Args.string({
      description: t('arg.collectionPath'),
      required: true,
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
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ListCommand);
    const collectionPath = args.collectionPath;
    const format = (flags.format || 'json') as OutputFormat;
    const whereConditions = flags.where || [];
    const orderByConditions = flags['order-by'] || [];
    const limit = flags.limit;
    const watch = flags.watch;
    const showInitial = flags['show-initial'];

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

    const outputFormatter = new OutputFormatter();

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
        outputFormatter
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
    outputFormatter: OutputFormatter
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
      console.log('No matching documents found');
      console.log(`\nExecution time: ${executionTimeMs}ms`);
      return;
    }

    // Format and display documents
    const formatResult = outputFormatter.formatDocuments(documents, format);

    if (formatResult.isErr()) {
      this.handleError(formatResult.error.message, 'unknown');
      return;
    }

    console.log(formatResult.value);
    console.log(`\nFound: ${documents.length} documents`);
    console.log(`Execution time: ${executionTimeMs}ms`);
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
}
