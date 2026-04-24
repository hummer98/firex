#!/usr/bin/env node
/**
 * package.json の version を .claude-plugin/plugin.json と
 * .claude-plugin/marketplace.json に同期する。
 * npm version 実行時の `version` script から呼ばれる。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;

function updateJson(filePath, updater) {
  const absolutePath = resolve(root, filePath);
  const original = readFileSync(absolutePath, 'utf8');
  const data = JSON.parse(original);
  updater(data);
  const trailingNewline = original.endsWith('\n') ? '\n' : '';
  writeFileSync(absolutePath, JSON.stringify(data, null, 2) + trailingNewline);
}

updateJson('.claude-plugin/plugin.json', (data) => {
  data.version = version;
});

updateJson('.claude-plugin/marketplace.json', (data) => {
  if (Array.isArray(data.plugins)) {
    for (const plugin of data.plugins) {
      if (plugin.name === 'firex') plugin.version = version;
    }
  }
});

console.log(`synced plugin version -> ${version}`);
