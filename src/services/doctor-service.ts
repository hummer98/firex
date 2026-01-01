/**
 * DoctorService - Orchestrates diagnostic checks
 */

import { Result, ok, err } from '../shared/types';
import type {
  CheckResult,
  DiagnosticReport,
  DoctorServiceOptions,
  DoctorError,
} from '../domain/doctor/types';
import { createDiagnosticSummary, createCheckResult } from '../domain/doctor/types';
import { EnvironmentChecker } from '../domain/doctor/environment-checker';
import { FirebaseChecker } from '../domain/doctor/firebase-checker';
import { ConfigChecker } from '../domain/doctor/config-checker';
import { BuildChecker } from '../domain/doctor/build-checker';
import type { Firestore } from 'firebase-admin/firestore';
import type { Config } from './config';
import { t } from '../shared/i18n';

/**
 * Dependencies for testing
 */
export interface DoctorServiceDeps {
  environmentChecker?: EnvironmentChecker;
  firebaseChecker?: FirebaseChecker;
  configChecker?: ConfigChecker;
  buildChecker?: BuildChecker;
  getFirestore?: () => Firestore | null;
  getConfig?: () => Config | null;
}

/**
 * Doctor service for running all diagnostic checks
 */
export class DoctorService {
  private environmentChecker: EnvironmentChecker;
  private firebaseChecker: FirebaseChecker;
  private configChecker: ConfigChecker;
  private buildChecker: BuildChecker;
  private getFirestore: () => Firestore | null;
  private getConfig: () => Config | null;

  constructor(deps: DoctorServiceDeps = {}) {
    this.getFirestore = deps.getFirestore || (() => null);
    this.getConfig = deps.getConfig || (() => null);
    this.environmentChecker = deps.environmentChecker || new EnvironmentChecker();
    this.firebaseChecker = deps.firebaseChecker || new FirebaseChecker({
      getFirestore: this.getFirestore,
    });
    this.configChecker = deps.configChecker || new ConfigChecker();
    this.buildChecker = deps.buildChecker || new BuildChecker();
  }

  /**
   * Detect if running in emulator mode
   */
  detectEmulatorMode(): boolean {
    return !!process.env.FIRESTORE_EMULATOR_HOST;
  }

  /**
   * Run all diagnostic checks
   */
  async runDiagnostics(
    options: DoctorServiceOptions
  ): Promise<Result<DiagnosticReport, DoctorError>> {
    try {
      const checks: CheckResult[] = [];
      const emulatorMode = this.detectEmulatorMode();
      const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

      if (options.verbose) {
        console.log(t('doctor.progress.starting'));
        console.log(`${t('doctor.progress.emulatorMode')}: ${emulatorMode}`);
      }

      // 1. Environment checks
      if (options.verbose) console.log(t('doctor.progress.checkingNode'));
      const nodeResult = this.environmentChecker.checkNodeVersion();
      if (nodeResult.isOk()) {
        checks.push(nodeResult.value);
      } else {
        checks.push(this.createErrorResult('node-version', nodeResult.error.message));
      }

      if (options.verbose) console.log(t('doctor.progress.checkingFirebaseCli'));
      const cliResult = await this.environmentChecker.checkFirebaseCLI();
      if (cliResult.isOk()) {
        checks.push(cliResult.value);
      } else {
        checks.push(this.createErrorResult('firebase-cli', cliResult.error.message));
      }

      if (options.verbose) console.log(t('doctor.progress.checkingAuth'));
      const authResult = await this.environmentChecker.checkAuthStatus();
      if (authResult.isOk()) {
        checks.push(authResult.value);
      } else {
        checks.push(this.createErrorResult('auth-status', authResult.error.message));
      }

      // 2. Project ID resolution (always show)
      if (options.verbose) console.log(t('doctor.progress.resolvingProjectId'));
      const projectIdResult = this.firebaseChecker.checkProjectId();
      let projectId: string | undefined;

      if (projectIdResult.isOk()) {
        checks.push(projectIdResult.value);
        // Extract project ID from resolved info
        const projectInfo = this.firebaseChecker.resolveProjectId();
        projectId = projectInfo.projectId;
      } else {
        checks.push(this.createErrorResult('project-id', projectIdResult.error.message));
      }

      // 3. Emulator or production Firestore checks
      if (emulatorMode && emulatorHost) {
        if (options.verbose) console.log(t('doctor.progress.checkingEmulator'));
        const emulatorResult = await this.firebaseChecker.checkEmulatorConnection(emulatorHost);
        if (emulatorResult.isOk()) {
          checks.push(emulatorResult.value);
        } else {
          checks.push(this.createErrorResult('emulator-connection', emulatorResult.error.message));
        }
      } else {
        // Production mode - check Firestore API and access
        if (projectId) {
          if (options.verbose) console.log(t('doctor.progress.checkingFirestoreApi'));
          const apiResult = await this.firebaseChecker.checkFirestoreAPI(projectId);
          if (apiResult.isOk()) {
            checks.push(apiResult.value);
          } else {
            checks.push(this.createErrorResult('firestore-api', apiResult.error.message));
          }

          const config = this.getConfig();
          if (config) {
            if (options.verbose) console.log(t('doctor.progress.checkingFirestoreAccess'));
            const accessResult = await this.firebaseChecker.checkFirestoreAccess(config);
            if (accessResult.isOk()) {
              checks.push(accessResult.value);
            } else {
              checks.push(this.createErrorResult('firestore-access', accessResult.error.message));
            }
          }
        }
      }

      // 4. Config file checks
      if (options.verbose) console.log(t('doctor.progress.checkingConfig'));
      const configResult = await this.configChecker.checkConfigFile();
      let configFilePath: string | undefined;
      let configContent: string | undefined;
      let parsedConfig: unknown | undefined;

      if (configResult.isOk()) {
        checks.push(configResult.value);

        // Extract file path from metadata if config file was found (locale-independent)
        if (configResult.value.metadata?.found && configResult.value.metadata?.filePath) {
          configFilePath = configResult.value.metadata.filePath as string;
        }
      } else {
        checks.push(this.createErrorResult('config-file', configResult.error.message));
      }

      // 4.1 Syntax validation (only if config file was found)
      if (configFilePath) {
        if (options.verbose) console.log(t('doctor.progress.validatingSyntax'));
        const readResult = await this.configChecker.readFile(configFilePath);

        if (readResult.isOk()) {
          configContent = readResult.value;
          const syntaxResult = this.configChecker.validateConfigSyntax(configFilePath, configContent);

          if (syntaxResult.isOk()) {
            checks.push(syntaxResult.value);

            // 4.2 Schema validation (only if syntax is valid)
            if (syntaxResult.value.status === 'success') {
              if (options.verbose) console.log(t('doctor.progress.validatingSchema'));
              const parseResult = this.configChecker.parseConfig(configFilePath, configContent);

              if (parseResult.isOk()) {
                parsedConfig = parseResult.value;
                const schemaResult = this.configChecker.validateConfigSchema(parsedConfig);

                if (schemaResult.isOk()) {
                  checks.push(schemaResult.value);
                } else {
                  checks.push(this.createErrorResult('config-schema', schemaResult.error.message));
                }
              }
            }
          } else {
            checks.push(this.createErrorResult('config-syntax', syntaxResult.error.message));
          }
        } else {
          checks.push(this.createErrorResult('config-syntax', readResult.error.message));
        }

        // 4.3 Collection paths validation (always run if we have parsed config)
        if (parsedConfig && typeof parsedConfig === 'object' && parsedConfig !== null) {
          if (options.verbose) console.log(t('doctor.progress.validatingPaths'));
          // Extract collection paths from config if they exist
          // Note: Currently the config schema doesn't define collection paths,
          // so we'll pass an empty array unless the config contains them
          const configObj = parsedConfig as Record<string, unknown>;
          const collectionPaths: string[] = [];

          // Check for common collection path fields
          if (Array.isArray(configObj.collections)) {
            collectionPaths.push(...(configObj.collections as string[]));
          }
          if (Array.isArray(configObj.collectionPaths)) {
            collectionPaths.push(...(configObj.collectionPaths as string[]));
          }

          const pathsResult = this.configChecker.validateCollectionPaths(collectionPaths);
          if (pathsResult.isOk()) {
            checks.push(pathsResult.value);
          } else {
            checks.push(this.createErrorResult('collection-paths', pathsResult.error.message));
          }
        }
      }

      // 5. Build status check (only in verbose mode - low value for users)
      if (options.verbose && !options.skipBuildCheck) {
        console.log(t('doctor.progress.checkingBuild'));
        const buildResult = await this.buildChecker.checkBuildStatus();
        if (buildResult.isOk()) {
          checks.push(buildResult.value);
        } else {
          checks.push(this.createErrorResult('build-status', buildResult.error.message));
        }
      }

      // Create summary
      const summary = createDiagnosticSummary(checks);

      const report: DiagnosticReport = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          emulatorMode,
        },
        checks,
        summary,
      };

      if (options.verbose) {
        console.log(t('doctor.progress.complete'));
      }

      return ok(report);
    } catch (error) {
      return err({
        type: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create an error check result from a checker error
   */
  private createErrorResult(
    category: CheckResult['category'],
    message: string
  ): CheckResult {
    return createCheckResult('error', category, `${t('doctor.error.checkFailed')}: ${message}`);
  }
}
