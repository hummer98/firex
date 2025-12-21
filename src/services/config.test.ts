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

    it('should map FIREX_TIMEZONE to output.timezone', async () => {
      process.env.FIREX_TIMEZONE = 'Asia/Tokyo';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.timezone).toBe('Asia/Tokyo');
      }
    });

    it('should map FIREX_DATE_FORMAT to output.dateFormat', async () => {
      process.env.FIREX_DATE_FORMAT = 'yyyy/MM/dd';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.dateFormat).toBe('yyyy/MM/dd');
      }
    });

    it('should map FIREX_RAW_OUTPUT=true to output.rawOutput', async () => {
      process.env.FIREX_RAW_OUTPUT = 'true';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.rawOutput).toBe(true);
      }
    });

    it('should map FIREX_RAW_OUTPUT=1 to output.rawOutput', async () => {
      process.env.FIREX_RAW_OUTPUT = '1';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.rawOutput).toBe(true);
      }
    });

    it('should map FIREX_NO_COLOR=true to output.color=false', async () => {
      process.env.FIREX_NO_COLOR = 'true';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.color).toBe(false);
      }
    });

    it('should map NO_COLOR (any value) to output.color=false', async () => {
      process.env.NO_COLOR = '1';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.color).toBe(false);
      }
    });

    it('should map NO_COLOR (empty string) to output.color=false', async () => {
      // NO_COLOR should trigger on existence, not value
      process.env.NO_COLOR = '';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.color).toBe(false);
      }
    });
  });

  describe('output configuration', () => {
    it('should load output section from config file', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(
        configPath,
        `projectId: test-project
output:
  dateFormat: "yyyy-MM-dd'T'HH:mm:ss"
  timezone: Europe/London
  color: false
  rawOutput: true
`
      );

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.output?.dateFormat).toBe("yyyy-MM-dd'T'HH:mm:ss");
        expect(result.value.output?.timezone).toBe('Europe/London');
        expect(result.value.output?.color).toBe(false);
        expect(result.value.output?.rawOutput).toBe(true);
      }
    });

    it('should use default output values when output section is missing', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(configPath, 'projectId: test-project\n');

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should use defaults
        expect(result.value.output).toBeUndefined();
      }
    });

    it('should merge environment output settings with file config', async () => {
      const configPath = path.join(tmpDir, '.firex.yaml');
      await fs.writeFile(
        configPath,
        `output:
  dateFormat: "yyyy-MM-dd"
  timezone: America/New_York
`
      );

      process.env.FIREX_TIMEZONE = 'Asia/Tokyo';

      const result = await configService.loadConfig({ searchFrom: tmpDir });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Environment should override file
        expect(result.value.output?.timezone).toBe('Asia/Tokyo');
        // File value should remain
        expect(result.value.output?.dateFormat).toBe('yyyy-MM-dd');
      }
    });
  });
});
