/**
 * BaseCommand - Base class for all firex CLI commands
 * Provides common flags, services, and initialization logic
 */

import { Command, Flags } from '@oclif/core';
import { ConfigService, Config } from '../services/config';
import { AuthService } from '../services/auth';
import { ErrorHandler } from '../services/error-handler';
import { LoggingService } from '../services/logging';
import { Result, ok, err } from '../shared/types';
import { t } from '../shared/i18n';
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Initialization error type
 */
export type InitError =
  | { type: 'CONFIG_ERROR'; message: string }
  | { type: 'AUTH_ERROR'; message: string };

/**
 * Base command class with shared functionality for all firex commands
 */
export abstract class BaseCommand extends Command {
  // Hide from command list (abstract class, not a real command)
  static hidden = true;
  /**
   * Common flags shared by all commands
   */
  static baseFlags = {
    verbose: Flags.boolean({
      char: 'v',
      description: t('flag.verbose'),
      default: false,
    }),
    'project-id': Flags.string({
      description: t('flag.projectId'),
      env: 'FIRESTORE_PROJECT_ID',
    }),
    'credential-path': Flags.string({
      description: t('flag.credentialPath'),
      env: 'GOOGLE_APPLICATION_CREDENTIALS',
    }),
    format: Flags.string({
      char: 'f',
      description: t('flag.format'),
      options: ['json', 'yaml', 'table'],
      default: 'json',
    }),
    profile: Flags.string({
      char: 'p',
      description: t('flag.profile'),
    }),
  };

  // Service instances
  protected configService: ConfigService;
  protected authService: AuthService;
  protected errorHandler: ErrorHandler;
  protected loggingService: LoggingService;

  // Loaded state
  protected loadedConfig: Config | null = null;
  protected firestore: Firestore | null = null;

  constructor(argv: string[], config: any) {
    super(argv, config);
    this.loggingService = new LoggingService();
    this.errorHandler = new ErrorHandler(this.loggingService, false);
    this.configService = new ConfigService();
    this.authService = new AuthService();
  }

  /**
   * Initialize command with config and authentication
   * Should be called at the beginning of run()
   */
  protected async initialize(): Promise<Result<void, InitError>> {
    // Parse flags
    const { flags } = await this.parse(this.constructor as any);
    const verbose = flags.verbose as boolean;

    // Update services with verbose setting
    this.loggingService = new LoggingService({ verbose });
    this.errorHandler = new ErrorHandler(this.loggingService, verbose);

    // Load configuration
    const configResult = await this.configService.loadConfig({
      cliFlags: {
        projectId: flags['project-id'] as string | undefined,
        credentialPath: flags['credential-path'] as string | undefined,
        verbose: verbose,
      },
      profile: flags.profile as string | undefined,
    });

    if (configResult.isErr()) {
      return err({
        type: 'CONFIG_ERROR',
        message: this.errorHandler.handleConfigError(configResult.error),
      });
    }

    this.loadedConfig = configResult.value;

    // Update logging service with config
    if (this.loadedConfig.logFile) {
      this.loggingService = new LoggingService({
        verbose: this.loadedConfig.verbose || verbose,
        logFile: this.loadedConfig.logFile,
      });
      this.errorHandler = new ErrorHandler(
        this.loggingService,
        this.loadedConfig.verbose || verbose
      );
    }

    return ok(undefined);
  }

  /**
   * Initialize authentication and get Firestore instance
   */
  protected async initializeAuth(): Promise<Result<Firestore, InitError>> {
    if (!this.loadedConfig) {
      return err({
        type: 'CONFIG_ERROR',
        message: 'Configuration not loaded. Call initialize() first.',
      });
    }

    const authResult = await this.authService.initialize(this.loadedConfig);

    if (authResult.isErr()) {
      return err({
        type: 'AUTH_ERROR',
        message: this.errorHandler.handleAuthError(authResult.error),
      });
    }

    this.firestore = authResult.value;
    return ok(authResult.value);
  }

  /**
   * Handle error and exit with appropriate code
   */
  protected handleError(message: string, category?: 'auth' | 'config' | 'validation' | 'firestore' | 'unknown'): void {
    this.loggingService.error(message);
    const helpSuggestion = this.errorHandler.suggestHelp(category);
    if (helpSuggestion) {
      console.error(helpSuggestion);
    }
    this.exit(this.errorHandler.getExitCode(category));
  }

  /**
   * Get loaded configuration
   */
  protected getLoadedConfig(): Config | null {
    return this.loadedConfig;
  }

  /**
   * Get Firestore instance
   */
  protected getFirestoreInstance(): Firestore | null {
    return this.firestore;
  }

  // Service getters for testing
  getConfigService(): ConfigService {
    return this.configService;
  }

  getAuthService(): AuthService {
    return this.authService;
  }

  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  getLoggingService(): LoggingService {
    return this.loggingService;
  }
}
