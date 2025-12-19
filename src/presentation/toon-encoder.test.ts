/**
 * ToonEncoder unit tests
 * TDD: Tests written before implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToonEncoder } from './toon-encoder';

describe('ToonEncoder', () => {
  let encoder: ToonEncoder;

  beforeEach(() => {
    encoder = new ToonEncoder();
  });

  describe('encode', () => {
    it('should encode simple object to TOON format', () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('string');
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should encode array of objects to TOON format', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('string');
      }
    });

    it('should encode primitive values', () => {
      expect(encoder.encode('hello').isOk()).toBe(true);
      expect(encoder.encode(42).isOk()).toBe(true);
      expect(encoder.encode(true).isOk()).toBe(true);
      expect(encoder.encode(null).isOk()).toBe(true);
    });

    it('should encode nested objects', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            address: {
              city: 'Tokyo',
              country: 'Japan',
            },
          },
        },
      };

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
    });

    it('should encode arrays with mixed types', () => {
      const data = [1, 'two', true, null, { nested: 'object' }];

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
    });

    it('should convert NaN to null', () => {
      const data = { value: NaN };

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // TOON should handle NaN by converting to null
        expect(result.value).not.toContain('NaN');
      }
    });

    it('should convert Infinity to null', () => {
      const data = { value: Infinity };

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // TOON should handle Infinity by converting to null
        expect(result.value).not.toContain('Infinity');
      }
    });

    it('should handle empty object', () => {
      const result = encoder.encode({});

      expect(result.isOk()).toBe(true);
    });

    it('should handle empty array', () => {
      const result = encoder.encode([]);

      expect(result.isOk()).toBe(true);
    });

    it('should return FormatError for circular references', () => {
      const data: any = { name: 'test' };
      data.circular = data;

      const result = encoder.encode(data);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FORMAT_ERROR');
        expect(result.error.message).toContain('TOON');
      }
    });

    it('should handle Date objects', () => {
      const data = {
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
    });

    it('should handle undefined values in objects', () => {
      const data = {
        defined: 'value',
        undefined: undefined,
      };

      const result = encoder.encode(data);

      expect(result.isOk()).toBe(true);
    });

    it('should produce shorter output than JSON for tabular data', () => {
      // This is a property of TOON - it should be more compact for uniform arrays
      const data = [
        { name: 'John', age: 30, city: 'Tokyo' },
        { name: 'Jane', age: 25, city: 'Osaka' },
        { name: 'Bob', age: 35, city: 'Kyoto' },
      ];

      const toonResult = encoder.encode(data);
      const jsonLength = JSON.stringify(data).length;

      expect(toonResult.isOk()).toBe(true);
      if (toonResult.isOk()) {
        // TOON should be more compact
        expect(toonResult.value.length).toBeLessThan(jsonLength);
      }
    });
  });
});
