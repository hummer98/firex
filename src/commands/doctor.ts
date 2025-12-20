/**
 * DoctorCommand - Diagnose firex CLI environment and configuration
 */

import { Flags } from '@oclif/core';
import { BaseCommand } from './base-command';
import { DoctorService } from '../services/doctor-service';
import { DiagnosticReporter } from '../presentation/diagnostic-reporter';
import { t } from '../shared/i18n';

export class DoctorCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.doctor.description');

  static override examples = [
    '<%= config.bin %> doctor',
    '<%= config.bin %> doctor --json',
    '<%= config.bin %> doctor --verbose',
  ];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: t('flag.verbose'),
      default: false,
    }),
    json: Flags.boolean({
      description: '診断結果を JSON 形式で出力する',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DoctorCommand);
    const verbose = flags.verbose;
    const jsonOutput = flags.json;

    // Create services
    const doctorService = new DoctorService({
      getFirestore: () => this.firestore,
      getConfig: () => this.loadedConfig,
    });
    const reporter = new DiagnosticReporter({
      verbose,
      useColors: !jsonOutput,
    });

    // Run diagnostics
    const result = await doctorService.runDiagnostics({
      verbose,
      skipBuildCheck: false,
    });

    if (result.isErr()) {
      const errorMsg = result.error.type === 'UNEXPECTED_ERROR'
        ? result.error.message
        : `${result.error.checker}: ${result.error.error.message}`;
      this.loggingService.error(`診断の実行に失敗しました: ${errorMsg}`);
      this.exit(1);
      return;
    }

    const report = result.value;

    // Format and output report
    const formatResult = reporter.formatReport(report, jsonOutput ? 'json' : 'text');

    if (formatResult.isErr()) {
      this.loggingService.error(`診断結果のフォーマットに失敗しました: ${formatResult.error.message}`);
      this.exit(1);
      return;
    }

    console.log(formatResult.value);

    // Exit with appropriate code
    if (report.summary.hasErrors) {
      this.exit(1);
    }
  }
}
