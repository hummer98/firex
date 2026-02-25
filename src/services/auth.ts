/**
 * Authentication service for Firebase Admin SDK initialization
 */

import { initializeApp, deleteApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Result, ok, err } from '../shared/types';
import type { Config } from './config';

/**
 * Authentication error types
 */
export type AuthError =
  | { type: 'INVALID_CREDENTIALS'; message: string; originalError: Error }
  | { type: 'CONNECTION_TIMEOUT'; message: string; retryable: boolean }
  | { type: 'PROJECT_NOT_FOUND'; projectId: string }
  | { type: 'PERMISSION_DENIED'; message: string }
  | { type: 'UNINITIALIZED'; message: string };

/**
 * Service for Firebase authentication and Firestore connection
 */
export class AuthService {
  private app: App | null = null;
  private firestore: Firestore | null = null;

  /**
   * Initialize Firebase Admin SDK and return Firestore instance
   * @param config - Firebase configuration
   * @param appName - Optional unique app name (required when managing multiple apps)
   */
  async initialize(config: Config, appName?: string): Promise<Result<Firestore, AuthError>> {
    try {
      // If already initialized, return existing instance
      if (this.firestore) {
        return ok(this.firestore);
      }

      // Determine credential source
      let credential;

      if (config.credentialPath) {
        // Use service account key file
        try {
          const serviceAccount = require(config.credentialPath);
          credential = cert(serviceAccount);
        } catch (error) {
          return err({
            type: 'INVALID_CREDENTIALS',
            message: `サービスアカウントキーファイルの読み込みに失敗しました: ${config.credentialPath}`,
            originalError: error instanceof Error ? error : new Error(String(error)),
          });
        }
      } else {
        // Use Application Default Credentials (ADC)
        credential = applicationDefault();
      }

      // Clean up previous app if it exists (e.g., from a failed initialization)
      if (this.app) {
        await deleteApp(this.app);
        this.app = null;
      }

      // Initialize app with optional unique name
      this.app = initializeApp(
        {
          credential,
          projectId: config.projectId,
          databaseURL: config.databaseURL,
        },
        appName
      );

      // Get Firestore instance
      this.firestore = getFirestore(this.app);

      // If emulator host is set, connect to emulator
      if (config.emulatorHost) {
        const parts = config.emulatorHost.split(':');
        const portStr = parts[1];
        const port = parseInt(portStr, 10);

        if (isNaN(port)) {
          await this.cleanup();
          return err({
            type: 'INVALID_CREDENTIALS',
            message: `Emulatorホストの形式が不正です: ${config.emulatorHost}`,
            originalError: new Error('Invalid emulator host format'),
          });
        }

        // Note: Firestore emulator connection is set via environment variable
        // FIRESTORE_EMULATOR_HOST, which should already be set
        // The SDK automatically detects it
      }

      // Verify connection with a simple operation
      try {
        // Try to access Firestore settings to verify connection
        await this.firestore.listCollections();
      } catch (error) {
        await this.cleanup();

        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            return err({
              type: 'PERMISSION_DENIED',
              message: `Firestoreへのアクセス権限がありません: ${error.message}`,
            });
          }

          if (error.message.includes('not found') || error.message.includes('project')) {
            return err({
              type: 'PROJECT_NOT_FOUND',
              projectId: config.projectId || 'unknown',
            });
          }

          if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            return err({
              type: 'CONNECTION_TIMEOUT',
              message: 'Firestoreへの接続がタイムアウトしました',
              retryable: true,
            });
          }
        }

        return err({
          type: 'INVALID_CREDENTIALS',
          message: `Firestore接続の検証に失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
          originalError: error instanceof Error ? error : new Error(String(error)),
        });
      }

      return ok(this.firestore);
    } catch (error) {
      return err({
        type: 'INVALID_CREDENTIALS',
        message: `Firebase初期化に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Get initialized Firestore instance
   */
  getFirestore(): Result<Firestore, AuthError> {
    if (!this.firestore) {
      return err({
        type: 'UNINITIALIZED',
        message: 'AuthServiceが初期化されていません。initialize()を先に呼び出してください',
      });
    }

    return ok(this.firestore);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.firestore !== null;
  }

  /**
   * Clean up Firebase app and reset state
   */
  private async cleanup(): Promise<void> {
    if (this.app) {
      try {
        await deleteApp(this.app);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.app = null;
    this.firestore = null;
  }
}
