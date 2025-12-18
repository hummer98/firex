/**
 * Tests for ConfigCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigCommand } from './config';
import { ConfigService } from '../services/config';

describe('ConfigCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command configuration', () => {
    it('should have correct description', () => {
      expect(ConfigCommand.description).toContain('設定');
    });

    it('should have show flag', () => {
      expect(ConfigCommand.flags).toBeDefined();
      expect(ConfigCommand.flags.show).toBeDefined();
    });

    it('should inherit base flags', () => {
      expect(ConfigCommand.flags.verbose).toBeDefined();
    });
  });

  describe('config service', () => {
    it('should use ConfigService for config display', () => {
      const configService = new ConfigService();
      expect(configService.getCurrentConfig).toBeDefined();
    });

    it('should display current config values', () => {
      const configService = new ConfigService();
      const config = {
        defaultListLimit: 100,
        watchShowInitial: false,
        projectId: 'test-project',
      };
      const display = configService.getCurrentConfig(config as any);

      expect(display.projectId).toBe('test-project');
      expect(display.defaultListLimit).toBe(100);
    });
  });
});
