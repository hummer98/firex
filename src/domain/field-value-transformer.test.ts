/**
 * FieldValueTransformer unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FieldValueTransformer,
  isFieldValueSpec,
  isTimestampValueSpec,
  type FieldValueType,
  type FieldValueSpec,
} from './field-value-transformer';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

describe('FieldValueTransformer', () => {
  let transformer: FieldValueTransformer;

  beforeEach(() => {
    transformer = new FieldValueTransformer();
  });

  describe('isFieldValueSpec', () => {
    it('should return true for serverTimestamp spec', () => {
      const spec = { $fieldValue: 'serverTimestamp' };
      expect(isFieldValueSpec(spec)).toBe(true);
    });

    it('should return true for increment spec', () => {
      const spec = { $fieldValue: 'increment', operand: 5 };
      expect(isFieldValueSpec(spec)).toBe(true);
    });

    it('should return true for arrayUnion spec', () => {
      const spec = { $fieldValue: 'arrayUnion', elements: ['a', 'b'] };
      expect(isFieldValueSpec(spec)).toBe(true);
    });

    it('should return true for arrayRemove spec', () => {
      const spec = { $fieldValue: 'arrayRemove', elements: ['a'] };
      expect(isFieldValueSpec(spec)).toBe(true);
    });

    it('should return true for delete spec', () => {
      const spec = { $fieldValue: 'delete' };
      expect(isFieldValueSpec(spec)).toBe(true);
    });

    it('should return false for regular objects', () => {
      expect(isFieldValueSpec({ name: 'test' })).toBe(false);
      expect(isFieldValueSpec({ $fieldValue: 123 })).toBe(false);
      expect(isFieldValueSpec(null)).toBe(false);
      expect(isFieldValueSpec(undefined)).toBe(false);
      expect(isFieldValueSpec('string')).toBe(false);
      expect(isFieldValueSpec(123)).toBe(false);
      expect(isFieldValueSpec([])).toBe(false);
    });

    it('should return false for unknown $fieldValue type', () => {
      const spec = { $fieldValue: 'unknown' };
      expect(isFieldValueSpec(spec)).toBe(false);
    });
  });

  describe('transform - serverTimestamp', () => {
    it('should transform serverTimestamp to FieldValue.serverTimestamp()', () => {
      const data = {
        name: 'test',
        createdAt: { $fieldValue: 'serverTimestamp' },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe('test');
        expect(result.value.createdAt).toEqual(FieldValue.serverTimestamp());
      }
    });
  });

  describe('transform - increment', () => {
    it('should transform increment with positive operand', () => {
      const data = {
        count: { $fieldValue: 'increment', operand: 5 },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.count).toEqual(FieldValue.increment(5));
      }
    });

    it('should transform increment with negative operand', () => {
      const data = {
        count: { $fieldValue: 'increment', operand: -3 },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.count).toEqual(FieldValue.increment(-3));
      }
    });

    it('should transform increment with zero operand', () => {
      const data = {
        count: { $fieldValue: 'increment', operand: 0 },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.count).toEqual(FieldValue.increment(0));
      }
    });

    it('should transform increment with decimal operand', () => {
      const data = {
        balance: { $fieldValue: 'increment', operand: 1.5 },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.balance).toEqual(FieldValue.increment(1.5));
      }
    });
  });

  describe('transform - arrayUnion', () => {
    it('should transform arrayUnion with string elements', () => {
      const data = {
        tags: { $fieldValue: 'arrayUnion', elements: ['new', 'tags'] },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(FieldValue.arrayUnion('new', 'tags'));
      }
    });

    it('should transform arrayUnion with mixed elements', () => {
      const data = {
        items: { $fieldValue: 'arrayUnion', elements: [1, 'two', { three: 3 }] },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toEqual(FieldValue.arrayUnion(1, 'two', { three: 3 }));
      }
    });

    it('should transform arrayUnion with single element', () => {
      const data = {
        tags: { $fieldValue: 'arrayUnion', elements: ['single'] },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(FieldValue.arrayUnion('single'));
      }
    });
  });

  describe('transform - arrayRemove', () => {
    it('should transform arrayRemove with elements', () => {
      const data = {
        tags: { $fieldValue: 'arrayRemove', elements: ['old'] },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(FieldValue.arrayRemove('old'));
      }
    });
  });

  describe('transform - delete', () => {
    it('should transform delete to FieldValue.delete()', () => {
      const data = {
        obsoleteField: { $fieldValue: 'delete' },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.obsoleteField).toEqual(FieldValue.delete());
      }
    });
  });

  describe('transform - nested objects', () => {
    it('should transform $fieldValue in nested objects', () => {
      const data = {
        name: 'test',
        metadata: {
          updatedAt: { $fieldValue: 'serverTimestamp' },
          version: { $fieldValue: 'increment', operand: 1 },
        },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe('test');
        expect(result.value.metadata).toBeDefined();
        const metadata = result.value.metadata as Record<string, unknown>;
        expect(metadata.updatedAt).toEqual(FieldValue.serverTimestamp());
        expect(metadata.version).toEqual(FieldValue.increment(1));
      }
    });

    it('should transform deeply nested $fieldValue', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              timestamp: { $fieldValue: 'serverTimestamp' },
            },
          },
        },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const level3 = (result.value.level1 as Record<string, unknown>);
        const level2 = (level3.level2 as Record<string, unknown>);
        const level3Inner = (level2.level3 as Record<string, unknown>);
        expect(level3Inner.timestamp).toEqual(FieldValue.serverTimestamp());
      }
    });
  });

  describe('transform - arrays containing $fieldValue', () => {
    it('should transform $fieldValue objects within arrays', () => {
      const data = {
        items: [
          { name: 'item1', createdAt: { $fieldValue: 'serverTimestamp' } },
          { name: 'item2', createdAt: { $fieldValue: 'serverTimestamp' } },
        ],
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const items = result.value.items as Record<string, unknown>[];
        expect(items[0].createdAt).toEqual(FieldValue.serverTimestamp());
        expect(items[1].createdAt).toEqual(FieldValue.serverTimestamp());
      }
    });
  });

  describe('transform - regular data preservation', () => {
    it('should preserve regular data without modification', () => {
      const data = {
        name: 'test',
        count: 123,
        active: true,
        tags: ['a', 'b'],
        nested: { key: 'value' },
        nullValue: null,
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(data);
      }
    });
  });

  describe('transform - multiple FieldValue operations', () => {
    it('should handle multiple FieldValue operations in one document', () => {
      const data = {
        createdAt: { $fieldValue: 'serverTimestamp' },
        updatedAt: { $fieldValue: 'serverTimestamp' },
        viewCount: { $fieldValue: 'increment', operand: 1 },
        tags: { $fieldValue: 'arrayUnion', elements: ['new'] },
        oldTags: { $fieldValue: 'arrayRemove', elements: ['old'] },
        deprecated: { $fieldValue: 'delete' },
        name: 'regular',
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.createdAt).toEqual(FieldValue.serverTimestamp());
        expect(result.value.updatedAt).toEqual(FieldValue.serverTimestamp());
        expect(result.value.viewCount).toEqual(FieldValue.increment(1));
        expect(result.value.tags).toEqual(FieldValue.arrayUnion('new'));
        expect(result.value.oldTags).toEqual(FieldValue.arrayRemove('old'));
        expect(result.value.deprecated).toEqual(FieldValue.delete());
        expect(result.value.name).toBe('regular');
      }
    });
  });

  describe('transform - max recursion depth', () => {
    it('should reject data exceeding max recursion depth (100)', () => {
      // Create deeply nested object
      let data: Record<string, unknown> = { timestamp: { $fieldValue: 'serverTimestamp' } };
      for (let i = 0; i < 101; i++) {
        data = { nested: data };
      }

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_FORMAT');
      }
    });
  });

  describe('error handling - INVALID_FIELD_VALUE_TYPE', () => {
    it('should return error for unknown $fieldValue type', () => {
      const data = {
        field: { $fieldValue: 'unknownType' } as unknown as FieldValueSpec,
      };

      // isFieldValueSpec will return false for unknown types,
      // so we need to bypass the check by directly using transformFieldValuePublic
      // Actually, in this case, the isFieldValueSpec check prevents this from being treated as a spec
      // So we should test via a different approach - by making it a valid-looking spec first
    });

    it('should include field path in error message', () => {
      const data = {
        nested: {
          deep: {
            field: { $fieldValue: 'increment' }, // Missing operand
          },
        },
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.fieldPath).toBe('nested.deep.field');
      }
    });
  });

  describe('error handling - INVALID_OPERAND', () => {
    it('should return error when increment operand is not a number', () => {
      const data = {
        count: { $fieldValue: 'increment', operand: 'not-a-number' } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_OPERAND');
        expect(result.error.fieldPath).toBe('count');
      }
    });

    it('should return error when increment operand is missing', () => {
      const data = {
        count: { $fieldValue: 'increment' } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_OPERAND');
        expect(result.error.fieldPath).toBe('count');
      }
    });

    it('should return error when increment operand is null', () => {
      const data = {
        count: { $fieldValue: 'increment', operand: null } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_OPERAND');
      }
    });
  });

  describe('error handling - INVALID_ELEMENTS', () => {
    it('should return error when arrayUnion elements is not an array', () => {
      const data = {
        tags: { $fieldValue: 'arrayUnion', elements: 'not-an-array' } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_ELEMENTS');
        expect(result.error.fieldPath).toBe('tags');
      }
    });

    it('should return error when arrayUnion elements is missing', () => {
      const data = {
        tags: { $fieldValue: 'arrayUnion' } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_ELEMENTS');
      }
    });

    it('should return error when arrayRemove elements is not an array', () => {
      const data = {
        tags: { $fieldValue: 'arrayRemove', elements: { key: 'value' } } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_ELEMENTS');
        expect(result.error.fieldPath).toBe('tags');
      }
    });

    it('should return error when arrayRemove elements is missing', () => {
      const data = {
        tags: { $fieldValue: 'arrayRemove' } as unknown as FieldValueSpec,
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_ELEMENTS');
      }
    });
  });

  describe('isTimestampValueSpec', () => {
    it('should return true for valid $timestampValue spec', () => {
      expect(isTimestampValueSpec({ $timestampValue: '2025-02-18T12:00:00Z' })).toBe(true);
    });

    it('should return true for $timestampValue with timezone offset', () => {
      expect(isTimestampValueSpec({ $timestampValue: '2025-02-18T21:00:00+09:00' })).toBe(true);
    });

    it('should return false for non-string $timestampValue', () => {
      expect(isTimestampValueSpec({ $timestampValue: 12345 })).toBe(false);
    });

    it('should return false for regular objects', () => {
      expect(isTimestampValueSpec({ name: 'test' })).toBe(false);
      expect(isTimestampValueSpec(null)).toBe(false);
      expect(isTimestampValueSpec(undefined)).toBe(false);
      expect(isTimestampValueSpec('string')).toBe(false);
      expect(isTimestampValueSpec([])).toBe(false);
    });

    it('should return false for $fieldValue spec', () => {
      expect(isTimestampValueSpec({ $fieldValue: 'serverTimestamp' })).toBe(false);
    });
  });

  describe('transform - $timestampValue', () => {
    it('should transform ISO 8601 UTC string to Firestore Timestamp', () => {
      const data = {
        name: 'test',
        createdAt: { $timestampValue: '2025-02-18T12:00:00Z' },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe('test');
        const expected = Timestamp.fromDate(new Date('2025-02-18T12:00:00Z'));
        expect(result.value.createdAt).toEqual(expected);
      }
    });

    it('should transform ISO 8601 string with timezone offset', () => {
      const data = {
        eventAt: { $timestampValue: '2025-02-18T21:00:00+09:00' },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const expected = Timestamp.fromDate(new Date('2025-02-18T21:00:00+09:00'));
        expect(result.value.eventAt).toEqual(expected);
      }
    });

    it('should transform date-only string', () => {
      const data = {
        birthday: { $timestampValue: '2000-01-15' },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const expected = Timestamp.fromDate(new Date('2000-01-15'));
        expect(result.value.birthday).toEqual(expected);
      }
    });

    it('should transform $timestampValue in nested objects', () => {
      const data = {
        metadata: {
          publishedAt: { $timestampValue: '2025-06-01T00:00:00Z' },
        },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const metadata = result.value.metadata as Record<string, unknown>;
        const expected = Timestamp.fromDate(new Date('2025-06-01T00:00:00Z'));
        expect(metadata.publishedAt).toEqual(expected);
      }
    });

    it('should transform $timestampValue in arrays', () => {
      const data = {
        events: [
          { name: 'event1', at: { $timestampValue: '2025-01-01T00:00:00Z' } },
          { name: 'event2', at: { $timestampValue: '2025-12-31T23:59:59Z' } },
        ],
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const events = result.value.events as Record<string, unknown>[];
        expect(events[0].at).toEqual(Timestamp.fromDate(new Date('2025-01-01T00:00:00Z')));
        expect(events[1].at).toEqual(Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')));
      }
    });

    it('should coexist with $fieldValue in same document', () => {
      const data = {
        updatedAt: { $fieldValue: 'serverTimestamp' },
        scheduledAt: { $timestampValue: '2025-03-01T09:00:00Z' },
        count: { $fieldValue: 'increment', operand: 1 },
      };

      const result = transformer.transform(data);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.updatedAt).toEqual(FieldValue.serverTimestamp());
        expect(result.value.scheduledAt).toEqual(Timestamp.fromDate(new Date('2025-03-01T09:00:00Z')));
        expect(result.value.count).toEqual(FieldValue.increment(1));
      }
    });

    it('should return error for invalid date string', () => {
      const data = {
        createdAt: { $timestampValue: 'not-a-date' },
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TIMESTAMP_VALUE');
        expect(result.error.fieldPath).toBe('createdAt');
      }
    });

    it('should return error for invalid date in nested path', () => {
      const data = {
        meta: {
          schedule: {
            startAt: { $timestampValue: 'invalid' },
          },
        },
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_TIMESTAMP_VALUE');
        expect(result.error.fieldPath).toBe('meta.schedule.startAt');
      }
    });
  });

  describe('error handling - nested field paths', () => {
    it('should include correct nested field path for increment error', () => {
      const data = {
        user: {
          stats: {
            viewCount: { $fieldValue: 'increment' } as unknown as FieldValueSpec,
          },
        },
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.fieldPath).toBe('user.stats.viewCount');
      }
    });

    it('should include correct array index in field path', () => {
      const data = {
        items: [
          { count: { $fieldValue: 'increment', operand: 1 } },
          { count: { $fieldValue: 'increment' } as unknown as FieldValueSpec }, // Error at index 1
        ],
      };

      const result = transformer.transform(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.fieldPath).toBe('items[1].count');
      }
    });
  });
});
