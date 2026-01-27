/**
 * Configuration service for loading and managing application configuration
 */

import { cosmiconfig } from 'cosmiconfig';
import { parse as parseYAML } from 'yaml';
import { Result, ok, err } from '../shared/types';

/**
 * Output configuration options
 */
export interface OutputConfig {
  dateFormat?: string;
  timezone?: string;
  color?: boolean;
  rawOutput?: boolean;
}

/**
 * Application configuration
 */
export interface Config {
  projectId?: string;
  credentialPath?: string;
  databaseURL?: string;
  emulatorHost?: string;
  defaultListLimit: number;
  watchShowInitial: boolean;
  verbose?: boolean;
  logFile?: string;
  output?: OutputConfig;
}

/**
 * Configuration error types
 */
export type ConfigError =
  | { type: 'FILE_NOT_FOUND'; path: string }
  | { type: 'PARSE_ERROR'; message: string; originalError?: Error }
  | { type: 'VALIDATION_ERROR'; message: string };

/**
 * Options for loading configuration
 */
export interface LoadConfigOptions {
  searchFrom?: string;
  cliFlags?: Partial<Config>;
  profile?: string;
}

/**
 * Raw configuration from file (before merging)
 */
interface RawConfig extends Partial<Config> {
  profiles?: Record<string, Partial<Config>>;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  defaultListLimit: 100,
  watchShowInitial: false,
};

/**
 * Service for managing application configuration
 */
export class ConfigService {
  private explorer = cosmiconfig('firex', {
    loaders: {
      '.yaml': (filepath, content) => {
        try {
          return parseYAML(content);
        } catch (error) {
          throw new Error(
            `YAML parse error in ${filepath}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      },
      '.yml': (filepath, content) => {
        try {
          return parseYAML(content);
        } catch (error) {
          throw new Error(
            `YAML parse error in ${filepath}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      },
    },
  });

  /**
   * Load configuration from file, environment variables, and CLI flags
   *
   * Priority: CLI flags > Environment variables > Config file > Defaults
   */
  async loadConfig(
    options: LoadConfigOptions = {}
  ): Promise<Result<Config, ConfigError>> {
    try {
      // 1. Load from config file
      const fileConfig = await this.loadFromFile(
        options.searchFrom,
        options.profile
      );

      if (fileConfig.isErr()) {
        return err(fileConfig.error);
      }

      // 2. Load from environment variables
      const envConfig = this.loadFromEnv();

      // 3. Merge configurations (defaults < file < env < CLI flags)
      const config: Config = {
        ...DEFAULT_CONFIG,
        ...fileConfig.value,
        ...envConfig,
        ...options.cliFlags,
      };

      // 4. Deep merge output configuration
      config.output = this.mergeOutputConfig(
        fileConfig.value.output,
        envConfig.output,
        options.cliFlags?.output
      );

      return ok(config);
    } catch (error) {
      return err({
        type: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : String(error),
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Load configuration from file using cosmiconfig
   */
  private async loadFromFile(
    searchFrom?: string,
    profile?: string
  ): Promise<Result<Partial<Config>, ConfigError>> {
    try {
      // Try to load/search for config file
      let result;

      if (searchFrom) {
        // First try direct load from common locations
        const possiblePaths = [
          '.firex.yaml',
          '.firex.yml',
          '.firex.json',
          '.firex.js',
        ];

        for (const filename of possiblePaths) {
          const filepath = searchFrom.endsWith(filename)
            ? searchFrom
            : `${searchFrom}/${filename}`;

          try {
            result = await this.explorer.load(filepath);
            if (result && !result.isEmpty) break;
          } catch (e) {
            // Check if it's a parse error or file not found
            if (
              e instanceof Error &&
              (e.message.includes('parse') ||
                e.message.includes('YAML') ||
                e.message.includes('JSON') ||
                e.message.includes('Unexpected'))
            ) {
              // Re-throw parse errors
              throw e;
            }
            // File doesn't exist, continue
            continue;
          }
        }
      }

      // If no result yet, try searching upward
      if (!result || result.isEmpty) {
        result = searchFrom
          ? await this.explorer.search(searchFrom)
          : await this.explorer.search();
      }

      if (!result || result.isEmpty) {
        // No config file found - not an error, just use defaults
        return ok({});
      }

      const rawConfig = result.config as RawConfig;

      // Handle profile selection
      if (profile && rawConfig.profiles && rawConfig.profiles[profile]) {
        const profileConfig = rawConfig.profiles[profile];
        // Merge base config with profile config
        const { profiles, ...baseConfig } = rawConfig;
        return ok({ ...baseConfig, ...profileConfig });
      }

      // Remove profiles from final config
      const { profiles, ...config } = rawConfig;
      return ok(config);
    } catch (error) {
      if (error instanceof Error) {
        // Cosmiconfig throws YAMLException or SyntaxError for parse errors
        if (
          error.name === 'YAMLException' ||
          error.name === 'SyntaxError' ||
          error.message.includes('YAML') ||
          error.message.includes('parse')
        ) {
          return err({
            type: 'PARSE_ERROR',
            message: `設定ファイルの解析に失敗しました: ${error.message}`,
            originalError: error,
          });
        }
      }
      throw error;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): Partial<Config> {
    const config: Partial<Config> = {};

    if (process.env.FIRESTORE_PROJECT_ID) {
      config.projectId = process.env.FIRESTORE_PROJECT_ID;
    }

    // Note: GOOGLE_APPLICATION_CREDENTIALS is handled automatically by
    // Firebase Admin SDK's applicationDefault(). We don't set credentialPath
    // here because cert() only supports service account keys, not ADC user
    // credentials (authorized_user type).

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      config.emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    }

    if (process.env.FIRESTORE_DATABASE_URL) {
      config.databaseURL = process.env.FIRESTORE_DATABASE_URL;
    }

    // Parse numeric values
    if (process.env.FIREX_DEFAULT_LIMIT) {
      const limit = parseInt(process.env.FIREX_DEFAULT_LIMIT, 10);
      if (!isNaN(limit)) {
        config.defaultListLimit = limit;
      }
    }

    // Parse boolean values
    if (process.env.FIREX_WATCH_SHOW_INITIAL) {
      config.watchShowInitial =
        process.env.FIREX_WATCH_SHOW_INITIAL === 'true';
    }

    if (process.env.FIREX_VERBOSE) {
      config.verbose = process.env.FIREX_VERBOSE === 'true';
    }

    if (process.env.FIREX_LOG_FILE) {
      config.logFile = process.env.FIREX_LOG_FILE;
    }

    // Load output configuration from environment
    const outputConfig = this.loadOutputFromEnv();
    if (Object.keys(outputConfig).length > 0) {
      config.output = outputConfig;
    }

    return config;
  }

  /**
   * Load output configuration from environment variables
   */
  private loadOutputFromEnv(): OutputConfig {
    const output: OutputConfig = {};

    // Timezone priority: FIREX_TIMEZONE > TZ
    if (process.env.FIREX_TIMEZONE) {
      output.timezone = process.env.FIREX_TIMEZONE;
    } else if (process.env.TZ) {
      output.timezone = process.env.TZ;
    }

    if (process.env.FIREX_DATE_FORMAT) {
      output.dateFormat = process.env.FIREX_DATE_FORMAT;
    }

    if (process.env.FIREX_RAW_OUTPUT) {
      output.rawOutput =
        process.env.FIREX_RAW_OUTPUT === 'true' ||
        process.env.FIREX_RAW_OUTPUT === '1';
    }

    // Handle FIREX_NO_COLOR
    if (process.env.FIREX_NO_COLOR) {
      const noColor =
        process.env.FIREX_NO_COLOR === 'true' ||
        process.env.FIREX_NO_COLOR === '1';
      if (noColor) {
        output.color = false;
      }
    }

    // Handle NO_COLOR (standard convention: existence triggers, value doesn't matter)
    if (process.env.NO_COLOR !== undefined) {
      output.color = false;
    }

    return output;
  }

  /**
   * Merge output configurations with priority: cli > env > file
   */
  private mergeOutputConfig(
    fileOutput?: OutputConfig,
    envOutput?: OutputConfig,
    cliOutput?: OutputConfig
  ): OutputConfig | undefined {
    // If no output config from any source, return undefined
    if (!fileOutput && !envOutput && !cliOutput) {
      return undefined;
    }

    return {
      ...fileOutput,
      ...envOutput,
      ...cliOutput,
    };
  }

  /**
   * Get current configuration (for display purposes)
   */
  getCurrentConfig(config: Config): Record<string, unknown> {
    return {
      projectId: config.projectId || '(not set)',
      credentialPath: config.credentialPath || '(not set)',
      databaseURL: config.databaseURL || '(not set)',
      emulatorHost: config.emulatorHost || '(not set)',
      defaultListLimit: config.defaultListLimit,
      watchShowInitial: config.watchShowInitial,
      verbose: config.verbose || false,
      logFile: config.logFile || '(not set)',
    };
  }
}
