/**
 * Firestore Manager for MCP Server
 *
 * Manages Firestore connections with lazy initialization and caching.
 * Supports multiple projects with automatic re-authentication when project changes.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { AuthService } from '../services/auth.js';
import { ConfigService, Config } from '../services/config.js';
import { Result, ok, err } from '../shared/types.js';

/**
 * Error types for FirestoreManager
 */
export type FirestoreManagerError =
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'CONFIG_ERROR'; message: string };

/**
 * Options for getting Firestore instance
 */
export interface GetFirestoreOptions {
  projectId?: string;
  credentialPath?: string;
}

/**
 * Manages Firestore connections with caching
 */
export class FirestoreManager {
  private currentProjectId: string | null = null;
  private currentCredentialPath: string | null = null;
  private firestore: Firestore | null = null;
  private authService: AuthService | null = null;
  private baseConfig: Config | null = null;

  /**
   * Initialize with base configuration from CLI flags
   */
  async initialize(cliOptions: GetFirestoreOptions = {}): Promise<void> {
    const configService = new ConfigService();
    const configResult = await configService.loadConfig({
      cliFlags: {
        projectId: cliOptions.projectId,
        credentialPath: cliOptions.credentialPath,
      },
    });

    if (configResult.isOk()) {
      this.baseConfig = configResult.value;
    }
  }

  /**
   * Get Firestore instance, initializing if necessary
   * Re-authenticates if projectId or credentialPath changes
   */
  async getFirestore(
    options: GetFirestoreOptions = {}
  ): Promise<Result<Firestore, FirestoreManagerError>> {
    const projectId = options.projectId || this.baseConfig?.projectId;
    const credentialPath = options.credentialPath || this.baseConfig?.credentialPath;

    // Check if we need to re-authenticate
    const needsReauth =
      !this.firestore ||
      (projectId && projectId !== this.currentProjectId) ||
      (credentialPath && credentialPath !== this.currentCredentialPath);

    if (!needsReauth && this.firestore) {
      return ok(this.firestore);
    }

    // Create new AuthService for each authentication to avoid Firebase app name conflicts
    this.authService = new AuthService();

    const config: Config = {
      ...this.baseConfig,
      projectId: projectId,
      credentialPath: credentialPath,
      defaultListLimit: this.baseConfig?.defaultListLimit ?? 100,
      watchShowInitial: this.baseConfig?.watchShowInitial ?? false,
    };

    const authResult = await this.authService.initialize(config);

    if (authResult.isErr()) {
      const error = authResult.error;
      let message: string;

      switch (error.type) {
        case 'INVALID_CREDENTIALS':
          message = this.formatAuthError(error.message, projectId);
          break;
        case 'CONNECTION_TIMEOUT':
          message = `Firestoreへの接続がタイムアウトしました。ネットワーク接続を確認してください。`;
          break;
        case 'PROJECT_NOT_FOUND':
          message = `プロジェクト "${error.projectId}" が見つかりません。プロジェクトIDが正しいか確認してください。`;
          break;
        case 'PERMISSION_DENIED':
          message = `Firestoreへのアクセス権限がありません: ${error.message}`;
          break;
        default:
          message = `認証エラー: ${(error as { message?: string }).message || 'Unknown error'}`;
      }

      return err({ type: 'AUTH_ERROR', message });
    }

    this.firestore = authResult.value;
    this.currentProjectId = projectId || null;
    this.currentCredentialPath = credentialPath || null;

    return ok(this.firestore);
  }

  /**
   * Format authentication error with helpful hints
   */
  private formatAuthError(message: string, _projectId?: string): string {
    if (message.includes('Unable to detect a Project Id')) {
      return `プロジェクトIDが検出できませんでした。ツールパラメータでprojectIdを指定してください。

例: { "projectId": "your-project-id", "path": "users" }

または、MCPサーバー設定で指定:
  "args": ["mcp", "--project-id", "your-project-id"]`;
    }

    if (message.includes('サービスアカウントキーファイル')) {
      return `サービスアカウントキーファイルの読み込みに失敗しました。パスを確認してください。`;
    }

    return `認証に失敗しました: ${message}`;
  }

  /**
   * Get current project ID
   */
  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.firestore !== null;
  }
}
