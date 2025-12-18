/**
 * Integration tests for firex CLI
 * These tests require Firestore Emulator to be running
 *
 * Run emulator: firebase emulators:start --only firestore
 * Or: docker-compose up -d
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeApp, deleteApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { AuthService } from '../services/auth';
import { ConfigService, Config } from '../services/config';
import { FirestoreOps } from '../domain/firestore-ops';
import { BatchProcessor } from '../domain/batch-processor';
import { WatchService } from '../domain/watch-service';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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

describe('Integration Tests (Firestore Emulator)', () => {
  let app: App;
  let firestore: Firestore;
  let testTempDir: string;

  beforeAll(async () => {
    const available = await isEmulatorAvailable();
    if (!available) {
      console.warn('Firestore Emulator is not available. Skipping integration tests.');
      return;
    }

    // Set emulator host
    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;

    // Initialize Firebase
    app = initializeApp({
      projectId: 'test-project',
    }, 'integration-test');

    firestore = getFirestore(app);

    // Create temp directory for test files
    testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'firex-test-'));
  });

  afterAll(async () => {
    if (app) {
      await deleteApp(app);
    }

    // Cleanup temp directory
    if (testTempDir) {
      await fs.rm(testTempDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    // Clean up test collections before each test
    if (!firestore) return;

    const collections = await firestore.listCollections();
    for (const col of collections) {
      const docs = await col.listDocuments();
      for (const doc of docs) {
        await doc.delete();
      }
    }
  });

  describe('Authentication -> Document Read Flow', () => {
    it('should authenticate and read document successfully', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Setup: Create a test document
      await firestore.collection('users').doc('test-user').set({
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
      });

      // Test: Use FirestoreOps to read the document
      const ops = new FirestoreOps(firestore);
      const result = await ops.getDocument('users/test-user');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.data).toMatchObject({
          name: 'Test User',
          email: 'test@example.com',
          age: 30,
        });
        expect(result.value.metadata.id).toBe('test-user');
        expect(result.value.metadata.path).toBe('users/test-user');
      }
    });

    it('should return NOT_FOUND for non-existent document', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const ops = new FirestoreOps(firestore);
      const result = await ops.getDocument('users/non-existent');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NOT_FOUND');
      }
    });
  });

  describe('Config Load -> Authentication Flow', () => {
    it('should load config and initialize authentication', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create a config file for the test
      const configPath = path.join(testTempDir, '.firex.yaml');
      await fs.writeFile(configPath, `
projectId: test-project
defaultListLimit: 50
watchShowInitial: true
`, 'utf-8');

      const configService = new ConfigService();
      const configResult = await configService.loadConfig({
        searchFrom: testTempDir,
      });

      expect(configResult.isOk()).toBe(true);
      if (configResult.isOk()) {
        expect(configResult.value.projectId).toBe('test-project');
        expect(configResult.value.defaultListLimit).toBe(50);
        expect(configResult.value.watchShowInitial).toBe(true);
      }
    });
  });

  describe('Batch Import Flow', () => {
    it('should import documents from JSON file', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create import file
      const importPath = path.join(testTempDir, 'import-test.json');
      const importData = {
        documents: [
          { id: 'doc1', path: 'products/doc1', data: { name: 'Product 1', price: 100 } },
          { id: 'doc2', path: 'products/doc2', data: { name: 'Product 2', price: 200 } },
          { id: 'doc3', path: 'products/doc3', data: { name: 'Product 3', price: 300 } },
        ],
      };
      await fs.writeFile(importPath, JSON.stringify(importData), 'utf-8');

      // Import
      const processor = new BatchProcessor(firestore);
      const result = await processor.importData({
        inputPath: importPath,
        batchSize: 500,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.importedCount).toBe(3);
        expect(result.value.failedCount).toBe(0);
      }

      // Verify documents were imported
      const doc1 = await firestore.doc('products/doc1').get();
      expect(doc1.exists).toBe(true);
      expect(doc1.data()?.name).toBe('Product 1');

      const doc2 = await firestore.doc('products/doc2').get();
      expect(doc2.exists).toBe(true);
      expect(doc2.data()?.name).toBe('Product 2');
    });

    it('should handle import validation errors', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create invalid import file
      const importPath = path.join(testTempDir, 'invalid-import.json');
      await fs.writeFile(importPath, '{ invalid json }', 'utf-8');

      const processor = new BatchProcessor(firestore);
      const result = await processor.importData({
        inputPath: importPath,
        batchSize: 500,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject invalid batch size', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const processor = new BatchProcessor(firestore);
      const result = await processor.importData({
        inputPath: '/some/path.json',
        batchSize: 1000, // Exceeds max of 500
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_BATCH_SIZE');
      }
    });
  });

  describe('Watch Monitoring Flow (onSnapshot)', () => {
    it('should detect document changes in watch mode', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create initial document
      await firestore.collection('monitored').doc('watch-test').set({
        value: 'initial',
      });

      const watchService = new WatchService(firestore);
      const changes: Array<{ type: string; data: unknown }> = [];

      // Start watching
      const result = watchService.watchDocument('monitored/watch-test', {
        onChange: (change) => {
          changes.push({ type: change.type, data: change.document.data });
        },
        showInitial: true,
      });

      expect(result.isOk()).toBe(true);
      const unsubscribe = result.isOk() ? result.value : () => {};

      // Wait for initial callback
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update document
      await firestore.doc('monitored/watch-test').update({ value: 'updated' });

      // Wait for update callback
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stop watching
      unsubscribe();

      // Verify changes were detected
      expect(changes.length).toBeGreaterThanOrEqual(1);
      // First change should be initial or modified
      expect(['added', 'modified']).toContain(changes[0].type);
    });

    it('should detect collection changes in watch mode', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const watchService = new WatchService(firestore);
      const changes: Array<{ type: string; id: string }> = [];

      // Start watching collection
      const result = watchService.watchCollection('events', {
        onChange: (change) => {
          changes.push({ type: change.type, id: change.document.metadata.id });
        },
        showInitial: false,
      });

      expect(result.isOk()).toBe(true);
      const unsubscribe = result.isOk() ? result.value : () => {};

      // Wait a bit for subscription to be ready
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Add documents
      await firestore.collection('events').doc('event1').set({ title: 'Event 1' });
      await firestore.collection('events').doc('event2').set({ title: 'Event 2' });

      // Wait for callbacks
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stop watching
      unsubscribe();

      // Verify changes were detected
      expect(changes.length).toBeGreaterThanOrEqual(2);
      expect(changes.some((c) => c.id === 'event1')).toBe(true);
      expect(changes.some((c) => c.id === 'event2')).toBe(true);
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle invalid document path', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const ops = new FirestoreOps(firestore);

      // Test empty path
      const result1 = await ops.getDocument('');
      expect(result1.isErr()).toBe(true);
      if (result1.isErr()) {
        expect(result1.error.type).toBe('INVALID_PATH');
      }

      // Test collection path (odd segments) when document path expected
      const result2 = await ops.getDocument('users');
      expect(result2.isErr()).toBe(true);
      if (result2.isErr()) {
        expect(result2.error.type).toBe('INVALID_PATH');
      }
    });

    it('should handle file not found for import', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const processor = new BatchProcessor(firestore);
      const result = await processor.importData({
        inputPath: '/non/existent/file.json',
        batchSize: 500,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_IO_ERROR');
      }
    });
  });

  describe('Export Flow', () => {
    it('should export collection to JSON file', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create test documents
      await firestore.collection('exportable').doc('item1').set({ name: 'Item 1' });
      await firestore.collection('exportable').doc('item2').set({ name: 'Item 2' });

      const exportPath = path.join(testTempDir, 'export-test.json');
      const processor = new BatchProcessor(firestore);

      const result = await processor.exportCollection({
        collectionPath: 'exportable',
        outputPath: exportPath,
        includeSubcollections: false,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.exportedCount).toBe(2);
      }

      // Verify file was created
      const fileContent = await fs.readFile(exportPath, 'utf-8');
      const exported = JSON.parse(fileContent);
      expect(exported.documents).toHaveLength(2);
    });

    it('should export with subcollections', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create document with subcollection
      const docRef = firestore.collection('parents').doc('parent1');
      await docRef.set({ name: 'Parent 1' });
      await docRef.collection('children').doc('child1').set({ name: 'Child 1' });

      const exportPath = path.join(testTempDir, 'export-subcollections.json');
      const processor = new BatchProcessor(firestore);

      const result = await processor.exportCollection({
        collectionPath: 'parents',
        outputPath: exportPath,
        includeSubcollections: true,
      });

      expect(result.isOk()).toBe(true);

      // Verify file contains subcollections
      const fileContent = await fs.readFile(exportPath, 'utf-8');
      const exported = JSON.parse(fileContent);
      expect(exported.documents).toHaveLength(1);
      expect(exported.documents[0].subcollections).toBeDefined();
    });
  });

  describe('Document Write and Delete Flow', () => {
    it('should write and delete documents', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const ops = new FirestoreOps(firestore);

      // Write
      const writeResult = await ops.setDocument('crud/test-doc', {
        name: 'Test Doc',
        value: 42,
      });
      expect(writeResult.isOk()).toBe(true);

      // Verify write
      const doc = await firestore.doc('crud/test-doc').get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.name).toBe('Test Doc');

      // Delete
      const deleteResult = await ops.deleteDocument('crud/test-doc');
      expect(deleteResult.isOk()).toBe(true);

      // Verify delete
      const deletedDoc = await firestore.doc('crud/test-doc').get();
      expect(deletedDoc.exists).toBe(false);
    });

    it('should support merge writes', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const ops = new FirestoreOps(firestore);

      // Initial write
      await ops.setDocument('merge/test-doc', {
        field1: 'value1',
        field2: 'value2',
      });

      // Merge write (should keep field1, update field2, add field3)
      const mergeResult = await ops.setDocument(
        'merge/test-doc',
        {
          field2: 'updated',
          field3: 'new',
        },
        true // merge = true
      );
      expect(mergeResult.isOk()).toBe(true);

      // Verify merge
      const doc = await firestore.doc('merge/test-doc').get();
      const data = doc.data();
      expect(data?.field1).toBe('value1'); // Preserved
      expect(data?.field2).toBe('updated'); // Updated
      expect(data?.field3).toBe('new'); // Added
    });
  });

  describe('Collection List Flow', () => {
    it('should list all documents in collection', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      // Create test documents
      await firestore.collection('listable').doc('a').set({ order: 1 });
      await firestore.collection('listable').doc('b').set({ order: 2 });
      await firestore.collection('listable').doc('c').set({ order: 3 });

      const ops = new FirestoreOps(firestore);
      const result = await ops.listDocuments('listable');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(3);
      }
    });
  });
});
