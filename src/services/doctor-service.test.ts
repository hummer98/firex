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
              message: '設定ファイルが見つかりました: .firex.yaml',
              details: 'ファイルパス: /path/to/.firex.yaml',
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
              message: '設定ファイルが見つかりました: .firex.yaml',
              details: 'ファイルパス: /path/to/.firex.yaml',
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
              message: 'YAML 構文エラー',
              details: '位置: 行 2, 列 3\nInvalid indentation',
              guidance: 'YAML の構文を確認してください。',
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
          expect(syntaxCheck?.details).toContain('行');
          expect(syntaxCheck?.details).toContain('列');
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
              message: '設定ファイルが見つかりません - デフォルト設定で動作します',
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
              message: '設定ファイルが見つかりました: .firex.yaml',
              details: 'ファイルパス: /path/to/.firex.yaml',
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
            value: { status: 'success', category: 'config-schema', message: '設定スキーマは有効です' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'パスは有効です' },
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
              message: '設定ファイルが見つかりました: .firex.yaml',
              details: 'ファイルパス: /path/to/.firex.yaml',
            },
          }),
          readFile: vi.fn().mockResolvedValue({
            isOk: () => true,
            value: 'projectId: 123',
          }),
          validateConfigSyntax: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'config-syntax', message: 'YAML 構文は有効です' },
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
              message: '設定スキーマの検証に失敗しました',
              details: '  - projectId: Expected string, received number',
              guidance: '設定ファイルのフィールドと値の型を確認してください。',
            },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: { status: 'success', category: 'collection-paths', message: 'パスは有効です' },
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
              message: '設定ファイルが見つかりました: .firex.yaml',
              details: 'ファイルパス: /path/to/.firex.yaml',
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
            value: { status: 'success', category: 'config-schema', message: '設定スキーマは有効です' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: {
              status: 'success',
              category: 'collection-paths',
              message: 'すべてのコレクションパスが有効です (2 件)',
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
              message: '設定ファイルが見つかりました: .firex.yaml',
              details: 'ファイルパス: /path/to/.firex.yaml',
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
            value: { status: 'success', category: 'config-schema', message: '設定スキーマは有効です' },
          }),
          validateCollectionPaths: vi.fn().mockReturnValue({
            isOk: () => true,
            value: {
              status: 'error',
              category: 'collection-paths',
              message: 'コレクションパスの形式が不正です',
              details: '無効なパス:\n  users/user1',
              guidance: 'コレクションパスは奇数のセグメント数である必要があります。',
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
          expect(pathsCheck?.guidance).toContain('奇数');
        }
      });
    });
  });
});
