/**
 * OutputOptionsResolver tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutputOptionsResolver, ResolvedOutputOptions } from './output-options-resolver';
import { TimezoneService } from './timezone';
import { OutputConfig } from './config';

describe('OutputOptionsResolver', () => {
  let resolver: OutputOptionsResolver;
  let timezoneService: TimezoneService;

  beforeEach(() => {
    timezoneService = new TimezoneService();
    resolver = new OutputOptionsResolver(timezoneService);
  });

  describe('resolve', () => {
    it('should return default values when no options provided', () => {
      const result = resolver.resolve({
        cliFlags: {},
        config: {},
      });

      expect(result.dateFormat).toBe("yyyy-MM-dd'T'HH:mm:ssXXX");
      expect(result.timezone).toBeTruthy(); // System timezone
      expect(result.color).toBe(true);
      expect(result.rawOutput).toBe(false);
      expect(result.noDateFormat).toBe(false);
    });

    it('should use config file values when no CLI flags', () => {
      const config: OutputConfig = {
        dateFormat: 'yyyy/MM/dd',
        timezone: 'Europe/London',
        color: false,
        rawOutput: true,
      };

      const result = resolver.resolve({
        cliFlags: {},
        config,
      });

      expect(result.dateFormat).toBe('yyyy/MM/dd');
      expect(result.timezone).toBe('Europe/London');
      expect(result.color).toBe(false);
      expect(result.rawOutput).toBe(true);
    });

    it('should prioritize CLI flags over config', () => {
      const config: OutputConfig = {
        dateFormat: 'yyyy/MM/dd',
        timezone: 'Europe/London',
        color: true,
        rawOutput: false,
      };

      const result = resolver.resolve({
        cliFlags: {
          dateFormat: 'dd-MM-yyyy',
          timezone: 'Asia/Tokyo',
          noColor: true,
          rawOutput: true,
        },
        config,
      });

      expect(result.dateFormat).toBe('dd-MM-yyyy');
      expect(result.timezone).toBe('Asia/Tokyo');
      expect(result.color).toBe(false); // noColor: true means color: false
      expect(result.rawOutput).toBe(true);
    });

    it('should handle noColor flag correctly', () => {
      const result = resolver.resolve({
        cliFlags: {
          noColor: true,
        },
        config: {},
      });

      expect(result.color).toBe(false);
    });

    it('should handle noDateFormat flag correctly', () => {
      const result = resolver.resolve({
        cliFlags: {
          noDateFormat: true,
        },
        config: {},
      });

      expect(result.noDateFormat).toBe(true);
    });

    it('should fallback to UTC for invalid timezone with warning', () => {
      const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = resolver.resolve({
        cliFlags: {
          timezone: 'Invalid/Zone',
        },
        config: {},
      });

      expect(result.timezone).toBe('UTC');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should use system timezone when not specified', () => {
      const systemTz = timezoneService.getSystemTimezone();

      const result = resolver.resolve({
        cliFlags: {},
        config: {},
      });

      expect(result.timezone).toBe(systemTz);
    });

    it('should merge partial CLI flags with config', () => {
      const config: OutputConfig = {
        dateFormat: 'yyyy/MM/dd',
        timezone: 'Europe/London',
      };

      const result = resolver.resolve({
        cliFlags: {
          timezone: 'Asia/Tokyo',
        },
        config,
      });

      expect(result.dateFormat).toBe('yyyy/MM/dd'); // From config
      expect(result.timezone).toBe('Asia/Tokyo'); // CLI overrides
    });

    it('should handle undefined values in config', () => {
      const config: OutputConfig = {
        dateFormat: undefined,
        timezone: undefined,
      };

      const result = resolver.resolve({
        cliFlags: {},
        config,
      });

      expect(result.dateFormat).toBe("yyyy-MM-dd'T'HH:mm:ssXXX"); // Default
      expect(result.timezone).toBeTruthy(); // System timezone
    });
  });
});
