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
              `設定ファイルが見つかりました: ${filename}`,
              `ファイルパス: ${filePath}`
            )
          );
        }
      }

      return ok(
        createCheckResult(
          'success',
          'config-file',
          '設定ファイルが見つかりません - デフォルト設定で動作します',
          '検索パス: ' + basePath,
          '設定ファイルを作成する場合は .firex.yaml または .firex.json を作成してください'
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
              'YAML 構文は有効です',
              `ファイル: ${filePath}`
            )
          );
        } catch (error) {
          if (error instanceof YAMLParseError) {
            const position = error.linePos
              ? `行 ${error.linePos[0].line}, 列 ${error.linePos[0].col}`
              : '不明';
            return ok(
              createCheckResult(
                'error',
                'config-syntax',
                'YAML 構文エラー',
                `位置: ${position}\n${error.message}`,
                'YAML の構文を確認してください。インデントはスペースを使用してください。'
              )
            );
          }
          // Handle other YAML errors
          if (error instanceof Error && error.name.includes('YAML')) {
            return ok(
              createCheckResult(
                'error',
                'config-syntax',
                'YAML 構文エラー',
                error.message,
                'YAML の構文を確認してください。インデントはスペースを使用してください。'
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
              'JSON 構文は有効です',
              `ファイル: ${filePath}`
            )
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return ok(
            createCheckResult(
              'error',
              'config-syntax',
              'JSON 構文エラー',
              message,
              'JSON の構文を確認してください。カンマやクォートを確認してください。'
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
            '設定スキーマは有効です'
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
          '設定スキーマの検証に失敗しました',
          errors.join('\n'),
          '設定ファイルのフィールドと値の型を確認してください。\n' +
            '有効なフィールド: projectId (string), credentialPath (string), ' +
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
            'コレクションパスの検証: 対象なし'
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
            `すべてのコレクションパスが有効です (${paths.length} 件)`
          )
        );
      }

      return ok(
        createCheckResult(
          'error',
          'collection-paths',
          'コレクションパスの形式が不正です',
          `無効なパス:\n  ${invalidPaths.join('\n  ')}`,
          'コレクションパスは奇数のセグメント数である必要があります。\n' +
            '例: "users" (1セグメント), "users/user1/comments" (3セグメント)'
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
