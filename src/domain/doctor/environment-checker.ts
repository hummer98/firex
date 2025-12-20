/**
 * EnvironmentChecker - Validates Node.js, Firebase CLI, and authentication status
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Result, ok, err } from '../../shared/types';
import type { CheckResult, CheckerError } from './types';
import { createCheckResult } from './types';

const execAsync = promisify(exec);

/**
 * Minimum required Node.js version
 */
const MIN_NODE_VERSION = '18.0.0';

/**
 * Authentication type enumeration
 */
export type AuthType = 'emulator' | 'service-account' | 'adc' | 'none';

/**
 * Authentication information
 */
export interface AuthInfo {
  type: AuthType;
  account?: string;
  filePath?: string;
  projectId?: string;
}

/**
 * Dependencies for testing
 */
export interface EnvironmentCheckerDeps {
  execCommand?: (command: string) => Promise<string>;
  fileExists?: (path: string) => boolean;
  readFile?: (path: string) => string;
  getHomedir?: () => string;
  getEnv?: (name: string) => string | undefined;
}

/**
 * Parse version string into comparable numbers
 */
function parseVersion(version: string): number[] {
  const cleaned = version.replace(/^v/, '');
  return cleaned.split('.').map((n) => parseInt(n, 10) || 0);
}

/**
 * Compare two version arrays
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const aVal = a[i] || 0;
    const bVal = b[i] || 0;
    if (aVal !== bVal) {
      return aVal - bVal;
    }
  }
  return 0;
}

/**
 * Environment checker for Node.js, Firebase CLI, and authentication
 */
export class EnvironmentChecker {
  private execCommand: (command: string) => Promise<string>;
  private fileExists: (path: string) => boolean;
  private readFile: (path: string) => string;
  private getHomedir: () => string;
  private getEnv: (name: string) => string | undefined;

  constructor(deps: EnvironmentCheckerDeps = {}) {
    this.execCommand = deps.execCommand || this.defaultExecCommand.bind(this);
    this.fileExists = deps.fileExists || ((p) => fs.existsSync(p));
    this.readFile = deps.readFile || ((p) => fs.readFileSync(p, 'utf-8'));
    this.getHomedir = deps.getHomedir || (() => os.homedir());
    this.getEnv = deps.getEnv || ((name) => process.env[name]);
  }

  /**
   * Default command execution using child_process
   */
  private async defaultExecCommand(command: string): Promise<string> {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  }

  /**
   * Check Node.js version meets minimum requirement
   */
  checkNodeVersion(): Result<CheckResult, CheckerError> {
    try {
      const currentVersion = process.version;
      const current = parseVersion(currentVersion);
      const minimum = parseVersion(MIN_NODE_VERSION);

      if (compareVersions(current, minimum) >= 0) {
        return ok(
          createCheckResult(
            'success',
            'node-version',
            `Node.js ${currentVersion} がインストールされています`,
            `最小要件: v${MIN_NODE_VERSION}`
          )
        );
      } else {
        return ok(
          createCheckResult(
            'error',
            'node-version',
            `Node.js ${currentVersion} は最小要件を満たしていません`,
            `現在のバージョン: ${currentVersion}, 最小要件: v${MIN_NODE_VERSION}`,
            `Node.js v${MIN_NODE_VERSION} 以上にアップグレードしてください。\nhttps://nodejs.org/ からダウンロードできます。`
          )
        );
      }
    } catch (error) {
      return err({
        type: 'EXECUTION_ERROR',
        command: 'process.version',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check Firebase CLI installation status
   */
  async checkFirebaseCLI(): Promise<Result<CheckResult, CheckerError>> {
    try {
      const version = await this.execCommand('firebase --version');
      return ok(
        createCheckResult(
          'success',
          'firebase-cli',
          `Firebase CLI v${version} がインストールされています`
        )
      );
    } catch (error) {
      return ok(
        createCheckResult(
          'warning',
          'firebase-cli',
          'Firebase CLI がインストールされていません',
          error instanceof Error ? error.message : String(error),
          'Firebase CLI をインストールしてください:\n  npm install -g firebase-tools\n\nまたは:\n  npx firebase-tools'
        )
      );
    }
  }

  /**
   * Detect authentication type and extract information
   */
  detectAuthInfo(): AuthInfo {
    // Check if running in emulator mode
    const emulatorHost = this.getEnv('FIRESTORE_EMULATOR_HOST');
    if (emulatorHost) {
      return { type: 'emulator' };
    }

    // Check for service account key file
    const credentialPath = this.getEnv('GOOGLE_APPLICATION_CREDENTIALS');
    if (credentialPath && this.fileExists(credentialPath)) {
      try {
        const content = this.readFile(credentialPath);
        const parsed = JSON.parse(content) as Record<string, unknown>;
        return {
          type: 'service-account',
          filePath: credentialPath,
          account: typeof parsed.client_email === 'string' ? parsed.client_email : undefined,
          projectId: typeof parsed.project_id === 'string' ? parsed.project_id : undefined,
        };
      } catch {
        return {
          type: 'service-account',
          filePath: credentialPath,
        };
      }
    }

    // Check for Application Default Credentials (ADC)
    const homedir = this.getHomedir();
    const adcPath = path.join(homedir, '.config', 'gcloud', 'application_default_credentials.json');

    if (this.fileExists(adcPath)) {
      try {
        const content = this.readFile(adcPath);
        const parsed = JSON.parse(content) as Record<string, unknown>;
        // ADC may have quota_project_id or client_email depending on auth type
        const account = typeof parsed.client_email === 'string' ? parsed.client_email : undefined;
        const projectId = typeof parsed.quota_project_id === 'string' ? parsed.quota_project_id : undefined;
        return {
          type: 'adc',
          filePath: adcPath,
          account,
          projectId,
        };
      } catch {
        return {
          type: 'adc',
          filePath: adcPath,
        };
      }
    }

    return { type: 'none' };
  }

  /**
   * Get gcloud account asynchronously
   */
  async getGcloudAccount(): Promise<string | undefined> {
    try {
      const account = await this.execCommand('gcloud config get-value account 2>/dev/null');
      return account && account !== '(unset)' ? account : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check Firebase authentication status with detailed information
   */
  async checkAuthStatus(): Promise<Result<CheckResult, CheckerError>> {
    try {
      const authInfo = this.detectAuthInfo();

      switch (authInfo.type) {
        case 'emulator': {
          const emulatorHost = this.getEnv('FIRESTORE_EMULATOR_HOST');
          return ok(
            createCheckResult(
              'success',
              'auth-status',
              '認証情報',
              `Type: Emulator Mode\nHost: ${emulatorHost}`
            )
          );
        }

        case 'service-account': {
          const details = [
            'Type: Service Account',
            `File: ${authInfo.filePath}`,
          ];
          if (authInfo.account) {
            details.push(`Email: ${authInfo.account}`);
          }
          if (authInfo.projectId) {
            details.push(`Project: ${authInfo.projectId}`);
          }
          return ok(
            createCheckResult(
              'success',
              'auth-status',
              '認証情報',
              details.join('\n')
            )
          );
        }

        case 'adc': {
          // Try to get gcloud account
          const gcloudAccount = await this.getGcloudAccount();
          const details = ['Type: Application Default Credentials (ADC)'];
          if (gcloudAccount) {
            details.push(`Account: ${gcloudAccount}`);
          } else if (authInfo.account) {
            details.push(`Account: ${authInfo.account}`);
          }
          if (authInfo.projectId) {
            details.push(`Quota Project: ${authInfo.projectId}`);
          }
          return ok(
            createCheckResult(
              'success',
              'auth-status',
              '認証情報',
              details.join('\n')
            )
          );
        }

        case 'none': {
          // Check if GOOGLE_APPLICATION_CREDENTIALS is set but file doesn't exist
          const credentialPath = this.getEnv('GOOGLE_APPLICATION_CREDENTIALS');
          if (credentialPath) {
            return ok(
              createCheckResult(
                'error',
                'auth-status',
                '認証情報',
                `Type: Service Account (ファイルが見つかりません)\nFile: ${credentialPath}`,
                'GOOGLE_APPLICATION_CREDENTIALS に正しいパスを設定するか、\n有効なサービスアカウントキーファイルを作成してください。'
              )
            );
          }

          return ok(
            createCheckResult(
              'error',
              'auth-status',
              '認証情報が見つかりません',
              'サービスアカウントキーまたは ADC が設定されていません',
              '以下のいずれかの方法で認証を設定してください:\n\n' +
                '1. gcloud ADC を使用:\n   gcloud auth application-default login\n\n' +
                '2. サービスアカウントキーを使用:\n   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n\n' +
                '3. エミュレータを使用:\n   export FIRESTORE_EMULATOR_HOST=localhost:8080'
            )
          );
        }
      }
    } catch (error) {
      return err({
        type: 'EXECUTION_ERROR',
        command: 'auth check',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
