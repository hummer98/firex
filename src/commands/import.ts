/**
 * ImportCommand - Import data from JSON file to Firestore
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { BatchProcessor, ImportOptions } from '../domain/batch-processor';
import { t } from '../shared/i18n';

export class ImportCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.import.description');

  static override examples = [
    '<%= config.bin %> import backup.json',
    '<%= config.bin %> import users.json --batch-size=250',
  ];

  static override args = {
    file: Args.string({
      description: t('arg.file'),
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'batch-size': Flags.integer({
      description: t('flag.batchSize'),
      default: 500,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ImportCommand);
    const inputPath = args.file;
    const batchSize = flags['batch-size'];

    // Validate batch size
    if (batchSize < 1 || batchSize > 500) {
      this.handleError(
        `${t('err.invalidBatchSize')}: ${batchSize}`,
        'validation'
      );
      return;
    }

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
    const batchProcessor = new BatchProcessor(firestore);

    // Progress callback
    const progressCallback = (current: number, total: number): void => {
      if (total > 0) {
        const percentage = Math.round((current / total) * 100);
        process.stdout.write(`\r${t('msg.importProgress')}: ${current}/${total} (${percentage}%)`);
      }
    };

    console.log(`${t('msg.importing')} "${inputPath}"...`);
    console.log(`Batch size: ${batchSize}`);

    const importOptions: ImportOptions = {
      inputPath,
      batchSize,
      progressCallback,
    };

    const result = await batchProcessor.importData(importOptions);

    if (result.isErr()) {
      console.log(''); // New line after progress
      const error = result.error;

      if (error.type === 'BATCH_COMMIT_ERROR') {
        this.loggingService.error(`${t('msg.batchCommitError')}: ${error.message}`);
        if (error.partialSuccess) {
          console.log(`${error.committedCount} ${t('msg.batchPartialSuccess')}`);
          console.log(t('msg.batchRetryHint'));
        }
        this.exit(2);
        return;
      }

      if (error.type === 'VALIDATION_ERROR' && error.line !== undefined) {
        this.handleError(`${t('msg.validationErrorLine')} ${error.line}): ${error.message}`, 'validation');
      } else {
        this.handleError(error.message, 'firestore');
      }
      return;
    }

    console.log(''); // New line after progress
    console.log(`\n${t('msg.importComplete')}:`);
    console.log(`  ${t('msg.importSuccess')}: ${result.value.importedCount}`);
    if (result.value.skippedCount > 0) {
      console.log(`  ${t('msg.importSkipped')}: ${result.value.skippedCount}`);
    }
    if (result.value.failedCount > 0) {
      console.log(`  ${t('msg.importFailed')}: ${result.value.failedCount}`);
    }
  }
}
