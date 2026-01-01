/**
 * BuildChecker - Validates build status for development environments
 */

import * as fs from 'fs';
import * as path from 'path';
import { Result, ok, err } from '../../shared/types';
import type { CheckResult, CheckerError } from './types';
import { createCheckResult } from './types';
import { t } from '../../shared/i18n';

/**
 * Dependencies for testing
 */
export interface BuildCheckerDeps {
  getDirname?: () => string;
  directoryExists?: (path: string) => boolean;
  getMtime?: (path: string) => Date;
  getNewestFileTime?: (dir: string) => Date;
}

/**
 * Build status checker for development environments
 */
export class BuildChecker {
  private getDirname: () => string;
  private directoryExists: (path: string) => boolean;
  private getNewestFileTime: (dir: string) => Date;

  constructor(deps: BuildCheckerDeps = {}) {
    this.getDirname = deps.getDirname || (() => __dirname);
    this.directoryExists = deps.directoryExists || ((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
    this.getNewestFileTime = deps.getNewestFileTime || this.defaultGetNewestFileTime.bind(this);
    // getMtime is available in deps for testing but defaultGetNewestFileTime uses fs directly
    void deps.getMtime;
  }

  /**
   * Get the newest file modification time in a directory recursively
   */
  private defaultGetNewestFileTime(dir: string): Date {
    let newest = new Date(0);

    const scan = (directory: string): void => {
      try {
        const entries = fs.readdirSync(directory, { withFileTypes: true });
        for (const entry of entries) {
          // Skip node_modules and hidden directories
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          const fullPath = path.join(directory, entry.name);

          if (entry.isDirectory()) {
            scan(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
            try {
              const mtime = fs.statSync(fullPath).mtime;
              if (mtime > newest) {
                newest = mtime;
              }
            } catch {
              // Skip files we can't stat
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    scan(dir);
    return newest;
  }

  /**
   * Check if running as an installed npm package
   */
  isNpmPackageInstall(): boolean {
    const dirname = this.getDirname();
    return dirname.includes('node_modules');
  }

  /**
   * Check build status
   */
  async checkBuildStatus(projectRoot?: string): Promise<Result<CheckResult, CheckerError>> {
    try {
      // Skip check if installed as npm package
      if (this.isNpmPackageInstall()) {
        return ok(
          createCheckResult(
            'success',
            'build-status',
            t('doctor.check.build.npmPackage'),
            t('doctor.check.build.skipped')
          )
        );
      }

      // Determine project root
      // When running from dist/, we need to go up to the project root
      const dirname = this.getDirname();
      let root = projectRoot;
      if (!root) {
        // Find the project root by looking for package.json
        let current = dirname;
        while (current !== path.dirname(current)) {
          if (fs.existsSync(path.join(current, 'package.json'))) {
            root = current;
            break;
          }
          current = path.dirname(current);
        }
        // Fallback: go up from dirname
        if (!root) {
          root = path.resolve(dirname, '..');
        }
      }
      const distDir = path.join(root, 'dist');
      const srcDir = path.join(root, 'src');

      // Check if dist directory exists
      if (!this.directoryExists(distDir)) {
        return ok(
          createCheckResult(
            'warning',
            'build-status',
            t('doctor.check.build.noDistDir'),
            `${t('doctor.check.build.expectedPath')}: ${distDir}`,
            t('doctor.check.build.runBuildHint')
          )
        );
      }

      // Check if source directory exists
      if (!this.directoryExists(srcDir)) {
        return ok(
          createCheckResult(
            'success',
            'build-status',
            t('doctor.check.build.builtEnv'),
            t('doctor.check.build.noSrcDir')
          )
        );
      }

      // Compare source and build timestamps
      const srcNewest = this.getNewestFileTime(srcDir);
      const distNewest = this.getNewestFileTime(distDir);

      if (srcNewest > distNewest) {
        return ok(
          createCheckResult(
            'warning',
            'build-status',
            t('doctor.check.build.rebuildRequired'),
            `${t('doctor.check.build.newestSource')}: ${srcNewest.toISOString()}\n${t('doctor.check.build.newestBuild')}: ${distNewest.toISOString()}`,
            t('doctor.check.build.runBuildHint')
          )
        );
      }

      return ok(
        createCheckResult(
          'success',
          'build-status',
          t('doctor.check.build.upToDate'),
          `${t('doctor.check.build.newestBuild')}: ${distNewest.toISOString()}`
        )
      );
    } catch (error) {
      return err({
        type: 'FILE_READ_ERROR',
        path: projectRoot || 'unknown',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
