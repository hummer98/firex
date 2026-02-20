/**
 * ExportCommand - Export a Firestore collection to JSON file
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { BatchProcessor, ExportOptions } from '../domain/batch-processor';
import { t } from '../shared/i18n';

export class ExportCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.export.description');

  static override examples = [
    {
      command: '<%= config.bin %> export users --output=users.json',
      description: 'Export "users" collection to a JSON file',
    },
    {
      command: '<%= config.bin %> export users --output=backup.json --include-subcollections',
      description: 'Export including all subcollections',
    },
    {
      command: '<%= config.bin %> export orders --output=orders-backup.json --project-id=my-project',
      description: 'Export from a specific project',
    },
    {
      command: '<%= config.bin %> export users/user123/orders --output=user-orders.json',
      description: 'Export a subcollection',
    },
  ];

  static override args = {
    collection: Args.string({
      description: t('arg.collection'),
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: t('flag.output'),
      required: true,
    }),
    'include-subcollections': Flags.boolean({
      description: t('flag.includeSubcollections'),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportCommand);
    const collectionPath = args.collection;
    const outputPath = flags.output;
    const includeSubcollections = flags['include-subcollections'];

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

    // Validate collection path
    if (!firestoreOps.isCollectionPath(collectionPath)) {
      this.handleError(
        `${t('err.invalidCollectionPath')}: ${collectionPath}`,
        'validation'
      );
      return;
    }

    const batchProcessor = new BatchProcessor(firestore);

    // Progress callback
    const progressCallback = (current: number, total: number): void => {
      if (total > 0) {
        const percentage = Math.round((current / total) * 100);
        process.stdout.write(`\r${t('msg.exportProgress')}: ${current}/${total} (${percentage}%)`);
      }
    };

    console.log(`${t('msg.exporting')} "${collectionPath}"...`);
    if (includeSubcollections) {
      console.log(t('msg.exportingWithSub'));
    }

    const exportOptions: ExportOptions = {
      collectionPath,
      outputPath,
      includeSubcollections,
      progressCallback,
    };

    const result = await batchProcessor.exportCollection(exportOptions);

    if (result.isErr()) {
      console.log(''); // New line after progress
      this.handleError(result.error.message, 'firestore');
      return;
    }

    console.log(''); // New line after progress
    console.log(`\n${result.value.exportedCount} ${t('msg.exportedDocuments')}`);
    console.log(`${t('msg.outputFile')}: ${result.value.filePath}`);
  }
}
