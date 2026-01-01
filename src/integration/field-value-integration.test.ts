/**
 * Integration tests for FieldValue support in CLI commands and MCP tools
 *
 * These tests verify that the FieldValueTransformer is properly integrated
 * into the set/update commands and MCP tools.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FieldValueTransformer } from '../domain/field-value-transformer';
import { FieldValue } from 'firebase-admin/firestore';

describe('FieldValue Integration Tests', () => {
  describe('FieldValueTransformer with CLI-like data', () => {
    let transformer: FieldValueTransformer;

    beforeEach(() => {
      transformer = new FieldValueTransformer();
    });

    describe('set command scenarios', () => {
      it('should transform serverTimestamp for document creation', () => {
        const data = {
          name: 'Alice',
          age: 30,
          createdAt: { $fieldValue: 'serverTimestamp' },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.name).toBe('Alice');
          expect(result.value.age).toBe(30);
          expect(result.value.createdAt).toEqual(FieldValue.serverTimestamp());
        }
      });

      it('should transform increment for initial counter', () => {
        const data = {
          title: 'Test Post',
          viewCount: { $fieldValue: 'increment', operand: 1 },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.title).toBe('Test Post');
          expect(result.value.viewCount).toEqual(FieldValue.increment(1));
        }
      });

      it('should handle --from-file like data with nested $fieldValue', () => {
        // Simulating data loaded from a JSON file
        const fileData = {
          user: {
            name: 'Bob',
            metadata: {
              createdAt: { $fieldValue: 'serverTimestamp' },
              version: { $fieldValue: 'increment', operand: 1 },
            },
          },
          tags: ['initial'],
        };

        const result = transformer.transform(fileData);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const metadata = (result.value.user as Record<string, unknown>).metadata as Record<string, unknown>;
          expect(metadata.createdAt).toEqual(FieldValue.serverTimestamp());
          expect(metadata.version).toEqual(FieldValue.increment(1));
        }
      });

      it('should handle --merge with mixed fields', () => {
        const mergeData = {
          age: 31,
          updatedAt: { $fieldValue: 'serverTimestamp' },
        };

        const result = transformer.transform(mergeData);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.age).toBe(31);
          expect(result.value.updatedAt).toEqual(FieldValue.serverTimestamp());
        }
      });
    });

    describe('update command scenarios', () => {
      it('should transform increment for counter update', () => {
        const data = {
          viewCount: { $fieldValue: 'increment', operand: 1 },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.viewCount).toEqual(FieldValue.increment(1));
        }
      });

      it('should transform negative increment for decrement', () => {
        const data = {
          stock: { $fieldValue: 'increment', operand: -5 },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.stock).toEqual(FieldValue.increment(-5));
        }
      });

      it('should transform arrayUnion for adding elements', () => {
        const data = {
          tags: { $fieldValue: 'arrayUnion', elements: ['premium', 'verified'] },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.tags).toEqual(FieldValue.arrayUnion('premium', 'verified'));
        }
      });

      it('should transform arrayRemove for removing elements', () => {
        const data = {
          tags: { $fieldValue: 'arrayRemove', elements: ['trial'] },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.tags).toEqual(FieldValue.arrayRemove('trial'));
        }
      });

      it('should transform delete for field removal', () => {
        const data = {
          obsoleteField: { $fieldValue: 'delete' },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.obsoleteField).toEqual(FieldValue.delete());
        }
      });

      it('should handle multiple FieldValue operations in one update', () => {
        const data = {
          viewCount: { $fieldValue: 'increment', operand: 1 },
          tags: { $fieldValue: 'arrayUnion', elements: ['popular'] },
          oldField: { $fieldValue: 'delete' },
          updatedAt: { $fieldValue: 'serverTimestamp' },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.viewCount).toEqual(FieldValue.increment(1));
          expect(result.value.tags).toEqual(FieldValue.arrayUnion('popular'));
          expect(result.value.oldField).toEqual(FieldValue.delete());
          expect(result.value.updatedAt).toEqual(FieldValue.serverTimestamp());
        }
      });

      it('should handle --from-file with FieldValue in update', () => {
        const fileData = {
          'stats.views': { $fieldValue: 'increment', operand: 100 },
          'stats.updatedAt': { $fieldValue: 'serverTimestamp' },
        };

        const result = transformer.transform(fileData);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value['stats.views']).toEqual(FieldValue.increment(100));
          expect(result.value['stats.updatedAt']).toEqual(FieldValue.serverTimestamp());
        }
      });
    });

    describe('MCP firestore_set scenarios', () => {
      it('should transform data for MCP set tool', () => {
        const data = {
          title: 'MCP Created Document',
          createdAt: { $fieldValue: 'serverTimestamp' },
          initialCount: { $fieldValue: 'increment', operand: 0 },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.title).toBe('MCP Created Document');
          expect(result.value.createdAt).toEqual(FieldValue.serverTimestamp());
        }
      });

      it('should handle merge=true with FieldValue', () => {
        const mergeData = {
          lastModified: { $fieldValue: 'serverTimestamp' },
          newField: 'new value',
        };

        const result = transformer.transform(mergeData);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.lastModified).toEqual(FieldValue.serverTimestamp());
          expect(result.value.newField).toBe('new value');
        }
      });
    });

    describe('MCP firestore_update scenarios', () => {
      it('should transform increment for MCP update', () => {
        const data = {
          views: { $fieldValue: 'increment', operand: 1 },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.views).toEqual(FieldValue.increment(1));
        }
      });

      it('should transform arrayUnion for MCP update', () => {
        const data = {
          subscribers: { $fieldValue: 'arrayUnion', elements: ['user123'] },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.subscribers).toEqual(FieldValue.arrayUnion('user123'));
        }
      });

      it('should transform delete for MCP update', () => {
        const data = {
          deprecatedField: { $fieldValue: 'delete' },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.deprecatedField).toEqual(FieldValue.delete());
        }
      });
    });

    describe('error handling scenarios', () => {
      it('should return error for invalid increment operand in CLI data', () => {
        const data = {
          count: { $fieldValue: 'increment', operand: 'not-a-number' } as any,
        };

        const result = transformer.transform(data);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe('INVALID_OPERAND');
          expect(result.error.fieldPath).toBe('count');
        }
      });

      it('should return error for missing elements in arrayUnion', () => {
        const data = {
          tags: { $fieldValue: 'arrayUnion' } as any,
        };

        const result = transformer.transform(data);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe('INVALID_ELEMENTS');
        }
      });

      it('should return error with nested field path', () => {
        const data = {
          user: {
            settings: {
              count: { $fieldValue: 'increment' } as any,
            },
          },
        };

        const result = transformer.transform(data);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.fieldPath).toBe('user.settings.count');
        }
      });
    });

    describe('complex real-world scenarios', () => {
      it('should handle user activity update', () => {
        const data = {
          lastActive: { $fieldValue: 'serverTimestamp' },
          loginCount: { $fieldValue: 'increment', operand: 1 },
          recentActions: { $fieldValue: 'arrayUnion', elements: ['login'] },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.lastActive).toEqual(FieldValue.serverTimestamp());
          expect(result.value.loginCount).toEqual(FieldValue.increment(1));
          expect(result.value.recentActions).toEqual(FieldValue.arrayUnion('login'));
        }
      });

      it('should handle e-commerce cart update', () => {
        const data = {
          items: { $fieldValue: 'arrayUnion', elements: [{ productId: 'ABC123', qty: 2 }] },
          itemCount: { $fieldValue: 'increment', operand: 1 },
          lastModified: { $fieldValue: 'serverTimestamp' },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toEqual(FieldValue.arrayUnion({ productId: 'ABC123', qty: 2 }));
          expect(result.value.itemCount).toEqual(FieldValue.increment(1));
          expect(result.value.lastModified).toEqual(FieldValue.serverTimestamp());
        }
      });

      it('should handle blog post analytics', () => {
        const data = {
          'analytics.views': { $fieldValue: 'increment', operand: 1 },
          'analytics.lastViewed': { $fieldValue: 'serverTimestamp' },
          tags: { $fieldValue: 'arrayRemove', elements: ['draft'] },
        };

        const result = transformer.transform(data);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value['analytics.views']).toEqual(FieldValue.increment(1));
          expect(result.value['analytics.lastViewed']).toEqual(FieldValue.serverTimestamp());
          expect(result.value.tags).toEqual(FieldValue.arrayRemove('draft'));
        }
      });
    });
  });
});
