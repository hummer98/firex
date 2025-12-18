/**
 * Tests for firestore_list MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, CollectionReference, Query, QuerySnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { registerListTool } from './list.js';

describe('firestore_list tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockCollectionRef: Partial<CollectionReference>;
  let mockQuery: Partial<Query>;
  let mockQuerySnapshot: Partial<QuerySnapshot>;
  let registeredHandler: (params: {
    path: string;
    where?: Array<{ field: string; operator: string; value: unknown }>;
    orderBy?: Array<{ field: string; direction: string }>;
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
        exists: true,
        id: 'doc1',
        ref: { path: 'users/doc1' } as any,
        data: vi.fn().mockReturnValue({ name: 'User 1' }),
        createTime: { toDate: () => new Date('2024-01-01') } as any,
        updateTime: { toDate: () => new Date('2024-01-02') } as any,
        readTime: { toDate: () => new Date('2024-01-03') } as any,
      },
      {
        exists: true,
        id: 'doc2',
        ref: { path: 'users/doc2' } as any,
        data: vi.fn().mockReturnValue({ name: 'User 2' }),
        createTime: { toDate: () => new Date('2024-01-01') } as any,
        updateTime: { toDate: () => new Date('2024-01-02') } as any,
        readTime: { toDate: () => new Date('2024-01-03') } as any,
      },
    ];

    mockQuerySnapshot = {
      docs: mockDocs as QueryDocumentSnapshot[],
    };

    mockQuery = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    };

    mockCollectionRef = {
      ...mockQuery,
    } as Partial<CollectionReference>;

    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollectionRef),
    };

    registerListTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_list',
      expect.stringContaining('Query documents'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should return documents list on success', async () => {
    const result = await registeredHandler({ path: 'users' });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.count).toBe(2);
    expect(parsed.documents).toHaveLength(2);
    expect(parsed.documents[0].data.name).toBe('User 1');
  });

  it('should include execution time in response', async () => {
    const result = await registeredHandler({ path: 'users' });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.executionTimeMs).toBeDefined();
    expect(typeof parsed.executionTimeMs).toBe('number');
  });

  it('should apply where filters', async () => {
    await registeredHandler({
      path: 'users',
      where: [{ field: 'status', operator: '==', value: 'active' }],
    });

    expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'active');
  });

  it('should apply orderBy', async () => {
    await registeredHandler({
      path: 'users',
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
  });

  it('should apply limit', async () => {
    await registeredHandler({
      path: 'users',
      limit: 10,
    });

    expect(mockQuery.limit).toHaveBeenCalledWith(10);
  });

  it('should handle Firestore errors', async () => {
    // Create a new mock that throws an error
    const errorMockQuery = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockRejectedValue(new Error('Query failed')),
    };

    mockFirestore.collection = vi.fn().mockReturnValue(errorMockQuery);

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

  it('should handle invalid operator', async () => {
    const result = await registeredHandler({
      path: 'users',
      where: [{ field: 'status', operator: 'INVALID' as any, value: 'active' }],
    });

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
