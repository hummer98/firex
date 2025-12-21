/**
 * TimezoneService tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TimezoneService } from './timezone';

describe('TimezoneService', () => {
  let service: TimezoneService;

  beforeEach(() => {
    service = new TimezoneService();
  });

  describe('getSystemTimezone', () => {
    it('should return a valid IANA timezone name', () => {
      const timezone = service.getSystemTimezone();
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
      // Valid IANA timezone names contain a slash (e.g., 'Asia/Tokyo', 'America/New_York')
      // or are 'UTC'
      expect(
        timezone.includes('/') || timezone === 'UTC'
      ).toBe(true);
    });

    it('should return UTC when Intl API returns undefined', () => {
      // Mock Intl.DateTimeFormat to return undefined
      const originalDateTimeFormat = Intl.DateTimeFormat;
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: undefined } as any),
      } as any));

      const timezone = service.getSystemTimezone();
      expect(timezone).toBe('UTC');

      // Restore
      vi.restoreAllMocks();
    });
  });

  describe('validateTimezone', () => {
    it('should return Ok for valid IANA timezone', () => {
      const result = service.validateTimezone('Asia/Tokyo');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('Asia/Tokyo');
      }
    });

    it('should return Ok for UTC', () => {
      const result = service.validateTimezone('UTC');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('UTC');
      }
    });

    it('should return Ok for America/New_York', () => {
      const result = service.validateTimezone('America/New_York');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('America/New_York');
      }
    });

    it('should return Err for invalid timezone', () => {
      const result = service.validateTimezone('Invalid/Timezone');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TIMEZONE');
        expect(result.error.timezone).toBe('Invalid/Timezone');
      }
    });

    it('should return Err for empty string', () => {
      const result = service.validateTimezone('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TIMEZONE');
      }
    });

    it('should return Err for random string', () => {
      const result = service.validateTimezone('not-a-timezone');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('resolveTimezone', () => {
    it('should return the timezone as-is for valid timezone', () => {
      const result = service.resolveTimezone('Europe/London');
      expect(result.timezone).toBe('Europe/London');
      expect(result.warning).toBeUndefined();
    });

    it('should return UTC with warning for invalid timezone', () => {
      const result = service.resolveTimezone('Invalid/Zone');
      expect(result.timezone).toBe('UTC');
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('Invalid/Zone');
    });

    it('should return UTC with warning for empty string', () => {
      const result = service.resolveTimezone('');
      expect(result.timezone).toBe('UTC');
      expect(result.warning).toBeDefined();
    });
  });
});
