/**
 * Main entry point for the firex CLI
 * Initializes oclif framework and routes commands
 */

import { execute } from '@oclif/core';

/**
 * CLI entry point
 * Executes oclif command router to handle CLI commands
 */
export async function run(): Promise<void> {
  await execute({ dir: import.meta.url });
}

export const version = '0.1.1';
