import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService } from './config';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('ConfigService', () => {
  let tmpDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let configService: ConfigService;

  beforeEach(async () => {
    // Create temp directory for test config files
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'firex-test-'));
    originalEnv = { ...process.env };
    configService = new ConfigService();
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const config = result.value;
        expect(config.defaultListLimit).toBe(100);
        expect(config.watchShowInitial).toBe(false);
      }
    });

    it('should load config from .firex.yaml file', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(
        configPath,
        'projectId: test-project\ndefaultListLimit: 50\n'
      );

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.projectId).toBe('test-project');
        expect(result.value.defaultListLimit).toBe(50);
      }
    });

    it('should load config from .firex.json file', async () => {
      const configPath = path.join(tmpDir, '.firex.json');
      await fs.writeFile(
        configPath,
        JSON.stringify({ projectId: 'json-project', watchShowInitial: true })
      );

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.projectId).toBe('json-project');
        expect(result.value.watchShowInitial).toBe(true);
      }
    });

    it('should merge environment variables with config file', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(configPath, 'projectId: file-project\n');

      process.env.FIRESTORE_PROJECT_ID = 'env-project';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Environment variable should override file config
        expect(result.value.projectId).toBe('env-project');
      }
    });

    it('should prioritize CLI flags over environment and config file', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(configPath, 'projectId: file-project\n');

      process.env.FIRESTORE_PROJECT_ID = 'env-project';

      const result = await configService.loadConfig({
        searchFrom: tmpDir,
        cliFlags: { projectId: 'cli-project' },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // CLI flag should have highest priority
        expect(result.value.projectId).toBe('cli-project');
      }
    });

    it('should support profile selection', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(
        configPath,
        'projectId: default-project\nprofiles:\n  staging:\n    projectId: staging-project\n'
      );

      const result = await configService.loadConfig({
        searchFrom: tmpDir,
        profile: 'staging',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.projectId).toBe('staging-project');
      }
    });

    it('should return error for invalid YAML syntax', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(configPath, 'invalid: yaml: syntax:\n');

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PARSE_ERROR');
      }
    });

    it('should return error for invalid JSON syntax', async () => {
      const configPath = path.join(tmpDir, '.firex.json');
      await fs.writeFile(configPath, '{invalid json}');

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PARSE_ERROR');
      }
    });
  });

  describe('environment variable mapping', () => {
    it('should map GOOGLE_APPLICATION_CREDENTIALS to credentialPath', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/creds.json';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.credentialPath).toBe('/path/to/creds.json');
      }
    });

    it('should map FIRESTORE_EMULATOR_HOST to emulatorHost', async () => {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emulatorHost).toBe('localhost:8080');
      }
    });
  });
});
