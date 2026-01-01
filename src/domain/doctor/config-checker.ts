/**
 * ConfigChecker - Validates firex configuration files
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYAML, YAMLParseError } from 'yaml';
import { z } from 'zod';
import { Result, ok, err } from '../../shared/types';
import type { CheckResult, CheckerError } from './types';
import { createCheckResult } from './types';
import { t } from '../../shared/i18n';

/**
 * Config file schema for validation
 */
const ConfigSchema = z.object({
  projectId: z.string().optional(),
  credentialPath: z.string().optional(),
  databaseURL: z.string().optional(),
  emulatorHost: z.string().optional(),
  defaultListLimit: z.number().positive().optional(),
  watchShowInitial: z.boolean().optional(),
  verbose: z.boolean().optional(),
  logFile: z.string().optional(),
  profiles: z.record(z.string(), z.object({
    projectId: z.string().optional(),
    credentialPath: z.string().optional(),
    databaseURL: z.string().optional(),
    emulatorHost: z.string().optional(),
    defaultListLimit: z.number().positive().optional(),
    watchShowInitial: z.boolean().optional(),
    verbose: z.boolean().optional(),
    logFile: z.string().optional(),
  })).optional(),
}).passthrough();

/**
 * Dependencies for testing
 */
export interface ConfigCheckerDeps {
  fileExists?: (path: string) => boolean;
  readFile?: (path: string) => Promise<string>;
}

/**
 * Config file checker
 */
export class ConfigChecker {
  private fileExists: (filePath: string) => boolean;
  private readFileContent: (filePath: string) => Promise<string>;

  constructor(deps: ConfigCheckerDeps = {}) {
    this.fileExists = deps.fileExists || ((p) => fs.existsSync(p));
    this.readFileContent = deps.readFile || ((p) => fs.promises.readFile(p, 'utf-8'));
  }

  /**
   * Read file content for validation
   */
  async readFile(filePath: string): Promise<Result<string, CheckerError>> {
    try {
      const content = await this.readFileContent(filePath);
      return ok(content);
    } catch (error) {
      return err({
        type: 'FILE_READ_ERROR',
        path: filePath,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse config content (YAML or JSON)
   */
  parseConfig(filePath: string, content: string): Result<unknown, CheckerError> {
    try {
      const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');
      if (isYaml) {
        return ok(parseYAML(content));
      } else {
        return ok(JSON.parse(content));
      }
    } catch (error) {
      return err({
        type: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check for config file existence
   */
  async checkConfigFile(searchPath?: string): Promise<Result<CheckResult, CheckerError>> {
    try {
      const basePath = searchPath || process.cwd();
      const configFiles = ['.firex.yaml', '.firex.yml', '.firex.json'];

      for (const filename of configFiles) {
        const filePath = path.join(basePath, filename);
        if (this.fileExists(filePath)) {
          return ok(
            createCheckResult(
              'success',
              'config-file',
              `${t('doctor.check.config.found')}: ${filename}`,
              `${t('doctor.check.config.filePath')}: ${filePath}`,
              undefined,
              { filePath, found: true }
            )
          );
        }
      }

      return ok(
        createCheckResult(
          'success',
          'config-file',
          t('doctor.check.config.notFound'),
          `${t('doctor.check.config.searchPath')}: ${basePath}`,
          t('doctor.check.config.createHint'),
          { found: false }
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
   * Validate config file syntax
   */
  validateConfigSyntax(filePath: string, content: string): Result<CheckResult, CheckerError> {
    try {
      const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml');

      if (isYaml) {
        try {
          parseYAML(content);
          return ok(
            createCheckResult(
              'success',
              'config-syntax',
              t('doctor.check.syntax.yamlValid'),
              `File: ${filePath}`
            )
          );
        } catch (error) {
          if (error instanceof YAMLParseError) {
            const position = error.linePos
              ? `Line ${error.linePos[0].line}, Col ${error.linePos[0].col}`
              : 'unknown';
            return ok(
              createCheckResult(
                'error',
                'config-syntax',
                t('doctor.check.syntax.yamlError'),
                `${t('doctor.check.syntax.position')}: ${position}\n${error.message}`,
                t('doctor.check.syntax.yamlHint')
              )
            );
          }
          // Handle other YAML errors
          if (error instanceof Error && error.name.includes('YAML')) {
            return ok(
              createCheckResult(
                'error',
                'config-syntax',
                t('doctor.check.syntax.yamlError'),
                error.message,
                t('doctor.check.syntax.yamlHint')
              )
            );
          }
          throw error;
        }
      } else {
        // JSON
        try {
          JSON.parse(content);
          return ok(
            createCheckResult(
              'success',
              'config-syntax',
              t('doctor.check.syntax.jsonValid'),
              `File: ${filePath}`
            )
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return ok(
            createCheckResult(
              'error',
              'config-syntax',
              t('doctor.check.syntax.jsonError'),
              message,
              t('doctor.check.syntax.jsonHint')
            )
          );
        }
      }
    } catch (error) {
      return err({
        type: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate config against schema
   */
  validateConfigSchema(config: unknown): Result<CheckResult, CheckerError> {
    try {
      const result = ConfigSchema.safeParse(config);

      if (result.success) {
        return ok(
          createCheckResult(
            'success',
            'config-schema',
            t('doctor.check.schema.valid')
          )
        );
      }

      const errors = result.error.issues.map((e) => {
        const errorPath = e.path.join('.');
        return `  - ${errorPath || '(root)'}: ${e.message}`;
      });

      return ok(
        createCheckResult(
          'error',
          'config-schema',
          t('doctor.check.schema.invalid'),
          errors.join('\n'),
          `${t('doctor.check.schema.validFields')}: projectId (string), credentialPath (string), ` +
            'defaultListLimit (number), watchShowInitial (boolean), verbose (boolean)'
        )
      );
    } catch (error) {
      return err({
        type: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate collection paths format
   */
  validateCollectionPaths(paths: string[]): Result<CheckResult, CheckerError> {
    try {
      if (paths.length === 0) {
        return ok(
          createCheckResult(
            'success',
            'collection-paths',
            t('doctor.check.paths.noTargets')
          )
        );
      }

      const invalidPaths: string[] = [];

      for (const p of paths) {
        // Collection paths must have odd number of segments
        const segments = p.split('/').filter(Boolean);
        if (segments.length % 2 === 0) {
          invalidPaths.push(p);
        }
      }

      if (invalidPaths.length === 0) {
        return ok(
          createCheckResult(
            'success',
            'collection-paths',
            `${t('doctor.check.paths.allValid')} (${paths.length})`
          )
        );
      }

      return ok(
        createCheckResult(
          'error',
          'collection-paths',
          t('doctor.check.paths.invalid'),
          `${t('doctor.check.paths.invalidPaths')}:\n  ${invalidPaths.join('\n  ')}`,
          `${t('doctor.check.paths.segmentHint')}\nExample: "users" (1), "users/user1/comments" (3)`
        )
      );
    } catch (error) {
      return err({
        type: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
