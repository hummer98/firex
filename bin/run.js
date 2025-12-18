#!/usr/bin/env node

// Entry point for the CLI
import('../dist/index.js')
  .then((module) => module.run())
  .catch((error) => {
    console.error('Failed to start CLI:', error);
    process.exit(1);
  });
