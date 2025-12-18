/**
 * SetCommand - Create or overwrite a Firestore document
 */

import { Args, Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { FirestoreOps } from '../domain/firestore-ops';
import { ValidationService } from '../domain/validation-service';
import { FileSystemService } from '../presentation/filesystem-service';
import { t } from '../shared/i18n';

export class SetCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.set.description');

  static override examples = [
    '<%= config.bin %> set users/user123 \'{"name": "Alice", "age": 30}\'',
    '<%= config.bin %> set users/user123 \'{"age": 31}\' --merge',
    '<%= config.bin %> set users/user123 --from-file=user.json',
    '<%= config.bin %> set users/user123 --from-file=user.json --merge',
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
    merge: Flags.boolean({
      char: 'm',
      description: t('flag.merge'),
      default: false,
    }),
    'from-file': Flags.string({
      description: t('flag.fromFile'),
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SetCommand);
    const documentPath = args.documentPath;
    const jsonData = args.data;
    const merge = flags.merge;
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

    // Write document
    const writeResult = await firestoreOps.setDocument(documentPath, data, merge);
    if (writeResult.isErr()) {
      this.handleError(writeResult.error.message, 'firestore');
      return;
    }

    // Success message
    if (merge) {
      console.log(`${t('msg.documentUpdated')}: ${documentPath}`);
    } else {
      console.log(`${t('msg.documentCreated')}: ${documentPath}`);
    }
  }
}
