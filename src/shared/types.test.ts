import { describe, it, expect } from 'vitest';
import { ok, err, type DocumentWithMeta, type WhereCondition, type OutputFormat } from './types';

describe('Shared Types', () => {
  describe('Result types', () => {
    it('should create ok result', () => {
      const result = ok('success');
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    it('should create error result', () => {
      const result = err('error');
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('DocumentWithMeta', () => {
    it('should type check document with metadata', () => {
      const doc: DocumentWithMeta = {
        data: { name: 'test' },
        metadata: {
          id: 'doc1',
          path: 'users/doc1',
          createTime: new Date(),
          updateTime: new Date(),
        },
      };
      expect(doc.data).toEqual({ name: 'test' });
      expect(doc.metadata.id).toBe('doc1');
    });
  });

  describe('WhereCondition', () => {
    it('should type check where condition', () => {
      const condition: WhereCondition = {
        field: 'age',
        operator: '>=',
        value: 18,
      };
      expect(condition.field).toBe('age');
      expect(condition.operator).toBe('>=');
      expect(condition.value).toBe(18);
    });
  });

  describe('OutputFormat', () => {
    it('should include toon as a valid format', () => {
      const formats: OutputFormat[] = ['json', 'yaml', 'table', 'toon'];
      expect(formats).toContain('json');
      expect(formats).toContain('yaml');
      expect(formats).toContain('table');
      expect(formats).toContain('toon');
    });

    it('should allow toon as OutputFormat type', () => {
      const format: OutputFormat = 'toon';
      expect(format).toBe('toon');
    });
  });
});
