/**
 * Tests for DiagnosticReporter
 */

import { describe, it, expect } from 'vitest';
import { DiagnosticReporter } from './diagnostic-reporter';
import type { CheckResult, DiagnosticReport, DiagnosticSummary } from '../domain/doctor/types';

describe('DiagnosticReporter', () => {
  let reporter: DiagnosticReporter;

  beforeEach(() => {
    reporter = new DiagnosticReporter();
  });

  describe('formatCheckResult', () => {
    it('should format success result with checkmark icon', () => {
      const result: CheckResult = {
        status: 'success',
        category: 'node-version',
        message: 'Node.js v20.0.0 is installed',
      };

      const formatted = reporter.formatCheckResult(result);

      expect(formatted).toContain('v20.0.0');
      // Should contain a success indicator (checkmark or similar)
      expect(formatted).toMatch(/[+|OK]/i);
    });

    it('should format warning result with warning icon', () => {
      const result: CheckResult = {
        status: 'warning',
        category: 'config-file',
        message: 'Config file not found',
        guidance: 'Create a .firex.yaml file',
      };

      const formatted = reporter.formatCheckResult(result);

      expect(formatted).toContain('Config file not found');
      // Should contain guidance
      expect(formatted).toContain('.firex.yaml');
    });

    it('should format error result with error icon', () => {
      const result: CheckResult = {
        status: 'error',
        category: 'auth-status',
        message: 'Authentication failed',
        details: 'No credentials found',
        guidance: 'Run: gcloud auth application-default login',
      };

      const formatted = reporter.formatCheckResult(result);

      expect(formatted).toContain('Authentication failed');
      expect(formatted).toContain('gcloud auth');
    });
  });

  describe('formatSummary', () => {
    it('should format summary with all success', () => {
      const summary: DiagnosticSummary = {
        total: 5,
        success: 5,
        warnings: 0,
        errors: 0,
        hasErrors: false,
      };

      const formatted = reporter.formatSummary(summary);

      expect(formatted).toContain('5');
      // Should indicate all checks passed
      expect(formatted.toLowerCase()).toMatch(/ok|pass|success|normal/i);
    });

    it('should format summary with warnings only', () => {
      const summary: DiagnosticSummary = {
        total: 5,
        success: 3,
        warnings: 2,
        errors: 0,
        hasErrors: false,
      };

      const formatted = reporter.formatSummary(summary);

      expect(formatted).toContain('2');
      expect(formatted.toLowerCase()).toContain('warning');
    });

    it('should format summary with errors', () => {
      const summary: DiagnosticSummary = {
        total: 5,
        success: 2,
        warnings: 1,
        errors: 2,
        hasErrors: true,
      };

      const formatted = reporter.formatSummary(summary);

      expect(formatted).toContain('2');
      expect(formatted.toLowerCase()).toContain('error');
    });
  });

  describe('formatReport', () => {
    it('should format report as text', () => {
      const report: DiagnosticReport = {
        timestamp: '2025-12-20T12:00:00.000Z',
        environment: {
          nodeVersion: 'v20.0.0',
          platform: 'darwin',
          emulatorMode: false,
        },
        checks: [
          { status: 'success', category: 'node-version', message: 'Node.js v20.0.0' },
          { status: 'success', category: 'firebase-cli', message: 'Firebase CLI v13.0.0' },
        ],
        summary: {
          total: 2,
          success: 2,
          warnings: 0,
          errors: 0,
          hasErrors: false,
        },
      };

      const result = reporter.formatReport(report, 'text');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('Node.js');
        expect(result.value).toContain('Firebase CLI');
      }
    });

    it('should format report as JSON', () => {
      const report: DiagnosticReport = {
        timestamp: '2025-12-20T12:00:00.000Z',
        environment: {
          nodeVersion: 'v20.0.0',
          platform: 'darwin',
          emulatorMode: false,
        },
        checks: [
          { status: 'success', category: 'node-version', message: 'Node.js v20.0.0' },
        ],
        summary: {
          total: 1,
          success: 1,
          warnings: 0,
          errors: 0,
          hasErrors: false,
        },
      };

      const result = reporter.formatReport(report, 'json');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parsed = JSON.parse(result.value);
        expect(parsed.timestamp).toBe('2025-12-20T12:00:00.000Z');
        expect(parsed.environment.nodeVersion).toBe('v20.0.0');
        expect(parsed.checks).toHaveLength(1);
        expect(parsed.summary.hasErrors).toBe(false);
      }
    });

    it('should include emulator mode indicator when active', () => {
      const report: DiagnosticReport = {
        timestamp: '2025-12-20T12:00:00.000Z',
        environment: {
          nodeVersion: 'v20.0.0',
          platform: 'darwin',
          emulatorMode: true,
        },
        checks: [],
        summary: {
          total: 0,
          success: 0,
          warnings: 0,
          errors: 0,
          hasErrors: false,
        },
      };

      const result = reporter.formatReport(report, 'text');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.toLowerCase()).toContain('emulator');
      }
    });
  });

  describe('verbose mode', () => {
    it('should include additional details in verbose mode', () => {
      const verboseReporter = new DiagnosticReporter({ verbose: true });

      const result: CheckResult = {
        status: 'success',
        category: 'node-version',
        message: 'Node.js v20.0.0 is installed',
        details: 'Detected from process.version',
      };

      const formatted = verboseReporter.formatCheckResult(result);

      expect(formatted).toContain('process.version');
    });
  });
});
