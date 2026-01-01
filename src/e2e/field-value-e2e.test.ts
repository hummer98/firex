/**
 * E2E tests for FieldValue support in CLI and MCP
 *
 * These tests require the Firestore emulator to be running.
 * Run: firebase emulators:start --only firestore
 * Or: docker-compose up -d
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeApp, deleteApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { FirestoreOps } from '../domain/firestore-ops';
import { FieldValueTransformer } from '../domain/field-value-transformer';

// Check if emulator is available
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const isEmulatorAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`http://${EMULATOR_HOST}/`);
    return response.ok || response.status === 200 || response.status === 404;
  } catch {
    return false;
  }
};

describe('FieldValue E2E Tests', () => {
  let app: App;
  let firestore: Firestore;
  let firestoreOps: FirestoreOps;
  let transformer: FieldValueTransformer;
  let emulatorAvailable: boolean;

  beforeAll(async () => {
    emulatorAvailable = await isEmulatorAvailable();
    if (!emulatorAvailable) {
      console.warn('Firestore Emulator not available. Skipping FieldValue E2E tests.');
      return;
    }

    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
    app = initializeApp({
      projectId: 'test-project-fieldvalue',
    }, 'fieldvalue-e2e-test');
    firestore = getFirestore(app);
    firestoreOps = new FirestoreOps(firestore);
    transformer = new FieldValueTransformer();
  });

  afterAll(async () => {
    if (app) {
      await deleteApp(app);
    }
  });

  beforeEach(async () => {
    if (!emulatorAvailable) return;

    // Clean up test collections
    const collections = ['fv_test_users', 'fv_test_posts', 'fv_test_carts'];
    for (const collectionPath of collections) {
      try {
        const docs = await firestore.collection(collectionPath).listDocuments();
        for (const doc of docs) {
          await doc.delete();
        }
      } catch {
        // Collection might not exist yet
      }
    }
  });

  describe('CLI set command with FieldValue', () => {
    it('should set document with serverTimestamp', async () => {
      if (!emulatorAvailable) return;

      const data = {
        name: 'Test User',
        createdAt: { $fieldValue: 'serverTimestamp' },
      };

      const transformResult = transformer.transform(data);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const path = 'fv_test_users/user1';
      const writeResult = await firestoreOps.setDocument(path, transformResult.value, false);
      expect(writeResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.name).toBe('Test User');
        expect(getResult.value.data.createdAt).toBeInstanceOf(Timestamp);
      }
    });

    it('should set document with increment', async () => {
      if (!emulatorAvailable) return;

      const data = {
        title: 'Test Post',
        viewCount: { $fieldValue: 'increment', operand: 1 },
      };

      const transformResult = transformer.transform(data);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const path = 'fv_test_posts/post1';
      const writeResult = await firestoreOps.setDocument(path, transformResult.value, false);
      expect(writeResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.title).toBe('Test Post');
        expect(getResult.value.data.viewCount).toBe(1);
      }
    });

    it('should set document with --merge and FieldValue', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_users/user2';
      await firestoreOps.setDocument(path, { name: 'Initial', age: 25 }, false);

      // Then merge with FieldValue
      const mergeData = {
        age: 26,
        updatedAt: { $fieldValue: 'serverTimestamp' },
      };

      const transformResult = transformer.transform(mergeData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const mergeResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(mergeResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.name).toBe('Initial');
        expect(getResult.value.data.age).toBe(26);
        expect(getResult.value.data.updatedAt).toBeInstanceOf(Timestamp);
      }
    });
  });

  describe('CLI update command with FieldValue', () => {
    it('should update with increment', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_posts/post2';
      await firestoreOps.setDocument(path, { title: 'Post', viewCount: 10 }, false);

      // Then update with increment
      const updateData = {
        viewCount: { $fieldValue: 'increment', operand: 5 },
      };

      const transformResult = transformer.transform(updateData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.viewCount).toBe(15);
      }
    });

    it('should update with negative increment (decrement)', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_carts/cart1';
      await firestoreOps.setDocument(path, { stock: 100 }, false);

      // Then decrement
      const updateData = {
        stock: { $fieldValue: 'increment', operand: -10 },
      };

      const transformResult = transformer.transform(updateData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.stock).toBe(90);
      }
    });

    it('should update with arrayUnion', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_users/user3';
      await firestoreOps.setDocument(path, { name: 'User', tags: ['initial'] }, false);

      // Then add to array
      const updateData = {
        tags: { $fieldValue: 'arrayUnion', elements: ['premium', 'verified'] },
      };

      const transformResult = transformer.transform(updateData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.tags).toContain('initial');
        expect(getResult.value.data.tags).toContain('premium');
        expect(getResult.value.data.tags).toContain('verified');
      }
    });

    it('should update with arrayRemove', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_users/user4';
      await firestoreOps.setDocument(path, { name: 'User', tags: ['trial', 'basic', 'premium'] }, false);

      // Then remove from array
      const updateData = {
        tags: { $fieldValue: 'arrayRemove', elements: ['trial'] },
      };

      const transformResult = transformer.transform(updateData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.tags).not.toContain('trial');
        expect(getResult.value.data.tags).toContain('basic');
        expect(getResult.value.data.tags).toContain('premium');
      }
    });

    it('should update with delete to remove field', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_users/user5';
      await firestoreOps.setDocument(path, {
        name: 'User',
        obsoleteField: 'to be deleted',
        keepField: 'keep this',
      }, false);

      // Then delete field
      const updateData = {
        obsoleteField: { $fieldValue: 'delete' },
      };

      const transformResult = transformer.transform(updateData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.obsoleteField).toBeUndefined();
        expect(getResult.value.data.keepField).toBe('keep this');
        expect(getResult.value.data.name).toBe('User');
      }
    });

    it('should update with multiple FieldValue operations', async () => {
      if (!emulatorAvailable) return;

      // First create a document
      const path = 'fv_test_posts/post3';
      await firestoreOps.setDocument(path, {
        title: 'Post',
        viewCount: 5,
        tags: ['draft'],
        oldField: 'old',
      }, false);

      // Then update with multiple FieldValues
      const updateData = {
        viewCount: { $fieldValue: 'increment', operand: 10 },
        tags: { $fieldValue: 'arrayUnion', elements: ['published'] },
        oldField: { $fieldValue: 'delete' },
        updatedAt: { $fieldValue: 'serverTimestamp' },
      };

      const transformResult = transformer.transform(updateData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify the document
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.viewCount).toBe(15);
        expect(getResult.value.data.tags).toContain('draft');
        expect(getResult.value.data.tags).toContain('published');
        expect(getResult.value.data.oldField).toBeUndefined();
        expect(getResult.value.data.updatedAt).toBeInstanceOf(Timestamp);
      }
    });
  });

  describe('MCP firestore_set with FieldValue', () => {
    it('should set document via MCP-like flow', async () => {
      if (!emulatorAvailable) return;

      // Simulate MCP tool data
      const mcpData = {
        title: 'MCP Created',
        createdAt: { $fieldValue: 'serverTimestamp' },
        initialViews: { $fieldValue: 'increment', operand: 0 },
      };

      const transformResult = transformer.transform(mcpData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const path = 'fv_test_posts/mcp1';
      const writeResult = await firestoreOps.setDocument(path, transformResult.value, false);
      expect(writeResult.isOk()).toBe(true);

      // Verify
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.title).toBe('MCP Created');
        expect(getResult.value.data.createdAt).toBeInstanceOf(Timestamp);
        expect(getResult.value.data.initialViews).toBe(0);
      }
    });

    it('should handle merge=true via MCP-like flow', async () => {
      if (!emulatorAvailable) return;

      // Create initial document
      const path = 'fv_test_posts/mcp2';
      await firestoreOps.setDocument(path, { title: 'Initial', views: 10 }, false);

      // Merge with MCP data
      const mcpData = {
        lastUpdated: { $fieldValue: 'serverTimestamp' },
        views: { $fieldValue: 'increment', operand: 1 },
      };

      const transformResult = transformer.transform(mcpData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const mergeResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(mergeResult.isOk()).toBe(true);

      // Verify
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.title).toBe('Initial');
        expect(getResult.value.data.views).toBe(11);
        expect(getResult.value.data.lastUpdated).toBeInstanceOf(Timestamp);
      }
    });
  });

  describe('MCP firestore_update with FieldValue', () => {
    it('should update document via MCP-like flow with increment', async () => {
      if (!emulatorAvailable) return;

      // Create initial document
      const path = 'fv_test_posts/mcp3';
      await firestoreOps.setDocument(path, { title: 'Post', likes: 5 }, false);

      // MCP update
      const mcpData = {
        likes: { $fieldValue: 'increment', operand: 1 },
      };

      const transformResult = transformer.transform(mcpData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.likes).toBe(6);
      }
    });

    it('should update document via MCP-like flow with arrayUnion', async () => {
      if (!emulatorAvailable) return;

      // Create initial document
      const path = 'fv_test_users/mcp4';
      await firestoreOps.setDocument(path, { name: 'User', roles: ['user'] }, false);

      // MCP update
      const mcpData = {
        roles: { $fieldValue: 'arrayUnion', elements: ['admin'] },
      };

      const transformResult = transformer.transform(mcpData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.roles).toContain('user');
        expect(getResult.value.data.roles).toContain('admin');
      }
    });

    it('should update document via MCP-like flow with delete', async () => {
      if (!emulatorAvailable) return;

      // Create initial document
      const path = 'fv_test_users/mcp5';
      await firestoreOps.setDocument(path, { name: 'User', tempField: 'temp' }, false);

      // MCP update
      const mcpData = {
        tempField: { $fieldValue: 'delete' },
      };

      const transformResult = transformer.transform(mcpData);
      expect(transformResult.isOk()).toBe(true);
      if (transformResult.isErr()) return;

      const updateResult = await firestoreOps.setDocument(path, transformResult.value, true);
      expect(updateResult.isOk()).toBe(true);

      // Verify
      const getResult = await firestoreOps.getDocument(path);
      expect(getResult.isOk()).toBe(true);
      if (getResult.isOk()) {
        expect(getResult.value.data.name).toBe('User');
        expect(getResult.value.data.tempField).toBeUndefined();
      }
    });
  });

  describe('Error handling in E2E scenarios', () => {
    it('should handle transform errors before write', async () => {
      if (!emulatorAvailable) return;

      const invalidData = {
        count: { $fieldValue: 'increment' } as any, // Missing operand
      };

      const transformResult = transformer.transform(invalidData);
      expect(transformResult.isErr()).toBe(true);
      if (transformResult.isErr()) {
        expect(transformResult.error.type).toBe('INVALID_OPERAND');
      }
    });

    it('should handle nested errors', async () => {
      if (!emulatorAvailable) return;

      const invalidData = {
        user: {
          stats: {
            count: { $fieldValue: 'arrayUnion' } as any, // Missing elements
          },
        },
      };

      const transformResult = transformer.transform(invalidData);
      expect(transformResult.isErr()).toBe(true);
      if (transformResult.isErr()) {
        expect(transformResult.error.fieldPath).toBe('user.stats.count');
      }
    });
  });
});
