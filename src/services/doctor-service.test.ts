/**
 * Tests for DoctorService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DoctorService } from './doctor-service';
import type { CheckResult } from '../domain/doctor/types';

describe('DoctorService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectEmulatorMode', () => {
    it('should return true when FIRESTORE_EMULATOR_HOST is set', () => {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

      const service = new DoctorService();
      expect(service.detectEmulatorMode()).toBe(true);
    });

    it('should return false when FIRESTORE_EMULATOR_HOST is not set', () => {
      delete process.env.FIRESTORE_EMULATOR_HOST;

      const service = new DoctorService();
      expect(service.detectEmulatorMode()).toBe(false);
    });
  });

  describe('runDiagnostics', () => {
    it('should run all checkers and return a report', async () => {
      const mockEnvironmentChecker = {
        checkNodeVersion: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'node-version', message: 'OK' },
        }),
        checkFirebaseCLI: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firebase-cli', message: 'OK' },
        }),
        checkAuthStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'auth-status', message: 'OK' },
        }),
      };

      const mockFirebaseChecker = {
        checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
        checkFirestoreAPI: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firestore-api', message: 'OK' },
        }),
        checkFirestoreAccess: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firestore-access', message: 'OK' },
        }),
        checkEmulatorConnection: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'emulator-connection', message: 'OK' },
        }),
      };

      const mockConfigChecker = {
        checkConfigFile: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'config-file', message: 'OK' },
        }),
        validateConfigSyntax: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'config-syntax', message: 'OK' },
        }),
        validateConfigSchema: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'config-schema', message: 'OK' },
        }),
        validateCollectionPaths: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'collection-paths', message: 'OK' },
        }),
      };

      const mockBuildChecker = {
        checkBuildStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'build-status', message: 'OK' },
        }),
        isNpmPackageInstall: vi.fn().mockReturnValue(false),
      };

      delete process.env.FIRESTORE_EMULATOR_HOST;

      const service = new DoctorService({
        environmentChecker: mockEnvironmentChecker as any,
        firebaseChecker: mockFirebaseChecker as any,
        configChecker: mockConfigChecker as any,
        buildChecker: mockBuildChecker as any,
      });

      const result = await service.runDiagnostics({ verbose: false });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.checks.length).toBeGreaterThan(0);
        expect(result.value.summary.hasErrors).toBe(false);
        expect(result.value.environment.emulatorMode).toBe(false);
      }
    });

    it('should skip auth check in emulator mode', async () => {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

      const mockEnvironmentChecker = {
        checkNodeVersion: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'node-version', message: 'OK' },
        }),
        checkFirebaseCLI: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firebase-cli', message: 'OK' },
        }),
        checkAuthStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'auth-status', message: 'Emulator mode' },
        }),
      };

      const mockFirebaseChecker = {
        checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
        checkFirestoreAPI: vi.fn(),
        checkFirestoreAccess: vi.fn(),
        checkEmulatorConnection: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'emulator-connection', message: 'OK' },
        }),
      };

      const mockConfigChecker = {
        checkConfigFile: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'config-file', message: 'OK' },
        }),
        validateConfigSyntax: vi.fn(),
        validateConfigSchema: vi.fn(),
        validateCollectionPaths: vi.fn(),
      };

      const mockBuildChecker = {
        checkBuildStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'build-status', message: 'OK' },
        }),
        isNpmPackageInstall: vi.fn().mockReturnValue(false),
      };

      const service = new DoctorService({
        environmentChecker: mockEnvironmentChecker as any,
        firebaseChecker: mockFirebaseChecker as any,
        configChecker: mockConfigChecker as any,
        buildChecker: mockBuildChecker as any,
      });

      const result = await service.runDiagnostics({ verbose: false });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.environment.emulatorMode).toBe(true);
        // Should run emulator connection check
        expect(mockFirebaseChecker.checkEmulatorConnection).toHaveBeenCalled();
        // Should NOT run Firestore API and access checks
        expect(mockFirebaseChecker.checkFirestoreAPI).not.toHaveBeenCalled();
        expect(mockFirebaseChecker.checkFirestoreAccess).not.toHaveBeenCalled();
      }
    });

    it('should skip build check when skipBuildCheck is true', async () => {
      const mockEnvironmentChecker = {
        checkNodeVersion: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'node-version', message: 'OK' },
        }),
        checkFirebaseCLI: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firebase-cli', message: 'OK' },
        }),
        checkAuthStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'auth-status', message: 'OK' },
        }),
      };

      const mockFirebaseChecker = {
        checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
        checkFirestoreAPI: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firestore-api', message: 'OK' },
        }),
        checkFirestoreAccess: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firestore-access', message: 'OK' },
        }),
        checkEmulatorConnection: vi.fn(),
      };

      const mockConfigChecker = {
        checkConfigFile: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'config-file', message: 'OK' },
        }),
        validateConfigSyntax: vi.fn(),
        validateConfigSchema: vi.fn(),
        validateCollectionPaths: vi.fn(),
      };

      const mockBuildChecker = {
        checkBuildStatus: vi.fn(),
        isNpmPackageInstall: vi.fn().mockReturnValue(false),
      };

      delete process.env.FIRESTORE_EMULATOR_HOST;

      const service = new DoctorService({
        environmentChecker: mockEnvironmentChecker as any,
        firebaseChecker: mockFirebaseChecker as any,
        configChecker: mockConfigChecker as any,
        buildChecker: mockBuildChecker as any,
      });

      const result = await service.runDiagnostics({ verbose: false, skipBuildCheck: true });

      expect(result.isOk()).toBe(true);
      expect(mockBuildChecker.checkBuildStatus).not.toHaveBeenCalled();
    });

    it('should handle checker failures gracefully', async () => {
      const mockEnvironmentChecker = {
        checkNodeVersion: vi.fn().mockReturnValue({
          isOk: () => true,
          value: { status: 'success', category: 'node-version', message: 'OK' },
        }),
        checkFirebaseCLI: vi.fn().mockResolvedValue({
          isOk: () => false,
          error: { type: 'EXECUTION_ERROR', command: 'firebase', message: 'Failed' },
        }),
        checkAuthStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'auth-status', message: 'OK' },
        }),
      };

      const mockFirebaseChecker = {
        checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
        checkFirestoreAPI: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firestore-api', message: 'OK' },
        }),
        checkFirestoreAccess: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'firestore-access', message: 'OK' },
        }),
        checkEmulatorConnection: vi.fn(),
      };

      const mockConfigChecker = {
        checkConfigFile: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'config-file', message: 'OK' },
        }),
        validateConfigSyntax: vi.fn(),
        validateConfigSchema: vi.fn(),
        validateCollectionPaths: vi.fn(),
      };

      const mockBuildChecker = {
        checkBuildStatus: vi.fn().mockResolvedValue({
          isOk: () => true,
          value: { status: 'success', category: 'build-status', message: 'OK' },
        }),
        isNpmPackageInstall: vi.fn().mockReturnValue(false),
      };

      delete process.env.FIRESTORE_EMULATOR_HOST;

      const service = new DoctorService({
        environmentChecker: mockEnvironmentChecker as any,
        firebaseChecker: mockFirebaseChecker as any,
        configChecker: mockConfigChecker as any,
        buildChecker: mockBuildChecker as any,
      });

      const result = await service.runDiagnostics({ verbose: false });

      // Should still succeed but report the error
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should have an error result for the failed checker
        const firebaseCLICheck = result.value.checks.find(c => c.category === 'firebase-cli');
        expect(firebaseCLICheck?.status).toBe('error');
      }
    });

    // Task 12.1: validateConfigSyntax() integration tests
    describe('Config syntax validation integration', () => {
      it('should run validateConfigSyntax when config file is found', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',
              details: 'File path: /path/to/.firex.yaml',
              metadata: { filePath: '/path/to/.firex.yaml', found: true },
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'Schema is valid' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'Paths are valid' },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should have called validateConfigSyntax
          expect(mockConfigChecker.validateConfigSyntax).toHaveBeenCalled();
          // Should have config-syntax check result
          const syntaxCheck = result.value.checks.find(c => c.category === 'config-syntax');
          expect(syntaxCheck).toBeDefined();
          expect(syntaxCheck?.status).toBe('success');
        }
      });

      it('should include syntax error details with line/column info', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',
              details: 'File path: /path/to/.firex.yaml',
              metadata: { filePath: '/path/to/.firex.yaml', found: true },
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'invalid: yaml\n  bad: indentation',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: {
              status: 'error',
              category: 'config-syntax',
              message: 'YAML syntax error',
              details: 'Position: Line 2, Col 3\nInvalid indentation',
              guidance: 'Check your YAML syntax.',
            },
          }),
          parseConfig: vi.fn(),
          validateConfigSchema: vi.fn(),
          validateCollectionPaths: vi.fn(),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const syntaxCheck = result.value.checks.find(c => c.category === 'config-syntax');
          expect(syntaxCheck).toBeDefined();
          expect(syntaxCheck?.status).toBe('error');
          expect(syntaxCheck?.details).toContain('Line');
          expect(syntaxCheck?.details).toContain('Col');
          // Should NOT run schema validation when syntax fails
          expect(mockConfigChecker.validateConfigSchema).not.toHaveBeenCalled();
        }
      });

      it('should not run syntax validation when config file is not found', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file not found - using defaults',
              metadata: { found: false },
            },
          }),
          readFile: vi.fn(),
          validateConfigSyntax: vi.fn(),
          parseConfig: vi.fn(),
          validateConfigSchema: vi.fn(),
          validateCollectionPaths: vi.fn(),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        // Should NOT call validateConfigSyntax when config file not found
        expect(mockConfigChecker.validateConfigSyntax).not.toHaveBeenCalled();
      });
    });

    // Task 12.2: validateConfigSchema() integration tests
    describe('Config schema validation integration', () => {
      it('should run validateConfigSchema when syntax is valid', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',
              details: 'File path: /path/to/.firex.yaml',
              metadata: { filePath: '/path/to/.firex.yaml', found: true },
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'Schema is valid' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'Paths are valid' },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should have called validateConfigSchema
          expect(mockConfigChecker.validateConfigSchema).toHaveBeenCalled();
          // Should have config-schema check result
          const schemaCheck = result.value.checks.find(c => c.category === 'config-schema');
          expect(schemaCheck).toBeDefined();
          expect(schemaCheck?.status).toBe('success');
        }
      });

      it('should include schema violation details', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',
              details: 'File path: /path/to/.firex.yaml',
              metadata: { filePath: '/path/to/.firex.yaml', found: true },
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: 123',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 123 },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: {
              status: 'error',
              category: 'config-schema',
              message: 'Schema validation failed',
              details: '  - projectId: Expected string, received number',
              guidance: 'Check your config file field values.',
            },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'Paths are valid' },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const schemaCheck = result.value.checks.find(c => c.category === 'config-schema');
          expect(schemaCheck).toBeDefined();
          expect(schemaCheck?.status).toBe('error');
          expect(schemaCheck?.details).toBeDefined();
          expect(schemaCheck?.guidance).toBeDefined();
        }
      });
    });

    // Task 6.3: metadata-based config file detection (replaces hardcoded Japanese strings)
    describe('Metadata-based config file detection', () => {
      it('should use metadata.found and metadata.filePath instead of message string matching', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        // Use ENGLISH message (locale-independent) with metadata
        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',  // English message
              details: 'File path: /path/to/.firex.yaml',  // English details
              metadata: { filePath: '/path/to/.firex.yaml', found: true },  // Metadata for logic
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'Schema is valid' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'Paths are valid' },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should call validateConfigSyntax with the correct file path from metadata
          expect(mockConfigChecker.validateConfigSyntax).toHaveBeenCalled();
          expect(mockConfigChecker.readFile).toHaveBeenCalledWith('/path/to/.firex.yaml');

          // Should have config-syntax check result
          const syntaxCheck = result.value.checks.find(c => c.category === 'config-syntax');
          expect(syntaxCheck).toBeDefined();
          expect(syntaxCheck?.status).toBe('success');
        }
      });

      it('should not run syntax validation when metadata.found is false', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        // Config file not found - English message with metadata
        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file not found - using defaults',  // English message
              metadata: { found: false },  // Metadata for logic
            },
          }),
          readFile: vi.fn(),
          validateConfigSyntax: vi.fn(),
          parseConfig: vi.fn(),
          validateConfigSchema: vi.fn(),
          validateCollectionPaths: vi.fn(),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        // Should NOT call validateConfigSyntax when config file not found
        expect(mockConfigChecker.validateConfigSyntax).not.toHaveBeenCalled();
      });
    });

    // Task 12.3: validateCollectionPaths() integration tests
    describe('Collection paths validation integration', () => {
      it('should run validateCollectionPaths when config has collection paths', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'my-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',
              details: 'File path: /path/to/.firex.yaml',
              metadata: { filePath: '/path/to/.firex.yaml', found: true },
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'Schema is valid' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'collection-paths',
              message: 'All collection paths are valid (2)',
            },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should have called validateCollectionPaths
          expect(mockConfigChecker.validateCollectionPaths).toHaveBeenCalled();
          // Should have collection-paths check result
          const pathsCheck = result.value.checks.find(c => c.category === 'collection-paths');
          expect(pathsCheck).toBeDefined();
          expect(pathsCheck?.status).toBe('success');
        }
      });

      it('should report invalid collection paths (odd segments rule)', async () => {
        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'my-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        const mockConfigChecker = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',
              details: 'File path: /path/to/.firex.yaml',
              metadata: { filePath: '/path/to/.firex.yaml', found: true },
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'Schema is valid' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: {
              status: 'error',
              category: 'collection-paths',
              message: 'Invalid collection paths format',
              details: 'Invalid paths:\n  users/user1',
              guidance: 'Collection paths must have an odd number of segments.',
            },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        const service = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigChecker as any,
          buildChecker: mockBuildChecker as any,
        });

        const result = await service.runDiagnostics({ verbose: false });

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const pathsCheck = result.value.checks.find(c => c.category === 'collection-paths');
          expect(pathsCheck).toBeDefined();
          expect(pathsCheck?.status).toBe('error');
          expect(pathsCheck?.details).toContain('users/user1');
          expect(pathsCheck?.guidance).toContain('odd');
        }
      });
    });

    // Task 6.5: Locale switching verification
    describe('Locale switching behavior verification', () => {
      it('should run syntax/schema validation regardless of locale (metadata-based)', async () => {
        // This test verifies that the fix works for both locales
        // by testing that metadata.found and metadata.filePath are used
        // instead of hardcoded message strings

        const mockEnvironmentChecker = {
          checkNodeVersion: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'node-version', message: 'OK' },
          }),
          checkFirebaseCLI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firebase-cli', message: 'OK' },
          }),
          checkAuthStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'auth-status', message: 'OK' },
          }),
        };

        const mockFirebaseChecker = {
          checkProjectId: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'project-id', message: 'OK' },
          }),
          resolveProjectId: vi.fn().mockReturnValue({ projectId: 'test-project', source: 'firebaserc' }),
          checkFirestoreAPI: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-api', message: 'OK' },
          }),
          checkFirestoreAccess: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'firestore-access', message: 'OK' },
          }),
          checkEmulatorConnection: vi.fn(),
        };

        // Simulate Japanese locale messages with metadata
        const mockConfigCheckerJa = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: '設定ファイルが見つかりました: .firex.yaml',  // Japanese message
              details: 'ファイルパス: /path/to/.firex.yaml',  // Japanese details
              metadata: { filePath: '/path/to/.firex.yaml', found: true },  // Metadata for logic
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML 構文は有効です' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'スキーマは有効です' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'パスは有効です' },
          }),
        };

        // Simulate English locale messages with metadata
        const mockConfigCheckerEn = {
          checkConfigFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'config-file',
              message: 'Config file found: .firex.yaml',  // English message
              details: 'File path: /path/to/.firex.yaml',  // English details
              metadata: { filePath: '/path/to/.firex.yaml', found: true },  // Metadata for logic
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: my-project',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML syntax is valid' },
          }),
          parseConfig: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { projectId: 'my-project' },
          }),
          validateConfigSchema: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-schema', message: 'Schema is valid' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'Paths are valid' },
          }),
        };

        const mockBuildChecker = {
          checkBuildStatus: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: { status: 'success', category: 'build-status', message: 'OK' },
          }),
          isNpmPackageInstall: vi.fn().mockReturnValue(false),
        };

        delete process.env.FIRESTORE_EMULATOR_HOST;

        // Test with Japanese-style messages (both work because metadata is used)
        const serviceJa = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigCheckerJa as any,
          buildChecker: mockBuildChecker as any,
        });

        const resultJa = await serviceJa.runDiagnostics({ verbose: false });
        expect(resultJa.isOk()).toBe(true);
        expect(mockConfigCheckerJa.validateConfigSyntax).toHaveBeenCalled();
        expect(mockConfigCheckerJa.validateConfigSchema).toHaveBeenCalled();

        // Test with English-style messages (both work because metadata is used)
        const serviceEn = new DoctorService({
          environmentChecker: mockEnvironmentChecker as any,
          firebaseChecker: mockFirebaseChecker as any,
          configChecker: mockConfigCheckerEn as any,
          buildChecker: mockBuildChecker as any,
        });

        const resultEn = await serviceEn.runDiagnostics({ verbose: false });
        expect(resultEn.isOk()).toBe(true);
        expect(mockConfigCheckerEn.validateConfigSyntax).toHaveBeenCalled();
        expect(mockConfigCheckerEn.validateConfigSchema).toHaveBeenCalled();
      });
    });
  });
});
