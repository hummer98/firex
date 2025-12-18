/**
 * FileSystemService unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemService } from './filesystem-service';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;
  let tempDir: string;

  beforeEach(async () => {
    fileSystemService = new FileSystemService();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filesystem-service-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('readJSON', () => {
    it('should read JSON file successfully', async () => {
      const filePath = path.join(tempDir, 'test.json');
      const testData = { name: 'Test', value: 123 };
      await fs.writeFile(filePath, JSON.stringify(testData), 'utf-8');

      const result = await fileSystemService.readJSON(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(testData);
      }
    });

    it('should handle file not found error', async () => {
      const result = await fileSystemService.readJSON(path.join(tempDir, 'nonexistent.json'));

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_NOT_FOUND');
      }
    });

    it('should handle invalid JSON', async () => {
      const filePath = path.join(tempDir, 'invalid.json');
      await fs.writeFile(filePath, 'invalid json content', 'utf-8');

      const result = await fileSystemService.readJSON(filePath);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PARSE_ERROR');
      }
    });
  });

  describe('writeJSON', () => {
    it('should write JSON file successfully', async () => {
      const filePath = path.join(tempDir, 'output.json');
      const testData = { name: 'Test', value: 456 };

      const result = await fileSystemService.writeJSON(filePath, testData);

      expect(result.isOk()).toBe(true);

      // Verify file was written correctly
      const content = await fs.readFile(filePath, 'utf-8');
      expect(JSON.parse(content)).toEqual(testData);
    });

    it('should create parent directories if needed', async () => {
      const filePath = path.join(tempDir, 'nested', 'dir', 'output.json');
      const testData = { test: true };

      const result = await fileSystemService.writeJSON(filePath, testData);

      expect(result.isOk()).toBe(true);

      // Verify file exists
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'exists.txt');
      await fs.writeFile(filePath, 'test', 'utf-8');

      const result = await fileSystemService.fileExists(filePath);

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await fileSystemService.fileExists(
        path.join(tempDir, 'nonexistent.txt')
      );

      expect(result).toBe(false);
    });
  });

  describe('readText', () => {
    it('should read text file successfully', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      const testContent = 'Hello, World!';
      await fs.writeFile(filePath, testContent, 'utf-8');

      const result = await fileSystemService.readText(filePath);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(testContent);
      }
    });
  });

  describe('writeText', () => {
    it('should write text file successfully', async () => {
      const filePath = path.join(tempDir, 'output.txt');
      const testContent = 'Test content';

      const result = await fileSystemService.writeText(filePath, testContent);

      expect(result.isOk()).toBe(true);

      // Verify file was written
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe(testContent);
    });
  });
});
