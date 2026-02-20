/**
 * UpdateCommand - Partial update a Firestore document (alias for set --merge)
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { ValidationService } from '../domain/validation-service';
import { FieldValueTransformer } from '../domain/field-value-transformer';
import { FileSystemService } from '../presentation/filesystem-service';
import { t } from '../shared/i18n';

export class UpdateCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.update.description');

  static override examples = [
    {
      command: '<%= config.bin %> update users/user123 \'{"age": 31}\'',
      description: 'Partially update a document (same as set --merge)',
    },
    {
      command: '<%= config.bin %> update users/user123 --from-file=update.json',
      description: 'Update from a JSON file',
    },
    // FieldValue examples
    {
      command: '<%= config.bin %> update posts/post1 \'{"viewCount": {"$fieldValue": "increment", "operand": 1}}\'',
      description: 'Atomically increment a numeric field by 1',
    },
    {
      command: '<%= config.bin %> update posts/post1 \'{"viewCount": {"$fieldValue": "increment", "operand": -1}}\'',
      description: 'Atomically decrement a numeric field by 1',
    },
    {
      command: '<%= config.bin %> update users/user123 \'{"tags": {"$fieldValue": "arrayUnion", "elements": ["premium"]}}\'',
      description: 'Add elements to an array (ignores duplicates)',
    },
    {
      command: '<%= config.bin %> update users/user123 \'{"tags": {"$fieldValue": "arrayRemove", "elements": ["trial"]}}\'',
      description: 'Remove elements from an array',
    },
    {
      command: '<%= config.bin %> update users/user123 \'{"oldField": {"$fieldValue": "delete"}}\'',
      description: 'Delete a specific field from the document',
    },
    {
      command: '<%= config.bin %> update users/user123 \'{"updatedAt": {"$fieldValue": "serverTimestamp"}}\'',
      description: 'Set server timestamp on update',
    },
    // $timestampValue examples
    {
      command: '<%= config.bin %> update events/event1 \'{"startAt": {"$timestampValue": "2025-06-01T09:00:00Z"}}\'',
      description: 'Store an ISO 8601 string as a Firestore Timestamp',
    },
    {
      command: '<%= config.bin %> update events/event1 \'{"startAt": {"$timestampValue": "2025-06-01T18:00:00+09:00"}}\'',
      description: 'Timestamp with timezone offset (JST)',
    },
  ];

  static override args = {
    documentPath: Args.string({
      description: t('arg.documentPath'),
      required: true,
    }),
    data: Args.string({
      description: t('arg.data'),
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'from-file': Flags.string({
      description: t('flag.fromFile'),
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UpdateCommand);
    const documentPath = args.documentPath;
    const jsonData = args.data;
    const fromFile = flags['from-file'];

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
    const validationService = new ValidationService();

    // Validate document path (must have even number of segments)
    if (!firestoreOps.isDocumentPath(documentPath)) {
      this.handleError(
        `${t('err.invalidPath')}: ${documentPath}`,
        'validation'
      );
      return;
    }

    // Get data from either CLI argument or file
    let data: Record<string, unknown>;

    if (fromFile) {
      // Read from file
      const fsService = new FileSystemService();
      const fileResult = await fsService.readJSON<Record<string, unknown>>(fromFile);

      if (fileResult.isErr()) {
        this.handleError(fileResult.error.message, 'validation');
        return;
      }

      data = fileResult.value;
    } else if (jsonData) {
      // Parse JSON string
      try {
        data = JSON.parse(jsonData);
      } catch (error) {
        this.handleError(
          `${t('err.invalidJson')}: ${error instanceof Error ? error.message : String(error)}`,
          'validation'
        );
        return;
      }
    } else {
      this.handleError(t('err.invalidJson'), 'validation');
      return;
    }

    // Validate data
    const validationResult = validationService.validateDocumentData(data);
    if (validationResult.isErr()) {
      this.handleError(validationResult.error.message, 'validation');
      return;
    }

    // Transform $fieldValue objects to FieldValue sentinels
    const fieldValueTransformer = new FieldValueTransformer();
    const transformResult = fieldValueTransformer.transform(data);
    if (transformResult.isErr()) {
      this.handleError(transformResult.error.message, 'validation');
      return;
    }
    const transformedData = transformResult.value;

    // Update document (set with merge=true)
    const writeResult = await firestoreOps.setDocument(documentPath, transformedData, true);
    if (writeResult.isErr()) {
      this.handleError(writeResult.error.message, 'firestore');
      return;
    }

    // Success message
    console.log(`${t('msg.documentUpdated')}: ${documentPath}`);
  }
}
