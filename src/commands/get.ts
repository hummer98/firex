/**
 * GetCommand - Get a Firestore document
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { WatchService } from '../domain/watch-service';
import { OutputFormatter } from '../presentation/output-formatter';
import { t } from '../shared/i18n';
import type { OutputFormat, DocumentChange } from '../shared/types';

export class GetCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.get.description');

  static override examples = [
    '<%= config.bin %> get users/user123',
    '<%= config.bin %> get users/user123 --format=yaml',
    '<%= config.bin %> get users/user123 --yaml',
    '<%= config.bin %> get users/user123 --table',
    '<%= config.bin %> get users/user123 --watch',
    '<%= config.bin %> get users/user123 --watch --show-initial',
  ];

  static override args = {
    documentPath: Args.string({
      description: t('arg.documentPath'),
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    watch: Flags.boolean({
      char: 'w',
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
    const { args, flags } = await this.parse(GetCommand);
    const documentPath = args.documentPath;
    const format = this.resolveFormat(flags);
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

    // Validate document path (must have even number of segments)
    if (!firestoreOps.isDocumentPath(documentPath)) {
      this.handleError(
        `${t('err.invalidPath')}: ${documentPath}`,
        'validation'
      );
      return;
    }

    if (watch) {
      // Watch mode: monitor document changes
      await this.watchDocument(
        firestore,
        documentPath,
        format,
        showInitial || this.loadedConfig?.watchShowInitial || false,
        outputFormatter
      );
    } else {
      // Single fetch mode
      await this.fetchDocument(firestoreOps, documentPath, format, outputFormatter, quiet);
    }
  }

  /**
   * Fetch a single document
   */
  private async fetchDocument(
    firestoreOps: FirestoreOps,
    documentPath: string,
    format: OutputFormat,
    outputFormatter: OutputFormatter,
    quiet: boolean
  ): Promise<void> {
    const result = await firestoreOps.getDocument(documentPath);

    if (result.isErr()) {
      const error = result.error;
      if (error.type === 'NOT_FOUND') {
        this.handleError(`${t('err.documentNotFound')}: ${documentPath}`, 'firestore');
      } else {
        this.handleError(error.message, 'firestore');
      }
      return;
    }

    const document = result.value;

    // Format and output document
    const formatResult = outputFormatter.formatDocument(document, format, {
      includeMetadata: true,
    });

    if (formatResult.isErr()) {
      this.handleError(formatResult.error.message, 'unknown');
      return;
    }

    console.log(formatResult.value);

    // Also display metadata separately (unless quiet mode)
    if (!quiet) {
      const metadataResult = outputFormatter.formatMetadata(document.metadata);
      if (metadataResult.isOk()) {
        console.log('\n--- Metadata ---');
        console.log(metadataResult.value);
      }
    }
  }

  /**
   * Watch document for changes
   */
  private async watchDocument(
    firestore: any,
    documentPath: string,
    format: OutputFormat,
    showInitial: boolean,
    outputFormatter: OutputFormatter
  ): Promise<void> {
    const watchService = new WatchService(firestore);

    console.log(`Watching ${documentPath} for changes...`);
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

    const watchResult = watchService.watchDocument(documentPath, {
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
