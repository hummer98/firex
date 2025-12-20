/**
 * DiagnosticReporter - Formats and outputs diagnostic results
 */

import { Result, ok, err } from '../shared/types';
import type { CheckResult, DiagnosticReport, DiagnosticSummary } from '../domain/doctor/types';

/**
 * Status icons for terminal output
 */
const STATUS_ICONS = {
  success: '[OK]',
  warning: '[!]',
  error: '[X]',
} as const;

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
} as const;

/**
 * Format error type
 */
export interface FormatError {
  type: 'FORMAT_ERROR';
  message: string;
}

/**
 * Reporter options
 */
export interface DiagnosticReporterOptions {
  verbose?: boolean;
  useColors?: boolean;
}

/**
 * Diagnostic result reporter
 */
export class DiagnosticReporter {
  private verbose: boolean;
  private useColors: boolean;

  constructor(options: DiagnosticReporterOptions = {}) {
    this.verbose = options.verbose ?? false;
    this.useColors = options.useColors ?? true;
  }

  /**
   * Get color for status
   */
  private getStatusColor(status: 'success' | 'warning' | 'error'): string {
    if (!this.useColors) return '';
    switch (status) {
      case 'success':
        return COLORS.green;
      case 'warning':
        return COLORS.yellow;
      case 'error':
        return COLORS.red;
    }
  }

  /**
   * Reset color
   */
  private reset(): string {
    return this.useColors ? COLORS.reset : '';
  }

  /**
   * Format a single check result
   */
  formatCheckResult(result: CheckResult): string {
    const icon = STATUS_ICONS[result.status];
    const color = this.getStatusColor(result.status);
    const lines: string[] = [];

    // Main result line
    lines.push(`${color}${icon}${this.reset()} ${result.message}`);

    // Add details in verbose mode or for non-success status with guidance
    if (this.verbose && result.details) {
      lines.push(`    ${COLORS.dim}${result.details}${this.reset()}`);
    }

    // Add guidance for warnings and errors
    if (result.guidance && (result.status === 'warning' || result.status === 'error')) {
      const guidanceLines = result.guidance.split('\n');
      lines.push(`    ${COLORS.dim}Guidance:${this.reset()}`);
      guidanceLines.forEach((line) => {
        lines.push(`      ${line}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Format summary
   */
  formatSummary(summary: DiagnosticSummary): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('--- Summary ---');

    if (summary.hasErrors) {
      lines.push(`${COLORS.red}${summary.errors} error(s)${this.reset()} found`);
    }

    if (summary.warnings > 0) {
      lines.push(`${COLORS.yellow}${summary.warnings} warning(s)${this.reset()} found`);
    }

    if (!summary.hasErrors && summary.warnings === 0) {
      lines.push(`${COLORS.green}環境は正常です${this.reset()}`);
    }

    lines.push(`Total: ${summary.total} checks (${summary.success} passed, ${summary.warnings} warnings, ${summary.errors} errors)`);

    return lines.join('\n');
  }

  /**
   * Format complete diagnostic report
   */
  formatReport(report: DiagnosticReport, format: 'text' | 'json'): Result<string, FormatError> {
    try {
      if (format === 'json') {
        return ok(JSON.stringify(report, null, 2));
      }

      // Text format
      const lines: string[] = [];

      // Header
      lines.push('=== firex doctor ===');
      lines.push('');

      // Environment info
      lines.push(`Node.js: ${report.environment.nodeVersion}`);
      lines.push(`Platform: ${report.environment.platform}`);
      if (report.environment.emulatorMode) {
        lines.push(`${COLORS.yellow}Emulator Mode: Active${this.reset()}`);
      }
      lines.push('');

      // Check results by category
      lines.push('--- Checks ---');
      for (const check of report.checks) {
        lines.push(this.formatCheckResult(check));
      }

      // Summary
      lines.push(this.formatSummary(report.summary));

      return ok(lines.join('\n'));
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
