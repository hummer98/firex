/**
 * FirebaseChecker - Validates Firebase project configuration and Firestore access
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { Result, ok, err } from '../../shared/types';
import type { CheckResult, CheckerError } from './types';
import { createCheckResult } from './types';
import type { Config } from '../../services/config';
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Project ID source
 */
export type ProjectIdSource =
  | 'env-gcloud-project'
  | 'env-google-cloud-project'
  | 'env-firebase-project'
  | 'firebaserc'
  | 'service-account'
  | 'none';

/**
 * Project ID resolution result
 */
export interface ProjectIdInfo {
  projectId?: string;
  source: ProjectIdSource;
  filePath?: string;
}

/**
 * Dependencies for testing
 */
export interface FirebaseCheckerDeps {
  readFile?: (path: string) => Promise<string>;
  readFileSync?: (path: string) => string;
  fileExists?: (path: string) => boolean;
  getFirestore?: () => Firestore | null;
  httpGet?: (url: string) => Promise<{ status: number }>;
  getEnv?: (name: string) => string | undefined;
}

/**
 * Firebase project and Firestore checker
 */
export class FirebaseChecker {
  private readFile: (filePath: string) => Promise<string>;
  private readFileSync: (filePath: string) => string;
  private fileExists: (filePath: string) => boolean;
  private getFirestore: () => Firestore | null;
  private httpGet: (url: string) => Promise<{ status: number }>;
  private getEnv: (name: string) => string | undefined;

  constructor(deps: FirebaseCheckerDeps = {}) {
    this.readFile = deps.readFile || ((p) => fs.promises.readFile(p, 'utf-8'));
    this.readFileSync = deps.readFileSync || ((p) => fs.readFileSync(p, 'utf-8'));
    this.fileExists = deps.fileExists || ((p) => fs.existsSync(p));
    this.getFirestore = deps.getFirestore || (() => null);
    this.httpGet = deps.httpGet || this.defaultHttpGet.bind(this);
    this.getEnv = deps.getEnv || ((name) => process.env[name]);
  }

  /**
   * Default HTTP GET implementation
   */
  private defaultHttpGet(url: string): Promise<{ status: number }> {
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        resolve({ status: res.statusCode || 0 });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  /**
   * Check for .firebaserc file and extract project ID
   */
  async checkFirebaseRC(searchPath?: string): Promise<Result<CheckResult, CheckerError>> {
    try {
      const startPath = searchPath || process.cwd();
      let currentPath = startPath;

      // Search up the directory tree for .firebaserc
      while (currentPath !== path.dirname(currentPath)) {
        const firebasercPath = path.join(currentPath, '.firebaserc');

        if (this.fileExists(firebasercPath)) {
          try {
            const content = await this.readFile(firebasercPath);
            const config = JSON.parse(content);

            const defaultProject = config?.projects?.default;
            if (defaultProject) {
              return ok(
                createCheckResult(
                  'success',
                  'firebaserc',
                  `.firebaserc が見つかりました - デフォルトプロジェクト: ${defaultProject}`,
                  `ファイルパス: ${firebasercPath}`
                )
              );
            } else {
              return ok(
                createCheckResult(
                  'warning',
                  'firebaserc',
                  '.firebaserc にデフォルトプロジェクトが設定されていません',
                  `ファイルパス: ${firebasercPath}`,
                  'firebase use <project-id> を実行してデフォルトプロジェクトを設定してください'
                )
              );
            }
          } catch (parseError) {
            return ok(
              createCheckResult(
                'error',
                'firebaserc',
                '.firebaserc の解析に失敗しました',
                parseError instanceof Error ? parseError.message : String(parseError),
                '.firebaserc ファイルの JSON 形式を確認してください'
              )
            );
          }
        }

        currentPath = path.dirname(currentPath);
      }

      return ok(
        createCheckResult(
          'warning',
          'firebaserc',
          '.firebaserc ファイルが見つかりません',
          `検索開始パス: ${startPath}`,
          'Firebase プロジェクトを初期化してください:\n  firebase init'
        )
      );
    } catch (error) {
      return err({
        type: 'FILE_READ_ERROR',
        path: searchPath || process.cwd(),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if Firestore API is enabled for the project
   */
  async checkFirestoreAPI(projectId: string): Promise<Result<CheckResult, CheckerError>> {
    try {
      const firestore = this.getFirestore();

      if (!firestore) {
        return ok(
          createCheckResult(
            'warning',
            'firestore-api',
            'Firestore インスタンスが初期化されていません',
            'プロジェクト設定を確認してください',
            '認証設定後に再度診断を実行してください'
          )
        );
      }

      // Try to list collections to verify API access
      await firestore.listCollections();

      return ok(
        createCheckResult(
          'success',
          'firestore-api',
          `Firestore API が有効です (プロジェクト: ${projectId})`
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('has not been used') || message.includes('NOT_FOUND')) {
        return ok(
          createCheckResult(
            'error',
            'firestore-api',
            'Firestore API が有効化されていません',
            message,
            `Firestore API を有効化してください:\n  https://console.cloud.google.com/firestore?project=${projectId}\n\nまたは:\n  gcloud services enable firestore.googleapis.com --project=${projectId}`
          )
        );
      }

      return ok(
        createCheckResult(
          'error',
          'firestore-api',
          'Firestore API の確認に失敗しました',
          message,
          `Google Cloud Console で Firestore の状態を確認してください:\n  https://console.cloud.google.com/firestore?project=${projectId}`
        )
      );
    }
  }

  /**
   * Check Firestore access permissions
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkFirestoreAccess(_config: Config): Promise<Result<CheckResult, CheckerError>> {
    try {
      const firestore = this.getFirestore();

      if (!firestore) {
        return ok(
          createCheckResult(
            'warning',
            'firestore-access',
            'Firestore インスタンスが初期化されていません',
            undefined,
            '認証設定後に再度診断を実行してください'
          )
        );
      }

      const collections = await firestore.listCollections();

      return ok(
        createCheckResult(
          'success',
          'firestore-access',
          'Firestore へのアクセス権限があります',
          `検出されたコレクション数: ${collections.length}`
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('PERMISSION_DENIED') || message.includes('permission')) {
        return ok(
          createCheckResult(
            'error',
            'firestore-access',
            'Firestore へのアクセス権限がありません',
            message,
            '必要な IAM ロールを付与してください:\n' +
              '- Cloud Datastore User (roles/datastore.user)\n' +
              '- または Firebase Admin (roles/firebase.admin)\n\n' +
              'サービスアカウントの場合は、IAM コンソールで権限を確認してください'
          )
        );
      }

      return ok(
        createCheckResult(
          'error',
          'firestore-access',
          'Firestore アクセスの確認に失敗しました',
          message
        )
      );
    }
  }

  /**
   * Check emulator connection
   */
  async checkEmulatorConnection(host: string): Promise<Result<CheckResult, CheckerError>> {
    try {
      // Parse host to get hostname and port
      const [hostname, portStr] = host.split(':');
      const port = parseInt(portStr, 10) || 8080;

      // Try to connect to emulator
      const url = `http://${hostname}:${port}/`;
      const response = await this.httpGet(url);

      if (response.status === 200 || response.status === 400 || response.status === 404) {
        // 400/404 is OK - it means emulator is running but endpoint doesn't exist
        return ok(
          createCheckResult(
            'success',
            'emulator-connection',
            `Firestore エミュレータに接続できました (${host})`,
            `HTTP ステータス: ${response.status}`
          )
        );
      }

      return ok(
        createCheckResult(
          'warning',
          'emulator-connection',
          `エミュレータからの応答が予期しないものでした`,
          `HTTP ステータス: ${response.status}`,
          'エミュレータが正常に動作しているか確認してください'
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      return ok(
        createCheckResult(
          'error',
          'emulator-connection',
          'Firestore エミュレータに接続できません',
          `ホスト: ${host}\nエラー: ${message}`,
          'エミュレータが起動しているか確認してください:\n' +
            '  firebase emulators:start --only firestore\n\n' +
            '環境変数が正しいか確認してください:\n' +
            `  FIRESTORE_EMULATOR_HOST=${host}`
        )
      );
    }
  }

  /**
   * Resolve project ID from various sources
   * Priority: Environment variables > .firebaserc > Service Account
   */
  resolveProjectId(searchPath?: string): ProjectIdInfo {
    // 1. Check environment variables (highest priority)
    const gcloudProject = this.getEnv('GCLOUD_PROJECT');
    if (gcloudProject) {
      return { projectId: gcloudProject, source: 'env-gcloud-project' };
    }

    const googleCloudProject = this.getEnv('GOOGLE_CLOUD_PROJECT');
    if (googleCloudProject) {
      return { projectId: googleCloudProject, source: 'env-google-cloud-project' };
    }

    const firebaseProject = this.getEnv('FIREBASE_PROJECT');
    if (firebaseProject) {
      return { projectId: firebaseProject, source: 'env-firebase-project' };
    }

    // 2. Check .firebaserc
    const startPath = searchPath || process.cwd();
    let currentPath = startPath;

    while (currentPath !== path.dirname(currentPath)) {
      const firebasercPath = path.join(currentPath, '.firebaserc');

      if (this.fileExists(firebasercPath)) {
        try {
          const content = this.readFileSync(firebasercPath);
          const config = JSON.parse(content) as Record<string, unknown>;
          const projects = config.projects as Record<string, string> | undefined;
          const defaultProject = projects?.default;

          if (defaultProject) {
            return {
              projectId: defaultProject,
              source: 'firebaserc',
              filePath: firebasercPath,
            };
          }
        } catch {
          // Continue to next source
        }
      }

      currentPath = path.dirname(currentPath);
    }

    // 3. Check service account file
    const credentialPath = this.getEnv('GOOGLE_APPLICATION_CREDENTIALS');
    if (credentialPath && this.fileExists(credentialPath)) {
      try {
        const content = this.readFileSync(credentialPath);
        const parsed = JSON.parse(content) as Record<string, unknown>;
        const projectId = parsed.project_id;

        if (typeof projectId === 'string') {
          return {
            projectId,
            source: 'service-account',
            filePath: credentialPath,
          };
        }
      } catch {
        // Continue to none
      }
    }

    return { source: 'none' };
  }

  /**
   * Check and display project ID resolution
   */
  checkProjectId(searchPath?: string): Result<CheckResult, CheckerError> {
    const info = this.resolveProjectId(searchPath);

    if (!info.projectId) {
      return ok(
        createCheckResult(
          'warning',
          'project-id',
          'プロジェクト ID を特定できません',
          undefined,
          '以下のいずれかの方法でプロジェクト ID を設定してください:\n\n' +
            '1. 環境変数を設定:\n   export GCLOUD_PROJECT=your-project-id\n\n' +
            '2. Firebase プロジェクトを初期化:\n   firebase init\n\n' +
            '3. サービスアカウントキーを使用'
        )
      );
    }

    const sourceLabels: Record<ProjectIdSource, string> = {
      'env-gcloud-project': 'GCLOUD_PROJECT 環境変数',
      'env-google-cloud-project': 'GOOGLE_CLOUD_PROJECT 環境変数',
      'env-firebase-project': 'FIREBASE_PROJECT 環境変数',
      'firebaserc': '.firebaserc (default alias)',
      'service-account': 'Service Account ファイル',
      'none': '不明',
    };

    const details = [
      `Project ID: ${info.projectId}`,
      `Source: ${sourceLabels[info.source]}`,
    ];

    if (info.filePath) {
      details.push(`File: ${info.filePath}`);
    }

    return ok(
      createCheckResult(
        'success',
        'project-id',
        'プロジェクト',
        details.join('\n')
      )
    );
  }
}
