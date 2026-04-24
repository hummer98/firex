/**
 * Firestore Manager for MCP Server
 *
 * Manages Firestore connections with lazy initialization and per-project pooling.
 * Caches Firestore instances per project/credential combination to avoid
 * re-initialization overhead when switching between projects.
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
  databaseId?: string;
  credentialPath?: string;
}

/**
 * Cached Firestore connection entry
 */
interface CachedEntry {
  firestore: Firestore;
  authService: AuthService;
}

/**
 * Manages Firestore connections with per-project pooling
 */
export class FirestoreManager {
  private cache: Map<string, CachedEntry> = new Map();
  private baseConfig: Config | null = null;

  /**
   * Initialize with base configuration from CLI flags
   */
  async initialize(cliOptions: GetFirestoreOptions = {}): Promise<void> {
    const configService = new ConfigService();
    const configResult = await configService.loadConfig({
      cliFlags: {
        projectId: cliOptions.projectId,
        databaseId: cliOptions.databaseId,
        credentialPath: cliOptions.credentialPath,
      },
    });

    if (configResult.isOk()) {
      this.baseConfig = configResult.value;
    }
  }

  /**
   * Build cache key from resolved projectId, databaseId, and credentialPath
   */
  private getCacheKey(
    projectId?: string,
    databaseId?: string,
    credentialPath?: string
  ): string {
    return `${projectId || ''}::${databaseId || ''}::${credentialPath || ''}`;
  }

  /**
   * Get Firestore instance, initializing if necessary.
   * Returns cached instance if the same project/database/credential combination was previously initialized.
   */
  async getFirestore(
    options: GetFirestoreOptions = {}
  ): Promise<Result<Firestore, FirestoreManagerError>> {
    const projectId = options.projectId || this.baseConfig?.projectId;
    const databaseId = options.databaseId || this.baseConfig?.databaseId;
    const credentialPath = options.credentialPath || this.baseConfig?.credentialPath;
    const cacheKey = this.getCacheKey(projectId, databaseId, credentialPath);

    // Return cached instance if available
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return ok(cached.firestore);
    }

    // Create new AuthService with unique app name for this project
    const authService = new AuthService();
    const appName = `firex-${cacheKey}`;

    const config: Config = {
      ...this.baseConfig,
      projectId: projectId,
      databaseId: databaseId,
      credentialPath: credentialPath,
      defaultListLimit: this.baseConfig?.defaultListLimit ?? 100,
      watchShowInitial: this.baseConfig?.watchShowInitial ?? false,
    };

    const authResult = await authService.initialize(config, appName);

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

    // Cache the new instance
    this.cache.set(cacheKey, { firestore: authResult.value, authService });

    return ok(authResult.value);
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
   * Get cached project IDs (deduplicated; a single projectId may have multiple
   * cached entries for different databaseId / credentialPath combinations)
   */
  getCachedProjectIds(): string[] {
    const projectIds = Array.from(this.cache.keys())
      .map((key) => key.split('::')[0])
      .filter(Boolean);
    return Array.from(new Set(projectIds));
  }

  /**
   * Check if connected to any project
   */
  isConnected(): boolean {
    return this.cache.size > 0;
  }
}
