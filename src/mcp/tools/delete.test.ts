/**
 * Tests for firestore_delete MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, DocumentReference, CollectionReference, QuerySnapshot, WriteBatch } from 'firebase-admin/firestore';
import { registerDeleteTool } from './delete.js';

describe('firestore_delete tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockDocRef: Partial<DocumentReference>;
  let mockCollectionRef: Partial<CollectionReference>;
  let mockBatch: Partial<WriteBatch>;
  let registeredHandler: (params: { path: string; recursive?: boolean }) => Promise<unknown>;

  beforeEach(() => {
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredHandler = handler;
        return {} as any;
      }),
    };

    mockDocRef = {
      id: 'user123',
      path: 'users/user123',
      delete: vi.fn().mockResolvedValue(undefined),
      listCollections: vi.fn().mockResolvedValue([]),
    };

    mockBatch = {
      delete: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(undefined),
    };

    // Empty collection for recursive delete
    const emptySnapshot: Partial<QuerySnapshot> = {
      empty: true,
      docs: [],
      size: 0,
    };

    mockCollectionRef = {
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(emptySnapshot),
    };

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      collection: vi.fn().mockReturnValue(mockCollectionRef),
      batch: vi.fn().mockReturnValue(mockBatch),
    };

    registerDeleteTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_delete',
      expect.stringContaining('Delete'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should delete single document successfully', async () => {
    const result = await registeredHandler({ path: 'users/user123' });

    expect(mockDocRef.delete).toHaveBeenCalled();

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.type).toBe('document');
  });

  it('should require recursive flag for collection path', async () => {
    const result = await registeredHandler({ path: 'users' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('recursive=true'),
        },
      ],
      isError: true,
    });
  });

  it('should delete collection when recursive=true', async () => {
    const result = await registeredHandler({ path: 'users', recursive: true });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.type).toBe('collection');
    expect(parsed.deletedCount).toBeDefined();
  });

  it('should handle Firestore errors', async () => {
    mockDocRef.delete = vi.fn().mockRejectedValue(new Error('Delete failed'));

    const result = await registeredHandler({ path: 'users/user123' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Error:'),
        },
      ],
      isError: true,
    });
  });
});
