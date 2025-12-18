/**
 * Tests for firestore_export MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, CollectionReference, Query, QuerySnapshot, QueryDocumentSnapshot, DocumentReference } from 'firebase-admin/firestore';
import { registerExportTool } from './export.js';

describe('firestore_export tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockCollectionRef: Partial<CollectionReference>;
  let mockQuery: Partial<Query>;
  let registeredHandler: (params: {
    path: string;
    recursive?: boolean;
    limit?: number;
  }) => Promise<unknown>;

  beforeEach(() => {
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredHandler = handler;
        return {} as any;
      }),
    };

    const mockDocs: Partial<QueryDocumentSnapshot>[] = [
      {
        id: 'doc1',
        ref: {
          path: 'users/doc1',
          listCollections: vi.fn().mockResolvedValue([]),
        } as Partial<DocumentReference>,
        data: vi.fn().mockReturnValue({ name: 'User 1', email: 'user1@example.com' }),
      },
      {
        id: 'doc2',
        ref: {
          path: 'users/doc2',
          listCollections: vi.fn().mockResolvedValue([]),
        } as Partial<DocumentReference>,
        data: vi.fn().mockReturnValue({ name: 'User 2', email: 'user2@example.com' }),
      },
    ];

    const mockQuerySnapshot: Partial<QuerySnapshot> = {
      docs: mockDocs as QueryDocumentSnapshot[],
    };

    mockQuery = {
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    };

    mockCollectionRef = mockQuery as Partial<CollectionReference>;

    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollectionRef),
    };

    registerExportTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_export',
      expect.stringContaining('Export'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should export collection successfully', async () => {
    const result = await registeredHandler({ path: 'users' });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.collectionPath).toBe('users');
    expect(parsed.count).toBe(2);
    expect(parsed.documents).toHaveLength(2);
    expect(parsed.documents[0].id).toBe('doc1');
    expect(parsed.documents[0].data.name).toBe('User 1');
  });

  it('should apply limit when provided', async () => {
    await registeredHandler({ path: 'users', limit: 10 });

    expect(mockQuery.limit).toHaveBeenCalledWith(10);
  });

  it('should include subcollections info in response', async () => {
    const result = await registeredHandler({ path: 'users', recursive: true });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.includesSubcollections).toBe(true);
  });

  it('should handle Firestore errors', async () => {
    mockQuery.get = vi.fn().mockRejectedValue(new Error('Export failed'));

    const result = await registeredHandler({ path: 'users' });

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
