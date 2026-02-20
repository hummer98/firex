/**
 * DeleteCommand - Delete Firestore document or collection
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { BatchProcessor } from '../domain/batch-processor';
import { PromptService } from '../presentation/prompt-service';
import { t } from '../shared/i18n';

export class DeleteCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.delete.description');

  static override examples = [
    {
      command: '<%= config.bin %> delete users/user123',
      description: 'Delete a single document (with confirmation prompt)',
    },
    {
      command: '<%= config.bin %> delete users/user123 --yes',
      description: 'Delete without confirmation prompt',
    },
    {
      command: '<%= config.bin %> delete users --recursive',
      description: 'Delete all documents in a collection (with confirmation)',
    },
    {
      command: '<%= config.bin %> delete users --recursive --yes',
      description: 'Delete all documents in a collection without confirmation',
    },
    {
      command: '<%= config.bin %> delete users/user123/orders --recursive --yes',
      description: 'Delete all documents in a subcollection',
    },
  ];

  static override args = {
    path: Args.string({
      description: t('arg.path'),
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    recursive: Flags.boolean({
      char: 'r',
      description: t('flag.recursive'),
      default: false,
    }),
    yes: Flags.boolean({
      char: 'y',
      description: t('flag.yes'),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DeleteCommand);
    const path = args.path;
    const recursive = flags.recursive;
    const skipConfirm = flags.yes;

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
    const promptService = new PromptService();

    // Determine if path is document or collection
    const isDocument = firestoreOps.isDocumentPath(path);
    const isCollection = firestoreOps.isCollectionPath(path);

    if (recursive && !isCollection) {
      this.handleError(
        '--recursive can only be used with collection paths',
        'validation'
      );
      return;
    }

    if (isDocument) {
      // Single document deletion
      await this.deleteDocument(firestoreOps, path, skipConfirm, promptService);
    } else if (isCollection) {
      if (recursive) {
        // Recursive collection deletion
        await this.deleteCollection(firestore, path, skipConfirm, promptService);
      } else {
        this.handleError(
          'Use --recursive to delete a collection',
          'validation'
        );
      }
    } else {
      this.handleError(`${t('err.invalidPath')}: ${path}`, 'validation');
    }
  }

  /**
   * Delete a single document
   */
  private async deleteDocument(
    firestoreOps: FirestoreOps,
    path: string,
    skipConfirm: boolean,
    promptService: PromptService
  ): Promise<void> {
    // Confirm unless --yes is specified
    if (!skipConfirm) {
      const confirmResult = await promptService.confirm(
        `${t('prompt.confirmDelete')} "${path}"?`
      );

      if (confirmResult.isErr()) {
        this.handleError(confirmResult.error.message, 'unknown');
        return;
      }

      if (!confirmResult.value) {
        console.log('Cancelled');
        return;
      }
    }

    const result = await firestoreOps.deleteDocument(path);

    if (result.isErr()) {
      this.handleError(result.error.message, 'firestore');
      return;
    }

    console.log(`${t('msg.documentDeleted')}: ${path}`);
  }

  /**
   * Delete a collection recursively
   */
  private async deleteCollection(
    firestore: any,
    path: string,
    skipConfirm: boolean,
    promptService: PromptService
  ): Promise<void> {
    const batchProcessor = new BatchProcessor(firestore);

    const confirmCallback = async (): Promise<boolean> => {
      if (skipConfirm) {
        return true;
      }

      const confirmResult = await promptService.confirm(
        `${t('prompt.confirmDeleteCollection')} "${path}"`
      );

      if (confirmResult.isErr()) {
        return false;
      }

      return confirmResult.value;
    };

    const result = await batchProcessor.deleteCollection(path, confirmCallback);

    if (result.isErr()) {
      this.handleError(result.error.message, 'firestore');
      return;
    }

    if (result.value.deletedCount === 0) {
      console.log('Cancelled or no documents to delete');
    } else {
      console.log(`${result.value.deletedCount} ${t('msg.documentsDeleted')}`);
    }
  }
}
