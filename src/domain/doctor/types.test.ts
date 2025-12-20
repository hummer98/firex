/**
 * Tests for doctor command types
 */

import { describe, it, expect } from 'vitest';
import {
  CheckStatus,
  CheckCategory,
  CheckResult,
  DiagnosticSummary,
  DiagnosticReport,
  CheckerError,
  DoctorError,
  createCheckResult,
  createDiagnosticSummary,
} from './types';

describe('Doctor Types', () => {
  describe('CheckStatus', () => {
    it('should support success, warning, and error statuses', () => {
      const statuses: CheckStatus[] = ['success', 'warning', 'error'];
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain('success');
      expect(statuses).toContain('warning');
      expect(statuses).toContain('error');
    });
  });

  describe('CheckCategory', () => {
    it('should support all required check categories', () => {
      const categories: CheckCategory[] = [
        'node-version',
        'firebase-cli',
        'auth-status',
        'firebaserc',
        'firestore-api',
        'firestore-access',
        'config-file',
        'config-syntax',
        'config-schema',
        'collection-paths',
        'build-status',
        'emulator-connection',
      ];
      expect(categories).toHaveLength(12);
    });
  });

  describe('CheckResult', () => {
    it('should create a valid CheckResult with required fields', () => {
      const result: CheckResult = {
        status: 'success',
        category: 'node-version',
        message: 'Node.js v20.0.0 is installed',
      };

      expect(result.status).toBe('success');
      expect(result.category).toBe('node-version');
      expect(result.message).toBe('Node.js v20.0.0 is installed');
    });

    it('should create a CheckResult with optional fields', () => {
      const result: CheckResult = {
        status: 'error',
        category: 'firebase-cli',
        message: 'Firebase CLI is not installed',
        details: 'Command "firebase --version" failed',
        guidance: 'Run: npm install -g firebase-tools',
      };

      expect(result.details).toBe('Command "firebase --version" failed');
      expect(result.guidance).toBe('Run: npm install -g firebase-tools');
    });
  });

  describe('DiagnosticSummary', () => {
    it('should correctly calculate hasErrors when errors > 0', () => {
      const summary: DiagnosticSummary = {
        total: 5,
        success: 3,
        warnings: 1,
        errors: 1,
        hasErrors: true,
      };

      expect(summary.hasErrors).toBe(true);
    });

    it('should correctly calculate hasErrors when errors = 0', () => {
      const summary: DiagnosticSummary = {
        total: 5,
        success: 4,
        warnings: 1,
        errors: 0,
        hasErrors: false,
      };

      expect(summary.hasErrors).toBe(false);
    });
  });

  describe('DiagnosticReport', () => {
    it('should create a complete diagnostic report', () => {
      const report: DiagnosticReport = {
        timestamp: '2025-12-20T12:00:00.000Z',
        environment: {
          nodeVersion: 'v20.0.0',
          platform: 'darwin',
          emulatorMode: false,
        },
        checks: [
          {
            status: 'success',
            category: 'node-version',
            message: 'Node.js v20.0.0 is installed',
          },
        ],
        summary: {
          total: 1,
          success: 1,
          warnings: 0,
          errors: 0,
          hasErrors: false,
        },
      };

      expect(report.timestamp).toBe('2025-12-20T12:00:00.000Z');
      expect(report.environment.nodeVersion).toBe('v20.0.0');
      expect(report.environment.platform).toBe('darwin');
      expect(report.environment.emulatorMode).toBe(false);
      expect(report.checks).toHaveLength(1);
      expect(report.summary.hasErrors).toBe(false);
    });
  });

  describe('CheckerError', () => {
    it('should create FILE_READ_ERROR type', () => {
      const error: CheckerError = {
        type: 'FILE_READ_ERROR',
        path: '/path/to/file',
        message: 'File not found',
      };

      expect(error.type).toBe('FILE_READ_ERROR');
    });

    it('should create PARSE_ERROR type with line and column', () => {
      const error: CheckerError = {
        type: 'PARSE_ERROR',
        message: 'Invalid YAML syntax',
        line: 10,
        column: 5,
      };

      expect(error.type).toBe('PARSE_ERROR');
      expect(error.line).toBe(10);
      expect(error.column).toBe(5);
    });

    it('should create EXECUTION_ERROR type', () => {
      const error: CheckerError = {
        type: 'EXECUTION_ERROR',
        command: 'firebase --version',
        message: 'Command not found',
      };

      expect(error.type).toBe('EXECUTION_ERROR');
      expect(error.command).toBe('firebase --version');
    });

    it('should create VALIDATION_ERROR type', () => {
      const error: CheckerError = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid value',
        field: 'projectId',
      };

      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('projectId');
    });
  });

  describe('DoctorError', () => {
    it('should create CHECKER_ERROR type', () => {
      const error: DoctorError = {
        type: 'CHECKER_ERROR',
        checker: 'EnvironmentChecker',
        error: {
          type: 'EXECUTION_ERROR',
          command: 'firebase --version',
          message: 'Command failed',
        },
      };

      expect(error.type).toBe('CHECKER_ERROR');
    });

    it('should create UNEXPECTED_ERROR type', () => {
      const error: DoctorError = {
        type: 'UNEXPECTED_ERROR',
        message: 'Something went wrong',
      };

      expect(error.type).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('createCheckResult helper', () => {
    it('should create a success CheckResult', () => {
      const result = createCheckResult('success', 'node-version', 'Node.js is OK');

      expect(result.status).toBe('success');
      expect(result.category).toBe('node-version');
      expect(result.message).toBe('Node.js is OK');
    });

    it('should create a CheckResult with optional fields', () => {
      const result = createCheckResult(
        'error',
        'firebase-cli',
        'Not installed',
        'Command failed',
        'Install via npm'
      );

      expect(result.details).toBe('Command failed');
      expect(result.guidance).toBe('Install via npm');
    });
  });

  describe('createDiagnosticSummary helper', () => {
    it('should create summary from check results', () => {
      const checks: CheckResult[] = [
        { status: 'success', category: 'node-version', message: 'OK' },
        { status: 'success', category: 'firebase-cli', message: 'OK' },
        { status: 'warning', category: 'config-file', message: 'Not found' },
        { status: 'error', category: 'auth-status', message: 'Failed' },
      ];

      const summary = createDiagnosticSummary(checks);

      expect(summary.total).toBe(4);
      expect(summary.success).toBe(2);
      expect(summary.warnings).toBe(1);
      expect(summary.errors).toBe(1);
      expect(summary.hasErrors).toBe(true);
    });

    it('should return hasErrors false when no errors', () => {
      const checks: CheckResult[] = [
        { status: 'success', category: 'node-version', message: 'OK' },
        { status: 'warning', category: 'config-file', message: 'Not found' },
      ];

      const summary = createDiagnosticSummary(checks);

      expect(summary.hasErrors).toBe(false);
    });

    it('should handle empty checks array', () => {
      const summary = createDiagnosticSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.success).toBe(0);
      expect(summary.warnings).toBe(0);
      expect(summary.errors).toBe(0);
      expect(summary.hasErrors).toBe(false);
    });
  });
});
