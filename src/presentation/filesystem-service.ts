/**
 * FileSystem service for file I/O operations
 */

import { Result, ok, err } from '../shared/types';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * FileSystem error types
 */
export type FileSystemError =
  | { type: 'FILE_NOT_FOUND'; path: string; message: string }
  | { type: 'PARSE_ERROR'; path: string; message: string }
  | { type: 'WRITE_ERROR'; path: string; message: string; originalError: Error }
  | { type: 'READ_ERROR'; path: string; message: string; originalError: Error };

/**
 * Service for file system operations
 */
export class FileSystemService {
  /**
   * Read and parse JSON file
   */
  async readJSON<T = unknown>(filePath: string): Promise<Result<T, FileSystemError>> {
    try {
      // Check if file exists
      const exists = await this.fileExists(filePath);
      if (!exists) {
        return err({
          type: 'FILE_NOT_FOUND',
          path: filePath,
          message: `ファイルが見つかりません: ${filePath}`,
        });
      }

      // Read file
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse JSON
      try {
        const data = JSON.parse(content) as T;
        return ok(data);
      } catch (parseError) {
        return err({
          type: 'PARSE_ERROR',
          path: filePath,
          message: `JSONの解析に失敗しました: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`,
        });
      }
    } catch (error) {
      return err({
        type: 'READ_ERROR',
        path: filePath,
        message: `ファイルの読み込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Write data as JSON to file
   */
  async writeJSON<T = unknown>(
    filePath: string,
    data: T,
    options?: { createDirs?: boolean }
  ): Promise<Result<void, FileSystemError>> {
    try {
      // Create parent directories if needed
      if (options?.createDirs !== false) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Write file
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'WRITE_ERROR',
        path: filePath,
        message: `ファイルの書き込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read text file
   */
  async readText(filePath: string): Promise<Result<string, FileSystemError>> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return ok(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return err({
          type: 'FILE_NOT_FOUND',
          path: filePath,
          message: `ファイルが見つかりません: ${filePath}`,
        });
      }

      return err({
        type: 'READ_ERROR',
        path: filePath,
        message: `ファイルの読み込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Write text to file
   */
  async writeText(
    filePath: string,
    content: string,
    options?: { createDirs?: boolean }
  ): Promise<Result<void, FileSystemError>> {
    try {
      // Create parent directories if needed
      if (options?.createDirs !== false) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'WRITE_ERROR',
        path: filePath,
        message: `ファイルの書き込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Normalize file path
   */
  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }
}
