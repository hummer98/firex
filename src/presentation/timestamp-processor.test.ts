/**
 * TimestampProcessor tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TimestampProcessor,
  TimestampProcessorOptions,
} from './timestamp-processor';
import { DateFnsFormatter, FirestoreTimestampLike } from './date-formatter';

describe('TimestampProcessor', () => {
  let processor: TimestampProcessor;
  let formatter: DateFnsFormatter;

  beforeEach(() => {
    formatter = new DateFnsFormatter();
    processor = new TimestampProcessor(formatter);
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

  const defaultOptions: TimestampProcessorOptions = {
    dateFormat: "yyyy-MM-dd'T'HH:mm:ssXXX",
    timezone: 'UTC',
    noDateFormat: false,
  };

  describe('isTimestamp', () => {
    it('should return true for Timestamp-like object with toDate method', () => {
      const timestamp = createTimestamp(new Date());
      expect(processor.isTimestamp(timestamp)).toBe(true);
    });

    it('should return true for Timestamp-like object without toDate method', () => {
      const timestamp = {
        _seconds: 1705329000,
        _nanoseconds: 0,
      };
      expect(processor.isTimestamp(timestamp)).toBe(true);
    });

    it('should return false for null', () => {
      expect(processor.isTimestamp(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(processor.isTimestamp(undefined)).toBe(false);
    });

    it('should return false for plain object', () => {
      expect(processor.isTimestamp({ foo: 'bar' })).toBe(false);
    });

    it('should return false for string', () => {
      expect(processor.isTimestamp('2024-01-15')).toBe(false);
    });

    it('should return false for number', () => {
      expect(processor.isTimestamp(1705329000)).toBe(false);
    });

    it('should return false for array', () => {
      expect(processor.isTimestamp([1, 2, 3])).toBe(false);
    });

    it('should return false for Date object', () => {
      expect(processor.isTimestamp(new Date())).toBe(false);
    });

    it('should return false for object with only _seconds', () => {
      expect(processor.isTimestamp({ _seconds: 1705329000 })).toBe(false);
    });

    it('should return false for object with only _nanoseconds', () => {
      expect(processor.isTimestamp({ _nanoseconds: 0 })).toBe(false);
    });

    it('should return false for object with wrong types', () => {
      expect(
        processor.isTimestamp({ _seconds: '1705329000', _nanoseconds: '0' })
      ).toBe(false);
    });
  });

  describe('processData', () => {
    it('should convert a single Timestamp field', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const data = {
        createdAt: createTimestamp(date),
        name: 'Test',
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toBe('2024-01-15T14:30:00Z');
        expect(result.value.name).toBe('Test');
      }
    });

    it('should convert multiple Timestamp fields', () => {
      const date1 = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const date2 = new Date(Date.UTC(2024, 0, 16, 10, 0, 0));
      const data = {
        createdAt: createTimestamp(date1),
        updatedAt: createTimestamp(date2),
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toBe('2024-01-15T14:30:00Z');
        expect(result.value.updatedAt).toBe('2024-01-16T10:00:00Z');
      }
    });

    it('should convert nested Timestamp fields', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const data = {
        user: {
          name: 'Test',
          profile: {
            createdAt: createTimestamp(date),
          },
        },
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.user.profile.createdAt).toBe('2024-01-15T14:30:00Z');
        expect(result.value.user.name).toBe('Test');
      }
    });

    it('should convert Timestamp fields in arrays', () => {
      const date1 = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const date2 = new Date(Date.UTC(2024, 0, 16, 10, 0, 0));
      const data = {
        events: [
          { timestamp: createTimestamp(date1), name: 'Event 1' },
          { timestamp: createTimestamp(date2), name: 'Event 2' },
        ],
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.events[0].timestamp).toBe('2024-01-15T14:30:00Z');
        expect(result.value.events[1].timestamp).toBe('2024-01-16T10:00:00Z');
        expect(result.value.events[0].name).toBe('Event 1');
      }
    });

    it('should convert direct Timestamp in array', () => {
      const date1 = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const date2 = new Date(Date.UTC(2024, 0, 16, 10, 0, 0));
      const data = {
        timestamps: [createTimestamp(date1), createTimestamp(date2)],
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.timestamps[0]).toBe('2024-01-15T14:30:00Z');
        expect(result.value.timestamps[1]).toBe('2024-01-16T10:00:00Z');
      }
    });

    it('should handle deeply nested structures', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                timestamp: createTimestamp(date),
              },
            },
          },
        },
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.level1.level2.level3.level4.timestamp).toBe(
          '2024-01-15T14:30:00Z'
        );
      }
    });

    it('should not modify original data (immutable)', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const timestamp = createTimestamp(date);
      const data = {
        createdAt: timestamp,
        name: 'Test',
      };

      processor.processData(data, defaultOptions);

      // Original data should be unchanged
      expect(data.createdAt).toBe(timestamp);
      expect(typeof data.createdAt._seconds).toBe('number');
    });

    it('should skip conversion when noDateFormat is true', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const timestamp = createTimestamp(date);
      const data = {
        createdAt: timestamp,
        name: 'Test',
      };

      const result = processor.processData(data, {
        ...defaultOptions,
        noDateFormat: true,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should return original data unchanged
        expect(result.value.createdAt).toBe(timestamp);
        expect(result.value.name).toBe('Test');
      }
    });

    it('should handle null values', () => {
      const data = {
        createdAt: null,
        name: 'Test',
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toBeNull();
        expect(result.value.name).toBe('Test');
      }
    });

    it('should handle undefined values', () => {
      const data = {
        createdAt: undefined,
        name: 'Test',
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toBeUndefined();
        expect(result.value.name).toBe('Test');
      }
    });

    it('should handle empty object', () => {
      const data = {};

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({});
      }
    });

    it('should handle empty array', () => {
      const data = { items: [] };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toEqual([]);
      }
    });

    it('should convert with specified timezone', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 5, 30, 0)); // 14:30 JST
      const data = {
        createdAt: createTimestamp(date),
      };

      const result = processor.processData(data, {
        ...defaultOptions,
        timezone: 'Asia/Tokyo',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toBe('2024-01-15T14:30:00+09:00');
      }
    });

    it('should handle mixed array with timestamps and other values', () => {
      const date = new Date(Date.UTC(2024, 0, 15, 14, 30, 0));
      const data = {
        items: [
          'string',
          123,
          createTimestamp(date),
          null,
          { nested: createTimestamp(date) },
        ],
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items[0]).toBe('string');
        expect(result.value.items[1]).toBe(123);
        expect(result.value.items[2]).toBe('2024-01-15T14:30:00Z');
        expect(result.value.items[3]).toBeNull();
        expect((result.value.items[4] as any).nested).toBe('2024-01-15T14:30:00Z');
      }
    });

    it('should handle Timestamp without toDate method', () => {
      const data = {
        createdAt: {
          _seconds: 1705329000, // 2024-01-15T14:30:00Z
          _nanoseconds: 0,
        },
      };

      const result = processor.processData(data, defaultOptions);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toBe('2024-01-15T14:30:00Z');
      }
    });
  });
});
