/**
 * DateFormatter tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DateFnsFormatter, DEFAULT_DATE_FORMAT, FirestoreTimestampLike } from './date-formatter';

describe('DateFnsFormatter', () => {
  let formatter: DateFnsFormatter;

  beforeEach(() => {
    formatter = new DateFnsFormatter();
  });

  // Helper to create a Timestamp-like object
  function createTimestamp(date: Date): FirestoreTimestampLike {
    const seconds = Math.floor(date.getTime() / 1000);
    const nanoseconds = (date.getTime() % 1000) * 1000000;
    return {
      _seconds: seconds,
      _nanoseconds: nanoseconds,
      toDate: () => date,
    };
  }

  describe('format', () => {
    it('should format timestamp with default pattern and UTC timezone', () => {
      // January 15, 2024, 14:30:00 UTC
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const timestamp = createTimestamp(date);

      const result = formatter.format(timestamp, {
        pattern: DEFAULT_DATE_FORMAT,
        timezone: 'UTC',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // XXX token outputs 'Z' for UTC, which is valid ISO 8601
        expect(result.value).toBe('2024-01-15T14:30:00Z');
      }
    });

    it('should format timestamp with Asia/Tokyo timezone', () => {
      // January 15, 2024, 05:30:00 UTC = 14:30:00 JST
      const date = new Date(Date.UTC(2024, 0, 15, 5, 30, 0));
      const timestamp = createTimestamp(date);

      const result = formatter.format(timestamp, {
        pattern: DEFAULT_DATE_FORMAT,
        timezone: 'Asia/Tokyo',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('2024-01-15T14:30:00+09:00');
      }
    });

    it('should format timestamp with America/New_York timezone', () => {
      // January 15, 2024, 19:30:00 UTC = 14:30:00 EST (UTC-5)
      const date = new Date(Date.UTC(2024, 0, 15, 19, 30, 0));
      const timestamp = createTimestamp(date);

      const result = formatter.format(timestamp, {
        pattern: DEFAULT_DATE_FORMAT,
        timezone: 'America/New_York',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('2024-01-15T14:30:00-05:00');
      }
    });

    it('should format timestamp with custom pattern', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const timestamp = createTimestamp(date);

      const result = formatter.format(timestamp, {
        pattern: 'yyyy/MM/dd HH:mm:ss',
        timezone: 'UTC',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('2024/01/15 14:30:00');
      }
    });

    it('should format timestamp with date-only pattern', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const timestamp = createTimestamp(date);

      const result = formatter.format(timestamp, {
        pattern: 'yyyy-MM-dd',
        timezone: 'UTC',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('2024-01-15');
      }
    });

    it('should return error for invalid timezone', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const timestamp = createTimestamp(date);

      const result = formatter.format(timestamp, {
        pattern: DEFAULT_DATE_FORMAT,
        timezone: 'Invalid/Timezone',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TIMEZONE');
      }
    });

    it('should handle nanoseconds correctly', () => {
      const timestamp: FirestoreTimestampLike = {
        _seconds: 1705329000, // January 15, 2024, 14:30:00 UTC
        _nanoseconds: 123456789,
        toDate: () => new Date(1705329000 * 1000),
      };

      const result = formatter.format(timestamp, {
        pattern: DEFAULT_DATE_FORMAT,
        timezone: 'UTC',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // XXX token outputs 'Z' for UTC, which is valid ISO 8601
        expect(result.value).toBe('2024-01-15T14:30:00Z');
      }
    });
  });

  describe('validatePattern', () => {
    it('should return Ok for valid pattern', () => {
      const result = formatter.validatePattern("yyyy-MM-dd'T'HH:mm:ssXXX");
      expect(result.isOk()).toBe(true);
    });

    it('should return Ok for common patterns', () => {
      const patterns = [
        'yyyy-MM-dd',
        'yyyy/MM/dd HH:mm:ss',
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        'dd/MM/yyyy',
        'HH:mm:ss',
      ];

      for (const pattern of patterns) {
        const result = formatter.validatePattern(pattern);
        expect(result.isOk()).toBe(true);
      }
    });

    it('should return Err for empty pattern', () => {
      const result = formatter.validatePattern('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATTERN');
      }
    });
  });

  describe('validateTimezone', () => {
    it('should return Ok for valid timezone', () => {
      const result = formatter.validateTimezone('Asia/Tokyo');
      expect(result.isOk()).toBe(true);
    });

    it('should return Ok for UTC', () => {
      const result = formatter.validateTimezone('UTC');
      expect(result.isOk()).toBe(true);
    });

    it('should return Err for invalid timezone', () => {
      const result = formatter.validateTimezone('Not/Valid');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TIMEZONE');
      }
    });
  });
});
