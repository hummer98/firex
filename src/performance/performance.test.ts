/**
 * Performance tests for firex CLI
 * Tests batch operations, query performance, and memory usage
 *
 * Run emulator: firebase emulators:start --only firestore
 * Or: docker-compose up -d
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeApp, deleteApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { BatchProcessor } from '../domain/batch-processor';
import { QueryBuilder } from '../domain/query-builder';
import { OutputFormatter } from '../presentation/output-formatter';
import { ToonEncoder } from '../presentation/toon-encoder';
import type { DocumentWithMeta } from '../shared/types';

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

// Helper to generate test documents
const generateTestDocuments = (count: number, collectionPath: string) => {
  return {
    documents: Array.from({ length: count }, (_, i) => ({
      id: `doc-${i.toString().padStart(6, '0')}`,
      path: `${collectionPath}/doc-${i.toString().padStart(6, '0')}`,
      data: {
        name: `Document ${i}`,
        index: i,
        category: `category-${i % 10}`,
        price: Math.random() * 1000,
        active: i % 2 === 0,
        tags: [`tag-${i % 5}`, `tag-${(i + 1) % 5}`],
        createdAt: new Date().toISOString(),
        metadata: {
          version: 1,
          lastUpdated: new Date().toISOString(),
        },
      },
    })),
  };
};

// Helper to measure execution time
const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, timeMs: end - start };
};

// Helper to get memory usage in MB
const getMemoryUsageMB = (): number => {
  const usage = process.memoryUsage();
  return usage.heapUsed / 1024 / 1024;
};

describe('Performance Tests', () => {
  let app: App;
  let firestore: Firestore;
  let testTempDir: string;

  beforeAll(async () => {
    const available = await isEmulatorAvailable();
    if (!available) {
      console.warn('Firestore Emulator is not available. Skipping performance tests.');
      return;
    }

    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;

    app = initializeApp(
      {
        projectId: 'test-project',
      },
      'perf-test'
    );

    firestore = getFirestore(app);
    testTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'firex-perf-'));
  });

  afterAll(async () => {
    if (app) {
      await deleteApp(app);
    }

    if (testTempDir) {
      await fs.rm(testTempDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    if (!firestore) return;

    // Clean up test collections
    const collections = await firestore.listCollections();
    for (const col of collections) {
      const docs = await col.listDocuments();
      for (const doc of docs) {
        await doc.delete();
      }
    }
  });

  describe('Batch Import Performance', () => {
    it('should import 5,000 documents at >500 docs/sec', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const DOC_COUNT = 5000;
      const MIN_RATE = 500; // documents per second

      // Generate test data
      const testData = generateTestDocuments(DOC_COUNT, 'perf-import');
      const importPath = path.join(testTempDir, 'large-import.json');
      await fs.writeFile(importPath, JSON.stringify(testData), 'utf-8');

      const processor = new BatchProcessor(firestore);

      let importedSoFar = 0;
      const { result, timeMs } = await measureTime(() =>
        processor.importData({
          inputPath: importPath,
          batchSize: 500,
          progressCallback: (current) => {
            importedSoFar = current;
          },
        })
      );

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.importedCount).toBe(DOC_COUNT);

        const timeSec = timeMs / 1000;
        const rate = DOC_COUNT / timeSec;

        console.log(`Import Performance:`);
        console.log(`  Documents: ${DOC_COUNT}`);
        console.log(`  Time: ${timeSec.toFixed(2)} seconds`);
        console.log(`  Rate: ${rate.toFixed(0)} docs/sec`);

        // Performance assertion
        expect(rate).toBeGreaterThan(MIN_RATE);
      }
    }, 120000); // 2 minute timeout

    it('should handle batch import with varying batch sizes', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const DOC_COUNT = 1000;
      const batchSizes = [100, 250, 500];
      const results: Array<{ batchSize: number; timeMs: number; rate: number }> = [];

      for (const batchSize of batchSizes) {
        // Clean up between tests
        const docs = await firestore.collection('batch-test').listDocuments();
        for (const doc of docs) {
          await doc.delete();
        }

        const testData = generateTestDocuments(DOC_COUNT, 'batch-test');
        const importPath = path.join(testTempDir, `import-${batchSize}.json`);
        await fs.writeFile(importPath, JSON.stringify(testData), 'utf-8');

        const processor = new BatchProcessor(firestore);

        const { result, timeMs } = await measureTime(() =>
          processor.importData({
            inputPath: importPath,
            batchSize,
          })
        );

        if (result.isOk()) {
          const rate = DOC_COUNT / (timeMs / 1000);
          results.push({ batchSize, timeMs, rate });
        }
      }

      console.log(`Batch Size Performance Comparison:`);
      results.forEach((r) => {
        console.log(`  Batch size ${r.batchSize}: ${r.rate.toFixed(0)} docs/sec`);
      });

      // All imports should complete successfully
      expect(results).toHaveLength(batchSizes.length);
    }, 180000); // 3 minute timeout
  });

  describe('Query Performance', () => {
    it('should execute compound queries in <2 seconds', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const DOC_COUNT = 1000;
      const MAX_QUERY_TIME_MS = 2000;

      // Setup test data
      const batch = firestore.batch();
      for (let i = 0; i < DOC_COUNT; i++) {
        const docRef = firestore.collection('query-perf').doc(`doc-${i}`);
        batch.set(docRef, {
          category: `cat-${i % 10}`,
          price: Math.random() * 1000,
          active: i % 2 === 0,
          name: `Product ${i}`,
        });
      }
      await batch.commit();

      const queryBuilder = new QueryBuilder(firestore);

      // Simple equality query
      const { result: result1, timeMs: time1 } = await measureTime(() =>
        queryBuilder.executeQuery('query-perf', {
          where: [{ field: 'category', operator: '==', value: 'cat-5' }],
        })
      );

      expect(result1.isOk()).toBe(true);
      expect(time1).toBeLessThan(MAX_QUERY_TIME_MS);

      // Compound query with sorting
      const { result: result2, timeMs: time2 } = await measureTime(() =>
        queryBuilder.executeQuery('query-perf', {
          where: [
            { field: 'category', operator: '==', value: 'cat-3' },
            { field: 'active', operator: '==', value: true },
          ],
          orderBy: [{ field: 'price', direction: 'desc' }],
          limit: 50,
        })
      );

      expect(result2.isOk()).toBe(true);
      expect(time2).toBeLessThan(MAX_QUERY_TIME_MS);

      console.log(`Query Performance:`);
      console.log(`  Simple query: ${time1.toFixed(0)}ms`);
      console.log(`  Compound query with sort: ${time2.toFixed(0)}ms`);
    }, 60000);

    it('should handle pagination efficiently', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const DOC_COUNT = 500;
      const PAGE_SIZE = 50;

      // Setup test data
      for (let i = 0; i < DOC_COUNT; i++) {
        await firestore.collection('paginate-perf').doc(`doc-${i.toString().padStart(4, '0')}`).set({
          index: i,
          name: `Item ${i}`,
        });
      }

      const queryBuilder = new QueryBuilder(firestore);
      const pageTimes: number[] = [];

      let cursor: unknown = undefined;
      let totalFetched = 0;

      while (totalFetched < DOC_COUNT) {
        const { result, timeMs } = await measureTime(() =>
          queryBuilder.executeQuery('paginate-perf', {
            orderBy: [{ field: 'index', direction: 'asc' }],
            limit: PAGE_SIZE,
            startAfter: cursor,
          })
        );

        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
          pageTimes.push(timeMs);
          totalFetched += result.value.documents.length;

          if (result.value.documents.length > 0) {
            cursor = result.value.documents[result.value.documents.length - 1].data.index;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      const avgPageTime = pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length;

      console.log(`Pagination Performance:`);
      console.log(`  Pages: ${pageTimes.length}`);
      console.log(`  Average page time: ${avgPageTime.toFixed(0)}ms`);
      console.log(`  Total documents: ${totalFetched}`);

      // Average page time should be reasonable
      expect(avgPageTime).toBeLessThan(500);
    }, 60000);
  });

  describe('Export Performance', () => {
    it('should export with subcollections, memory <1GB', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const DOC_COUNT = 100;
      const SUBCOL_COUNT = 10;
      const MAX_MEMORY_MB = 1024;

      // Setup test data with subcollections
      for (let i = 0; i < DOC_COUNT; i++) {
        const docRef = firestore.collection('export-perf').doc(`parent-${i}`);
        await docRef.set({
          name: `Parent ${i}`,
          data: Array(100).fill('x').join(''), // Some payload
        });

        // Add subcollection documents
        for (let j = 0; j < SUBCOL_COUNT; j++) {
          await docRef.collection('children').doc(`child-${j}`).set({
            name: `Child ${j}`,
            parentIndex: i,
          });
        }
      }

      const initialMemory = getMemoryUsageMB();
      const exportPath = path.join(testTempDir, 'export-perf.json');

      const processor = new BatchProcessor(firestore);

      const { result, timeMs } = await measureTime(() =>
        processor.exportCollection({
          collectionPath: 'export-perf',
          outputPath: exportPath,
          includeSubcollections: true,
        })
      );

      const finalMemory = getMemoryUsageMB();
      const memoryUsed = finalMemory - initialMemory;

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        console.log(`Export Performance:`);
        console.log(`  Documents: ${result.value.exportedCount}`);
        console.log(`  Time: ${(timeMs / 1000).toFixed(2)} seconds`);
        console.log(`  Memory used: ${memoryUsed.toFixed(2)} MB`);

        // Memory should stay under limit
        expect(finalMemory).toBeLessThan(MAX_MEMORY_MB);

        // Verify file size
        const stats = await fs.stat(exportPath);
        console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
      }
    }, 120000);
  });

  describe('Output Format Performance', () => {
    it('should produce smaller output with TOON for uniform arrays', () => {
      const outputFormatter = new OutputFormatter();

      // Generate uniform test documents (typical Firestore collection query result)
      const documents: DocumentWithMeta[] = Array.from({ length: 100 }, (_, i) => ({
        data: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50),
          city: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka'][i % 5],
          active: i % 2 === 0,
          score: Math.floor(Math.random() * 100),
        },
        metadata: {
          id: `user-${i.toString().padStart(4, '0')}`,
          path: `users/user-${i.toString().padStart(4, '0')}`,
        },
      }));

      // Format as JSON
      const jsonResult = outputFormatter.formatDocuments(documents, 'json');
      expect(jsonResult.isOk()).toBe(true);
      const jsonLength = jsonResult.isOk() ? jsonResult.value.length : 0;

      // Format as TOON
      const toonResult = outputFormatter.formatDocuments(documents, 'toon');
      expect(toonResult.isOk()).toBe(true);
      const toonLength = toonResult.isOk() ? toonResult.value.length : 0;

      // Calculate compression ratio
      const compressionRatio = ((jsonLength - toonLength) / jsonLength) * 100;

      console.log(`Output Format Size Comparison (100 uniform documents):`);
      console.log(`  JSON: ${jsonLength} bytes`);
      console.log(`  TOON: ${toonLength} bytes`);
      console.log(`  Savings: ${compressionRatio.toFixed(1)}%`);

      // TOON should be at least 20% smaller for uniform arrays
      expect(toonLength).toBeLessThan(jsonLength * 0.8);
    });

    it('should measure encoding time for TOON vs JSON', () => {
      // Generate test data
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        id: `doc-${i}`,
        name: `Document ${i}`,
        price: Math.random() * 1000,
        category: `cat-${i % 10}`,
        tags: [`tag-${i % 5}`, `tag-${(i + 1) % 5}`],
        metadata: {
          version: 1,
          createdAt: new Date().toISOString(),
        },
      }));

      // Measure JSON encoding
      const jsonStart = performance.now();
      const jsonResult = JSON.stringify(testData);
      const jsonTime = performance.now() - jsonStart;

      // Measure TOON encoding
      const toonEncoder = new ToonEncoder();
      const toonStart = performance.now();
      const toonResult = toonEncoder.encode(testData);
      const toonTime = performance.now() - toonStart;

      expect(toonResult.isOk()).toBe(true);

      console.log(`Encoding Time Comparison (1000 objects):`);
      console.log(`  JSON: ${jsonTime.toFixed(2)}ms`);
      console.log(`  TOON: ${toonTime.toFixed(2)}ms`);
      console.log(`  JSON size: ${jsonResult.length} bytes`);
      if (toonResult.isOk()) {
        console.log(`  TOON size: ${toonResult.value.length} bytes`);
        const savings = ((jsonResult.length - toonResult.value.length) / jsonResult.length) * 100;
        console.log(`  Size savings: ${savings.toFixed(1)}%`);
      }
    });

    it('should handle nested structures efficiently', () => {
      // Generate deeply nested test data
      const nestedData = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i}`,
        profile: {
          name: `User ${i}`,
          contact: {
            email: `user${i}@example.com`,
            phone: `+81-90-${i.toString().padStart(8, '0')}`,
          },
          address: {
            street: `Street ${i}`,
            city: 'Tokyo',
            country: 'Japan',
            postalCode: `100-${i.toString().padStart(4, '0')}`,
          },
        },
        settings: {
          notifications: {
            email: true,
            push: false,
            sms: i % 2 === 0,
          },
          privacy: {
            profileVisible: true,
            searchable: true,
          },
        },
      }));

      const outputFormatter = new OutputFormatter();
      const documents: DocumentWithMeta[] = nestedData.map((data, i) => ({
        data,
        metadata: { id: `user-${i}`, path: `users/user-${i}` },
      }));

      const jsonResult = outputFormatter.formatDocuments(documents, 'json');
      const toonResult = outputFormatter.formatDocuments(documents, 'toon');

      expect(jsonResult.isOk()).toBe(true);
      expect(toonResult.isOk()).toBe(true);

      if (jsonResult.isOk() && toonResult.isOk()) {
        console.log(`Nested Structure Size Comparison (50 documents):`);
        console.log(`  JSON: ${jsonResult.value.length} bytes`);
        console.log(`  TOON: ${toonResult.value.length} bytes`);
        const savings = ((jsonResult.value.length - toonResult.value.length) / jsonResult.value.length) * 100;
        console.log(`  Size savings: ${savings.toFixed(1)}%`);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent reads efficiently', async () => {
      const available = await isEmulatorAvailable();
      if (!available) return;

      const DOC_COUNT = 100;
      const CONCURRENT_READS = 50;

      // Setup test data
      for (let i = 0; i < DOC_COUNT; i++) {
        await firestore.collection('concurrent-perf').doc(`doc-${i}`).set({
          index: i,
          data: `Data for document ${i}`,
        });
      }

      // Concurrent reads
      const { result, timeMs } = await measureTime(async () => {
        const promises = Array.from({ length: CONCURRENT_READS }, (_, i) =>
          firestore
            .collection('concurrent-perf')
            .doc(`doc-${i % DOC_COUNT}`)
            .get()
        );
        return Promise.all(promises);
      });

      console.log(`Concurrent Read Performance:`);
      console.log(`  Concurrent reads: ${CONCURRENT_READS}`);
      console.log(`  Total time: ${timeMs.toFixed(0)}ms`);
      console.log(`  Average per read: ${(timeMs / CONCURRENT_READS).toFixed(1)}ms`);

      expect(result).toHaveLength(CONCURRENT_READS);
      // All reads should complete in reasonable time
      expect(timeMs).toBeLessThan(10000);
    }, 30000);
  });
});
