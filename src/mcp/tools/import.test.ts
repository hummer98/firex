/**
 * Tests for firestore_import MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, CollectionReference, DocumentReference, WriteBatch } from 'firebase-admin/firestore';
import { registerImportTool } from './import.js';

describe('firestore_import tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockCollectionRef: Partial<CollectionReference>;
  let mockDocRef: Partial<DocumentReference>;
  let mockBatch: Partial<WriteBatch>;
  let registeredHandler: (params: {
    path: string;
    documents: Array<{ id?: string; data: Record<string, unknown> }>;
    merge?: boolean;
  }) => Promise<unknown>;

  beforeEach(() => {
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredHandler = handler;
        return {} as any;
      }),
    };

    mockDocRef = {
      id: 'doc1',
    };

    mockCollectionRef = {
      doc: vi.fn().mockReturnValue(mockDocRef),
    };

    mockBatch = {
      set: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(undefined),
    };

    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollectionRef),
      batch: vi.fn().mockReturnValue(mockBatch),
    };

    registerImportTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_import',
      expect.stringContaining('Import'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should import documents successfully', async () => {
    const documents = [
      { id: 'user1', data: { name: 'User 1' } },
      { id: 'user2', data: { name: 'User 2' } },
    ];

    const result = await registeredHandler({ path: 'users', documents });

    expect(mockBatch.set).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalled();

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.collectionPath).toBe('users');
  });

  it('should use merge option when provided', async () => {
    const documents = [{ id: 'user1', data: { name: 'User 1' } }];

    await registeredHandler({ path: 'users', documents, merge: true });

    expect(mockBatch.set).toHaveBeenCalledWith(mockDocRef, { name: 'User 1' }, { merge: true });
  });

  it('should generate auto-id when document id not provided', async () => {
    const documents = [{ data: { name: 'User without ID' } }];

    await registeredHandler({ path: 'users', documents });

    expect(mockCollectionRef.doc).toHaveBeenCalled();
    expect(mockBatch.set).toHaveBeenCalled();
  });

  it('should handle batch commit errors', async () => {
    mockBatch.commit = vi.fn().mockRejectedValue(new Error('Batch failed'));

    const documents = [{ id: 'user1', data: { name: 'User 1' } }];
    const result = await registeredHandler({ path: 'users', documents });

    const response = result as { content: Array<{ text: string }>; isError?: boolean };

    expect(response.isError).toBe(true);
  });

  it('should handle empty documents array', async () => {
    const result = await registeredHandler({ path: 'users', documents: [] });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.imported).toBe(0);
  });
});
