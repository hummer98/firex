/**
 * Tests for BuildChecker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BuildChecker } from './build-checker';

describe('BuildChecker', () => {
  describe('isNpmPackageInstall', () => {
    it('should return true when running from node_modules', () => {
      const checker = new BuildChecker({
        getDirname: () => '/some/project/node_modules/@hummer98/firex/dist',
      });

      expect(checker.isNpmPackageInstall()).toBe(true);
    });

    it('should return false when running from source', () => {
      const checker = new BuildChecker({
        getDirname: () => '/home/user/projects/firex/dist',
      });

      expect(checker.isNpmPackageInstall()).toBe(false);
    });
  });

  describe('checkBuildStatus', () => {
    it('should skip check and return success when installed as npm package', async () => {
      const checker = new BuildChecker({
        getDirname: () => '/some/project/node_modules/@hummer98/firex/dist',
      });

      const result = await checker.checkBuildStatus();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('build-status');
        expect(result.value.message).toContain('npm');
      }
    });

    it('should return success when dist directory exists and is up to date', async () => {
      const now = Date.now();
      const checker = new BuildChecker({
        getDirname: () => '/home/user/projects/firex/dist',
        directoryExists: (path) => path.endsWith('dist') || path.endsWith('src'),
        getMtime: (path) => {
          if (path.includes('dist')) return new Date(now);
          return new Date(now - 1000); // src is older
        },
        getNewestFileTime: (dir) => {
          if (dir.includes('dist')) return new Date(now);
          return new Date(now - 1000);
        },
      });

      const result = await checker.checkBuildStatus('/home/user/projects/firex');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('success');
        expect(result.value.category).toBe('build-status');
      }
    });

    it('should return warning when source files are newer than build', async () => {
      const now = Date.now();
      const checker = new BuildChecker({
        getDirname: () => '/home/user/projects/firex/dist',
        directoryExists: () => true,
        getMtime: () => new Date(now),
        getNewestFileTime: (dir) => {
          if (dir.includes('src')) return new Date(now + 1000); // src is newer
          return new Date(now);
        },
      });

      const result = await checker.checkBuildStatus('/home/user/projects/firex');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('warning');
        // Message is in Japanese: リビルドが必要です
        expect(result.value.guidance).toContain('npm run build');
      }
    });

    it('should return warning when dist directory does not exist', async () => {
      const checker = new BuildChecker({
        getDirname: () => '/home/user/projects/firex/dist',
        directoryExists: (path) => !path.endsWith('dist'),
      });

      const result = await checker.checkBuildStatus('/home/user/projects/firex');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('warning');
        expect(result.value.message).toContain('dist');
        expect(result.value.guidance).toContain('npm run build');
      }
    });

    it('should use project root from dirname when not specified', async () => {
      const checker = new BuildChecker({
        getDirname: () => '/home/user/projects/firex/dist',
        directoryExists: () => true,
        getMtime: () => new Date(),
        getNewestFileTime: () => new Date(),
      });

      const result = await checker.checkBuildStatus();

      expect(result.isOk()).toBe(true);
    });
  });
});
