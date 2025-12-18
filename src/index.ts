/**
 * Main entry point for the firex CLI
 * Initializes oclif framework and routes commands
 */

import { execute } from '@oclif/core';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

/**
 * CLI entry point
 * Executes oclif command router to handle CLI commands
 */
export async function run(): Promise<void> {
  await execute({ dir: import.meta.url });
}

export const version: string = packageJson.version;
