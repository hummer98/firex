/**
 * CollectionsCommand - List collections in Firestore
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { OutputFormatter } from '../presentation/output-formatter';
import { t } from '../shared/i18n';
import type { OutputFormat } from '../shared/types';

export class CollectionsCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.collections.description');

  static override examples = [
    {
      command: '<%= config.bin %> collections',
      description: 'List all root-level collections',
    },
    {
      command: '<%= config.bin %> collections users/user123',
      description: 'List subcollections under a specific document',
    },
    {
      command: '<%= config.bin %> collections --json',
      description: 'Output in JSON format',
    },
    {
      command: '<%= config.bin %> collections users/user123 --yaml',
      description: 'List subcollections in YAML format',
    },
    {
      command: '<%= config.bin %> collections --table',
      description: 'Output in table format',
    },
    {
      command: '<%= config.bin %> collections --quiet',
      description: 'Output only collection names without summary',
    },
  ];

  static override args = {
    documentPath: Args.string({
      description: t('arg.documentPathOptional'),
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    quiet: Flags.boolean({
      char: 'q',
      description: t('flag.quiet'),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CollectionsCommand);
    const documentPath = args.documentPath;
    const format = this.resolveFormat(flags);
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

    if (documentPath) {
      // Subcollections mode: get collections under a document
      await this.listSubcollections(
        firestoreOps,
        documentPath,
        format,
        outputFormatter,
        quiet
      );
    } else {
      // Root collections mode: get all root-level collections
      await this.listRootCollections(
        firestoreOps,
        format,
        outputFormatter,
        quiet
      );
    }
  }

  /**
   * List root-level collections
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
      // Still output empty result in requested format
      const formatResult = outputFormatter.formatCollections(collections, format, { quiet });
      if (formatResult.isOk()) {
        console.log(formatResult.value);
      }
      return;
    }

    // Format and display collections
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

  /**
   * List subcollections under a document
   */
  private async listSubcollections(
    firestoreOps: FirestoreOps,
    documentPath: string,
    format: OutputFormat,
    outputFormatter: OutputFormatter,
    quiet: boolean
  ): Promise<void> {
    // Validate document path format
    if (!firestoreOps.isDocumentPath(documentPath)) {
      this.handleError(
        `${t('err.invalidPath')}: ${documentPath}`,
        'validation'
      );
      return;
    }

    const result = await firestoreOps.listSubcollections(documentPath);

    if (result.isErr()) {
      const error = result.error;
      if (error.type === 'NOT_FOUND') {
        this.handleError(t('err.documentNotFoundForSubcollections'), 'firestore');
      } else {
        this.handleError(error.message, 'firestore');
      }
      return;
    }

    const collections = result.value;

    if (collections.length === 0) {
      if (!quiet) {
        console.log(t('msg.noSubcollectionsFound'));
      }
      // Still output empty result in requested format
      const formatResult = outputFormatter.formatCollections(collections, format, { quiet });
      if (formatResult.isOk()) {
        console.log(formatResult.value);
      }
      return;
    }

    // Format and display collections
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
