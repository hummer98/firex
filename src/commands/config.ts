/**
 * ConfigCommand - Display and manage configuration
 */

import { Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { OutputFormatter } from '../presentation/output-formatter';
import { t } from '../shared/i18n';
import type { OutputFormat } from '../shared/types';

export class ConfigCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.config.description');

  static override examples = [
    '<%= config.bin %> config --show',
    '<%= config.bin %> config --show --format=yaml',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    show: Flags.boolean({
      char: 's',
      description: t('flag.show'),
      default: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigCommand);
    const format = (flags.format || 'json') as OutputFormat;
    const show = flags.show;

    // Initialize config (without auth)
    const initResult = await this.initialize();
    if (initResult.isErr()) {
      this.handleError(initResult.error.message, 'config');
      return;
    }

    if (show && this.loadedConfig) {
      const configDisplay = this.configService.getCurrentConfig(this.loadedConfig);

      const formatter = new OutputFormatter();

      // Create a DocumentWithMeta-like structure for formatting
      const configDoc = {
        data: configDisplay,
        metadata: {
          id: 'config',
          path: 'firex/config',
        },
      };

      const formatResult = formatter.formatDocument(configDoc, format);

      if (formatResult.isErr()) {
        this.handleError(formatResult.error.message, 'unknown');
        return;
      }

      console.log(`${t('msg.currentConfig')}:`);
      console.log(formatResult.value);
    }
  }
}
