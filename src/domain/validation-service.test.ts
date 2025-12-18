/**
 * ValidationService unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from './validation-service';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateFirestoreData', () => {
    it('should pass validation for valid data', () => {
      const validData = {
        name: 'Test',
        age: 30,
        isActive: true,
        tags: ['tag1', 'tag2'],
        metadata: { created: new Date() },
      };

      const result = validationService.validateFirestoreData(validData);
      expect(result.isOk()).toBe(true);
    });

    it('should reject undefined values', () => {
      const invalidData = {
        name: 'Test',
        value: undefined,
      };

      const result = validationService.validateFirestoreData(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_DATA');
        expect(result.error.message).toContain('undefined');
      }
    });

    it('should reject function values', () => {
      const invalidData = {
        name: 'Test',
        callback: () => {},
      };

      const result = validationService.validateFirestoreData(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_DATA');
        expect(result.error.message).toContain('関数');
      }
    });

    it('should reject symbol values', () => {
      const invalidData = {
        name: 'Test',
        id: Symbol('test'),
      };

      const result = validationService.validateFirestoreData(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_DATA');
      }
    });

    it('should validate nested objects', () => {
      const invalidData = {
        name: 'Test',
        nested: {
          value: undefined,
        },
      };

      const result = validationService.validateFirestoreData(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toContain('nested');
      }
    });

    it('should validate arrays', () => {
      const invalidData = {
        name: 'Test',
        items: [1, 2, undefined, 4],
      };

      const result = validationService.validateFirestoreData(invalidData);
      expect(result.isErr()).toBe(true);
    });

    it('should accept null values', () => {
      const validData = {
        name: 'Test',
        optionalField: null,
      };

      const result = validationService.validateFirestoreData(validData);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('validateFirestorePath', () => {
    it('should validate correct document path', () => {
      const result = validationService.validateFirestorePath('users/user123');
      expect(result.isOk()).toBe(true);
    });

    it('should validate correct collection path', () => {
      const result = validationService.validateFirestorePath('users');
      expect(result.isOk()).toBe(true);
    });

    it('should validate nested paths', () => {
      const result = validationService.validateFirestorePath(
        'users/user123/posts/post456'
      );
      expect(result.isOk()).toBe(true);
    });

    it('should reject empty path', () => {
      const result = validationService.validateFirestorePath('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_PATH');
      }
    });

    it('should reject path starting with slash', () => {
      const result = validationService.validateFirestorePath('/users/user123');
      expect(result.isErr()).toBe(true);
    });

    it('should reject path ending with slash', () => {
      const result = validationService.validateFirestorePath('users/user123/');
      expect(result.isErr()).toBe(true);
    });

    it('should reject path with consecutive slashes', () => {
      const result = validationService.validateFirestorePath('users//user123');
      expect(result.isErr()).toBe(true);
    });

    it('should reject invalid characters', () => {
      const result = validationService.validateFirestorePath('users/user@123');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('validateImportFileStructure', () => {
    it('should validate correct import file structure', () => {
      const validStructure = {
        documents: [
          {
            id: 'doc1',
            path: 'users/doc1',
            data: { name: 'Test' },
          },
        ],
      };

      const result = validationService.validateImportFileStructure(validStructure);
      expect(result.isOk()).toBe(true);
    });

    it('should reject missing documents field', () => {
      const invalidStructure = {};

      const result = validationService.validateImportFileStructure(invalidStructure);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_STRUCTURE');
        expect(result.error.message).toContain('documents');
      }
    });

    it('should reject non-array documents field', () => {
      const invalidStructure = {
        documents: 'not-an-array',
      };

      const result = validationService.validateImportFileStructure(invalidStructure);
      expect(result.isErr()).toBe(true);
    });

    it('should reject documents with missing id', () => {
      const invalidStructure = {
        documents: [
          {
            path: 'users/doc1',
            data: { name: 'Test' },
          },
        ],
      };

      const result = validationService.validateImportFileStructure(invalidStructure);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.line).toBe(0);
      }
    });

    it('should reject documents with missing path', () => {
      const invalidStructure = {
        documents: [
          {
            id: 'doc1',
            data: { name: 'Test' },
          },
        ],
      };

      const result = validationService.validateImportFileStructure(invalidStructure);
      expect(result.isErr()).toBe(true);
    });

    it('should reject documents with missing data', () => {
      const invalidStructure = {
        documents: [
          {
            id: 'doc1',
            path: 'users/doc1',
          },
        ],
      };

      const result = validationService.validateImportFileStructure(invalidStructure);
      expect(result.isErr()).toBe(true);
    });

    it('should provide line number in error messages', () => {
      const invalidStructure = {
        documents: [
          { id: 'doc1', path: 'users/doc1', data: {} },
          { id: 'doc2', path: 'users/doc2', data: {} },
          { id: 'doc3', data: {} }, // Missing path at line 2
        ],
      };

      const result = validationService.validateImportFileStructure(invalidStructure);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.line).toBe(2);
      }
    });
  });

  describe('validateDocumentData', () => {
    it('should validate data against Firestore constraints', () => {
      const data = {
        name: 'Test',
        count: 123,
        active: true,
      };

      const result = validationService.validateDocumentData(data);
      expect(result.isOk()).toBe(true);
    });

    it('should provide detailed error messages', () => {
      const data = {
        name: 'Test',
        invalid: undefined,
      };

      const result = validationService.validateDocumentData(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBeTruthy();
        expect(result.error.field).toBe('invalid');
      }
    });
  });
});
