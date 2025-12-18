/**
 * Tests for firestore_collections MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, DocumentReference, DocumentSnapshot, CollectionReference } from 'firebase-admin/firestore';
import { registerCollectionsTool } from './collections.js';

describe('firestore_collections tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockDocRef: Partial<DocumentReference>;
  let mockDocSnapshot: Partial<DocumentSnapshot>;
  let registeredHandler: (params: { documentPath?: string }) => Promise<unknown>;

  beforeEach(() => {
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredHandler = handler;
        return {} as any;
      }),
    };

    const mockSubcollections: Partial<CollectionReference>[] = [
      { id: 'orders' } as Partial<CollectionReference>,
      { id: 'reviews' } as Partial<CollectionReference>,
    ];

    mockDocSnapshot = {
      exists: true,
    };

    mockDocRef = {
      get: vi.fn().mockResolvedValue(mockDocSnapshot),
      listCollections: vi.fn().mockResolvedValue(mockSubcollections),
    };

    const mockRootCollections: Partial<CollectionReference>[] = [
      { id: 'users' } as Partial<CollectionReference>,
      { id: 'products' } as Partial<CollectionReference>,
      { id: 'orders' } as Partial<CollectionReference>,
    ];

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      listCollections: vi.fn().mockResolvedValue(mockRootCollections),
    };

    registerCollectionsTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_collections',
      expect.stringContaining('List collections'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should list root collections when no path provided', async () => {
    const result = await registeredHandler({});

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.collections).toEqual(['users', 'products', 'orders']);
    expect(parsed.count).toBe(3);
  });

  it('should list subcollections when document path provided', async () => {
    const result = await registeredHandler({ documentPath: 'users/user123' });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.parentDocument).toBe('users/user123');
    expect(parsed.collections).toEqual(['orders', 'reviews']);
    expect(parsed.count).toBe(2);
  });

  it('should return error for non-existent document', async () => {
    mockDocSnapshot.exists = false;
    mockDocRef.get = vi.fn().mockResolvedValue(mockDocSnapshot);

    const result = await registeredHandler({ documentPath: 'users/nonexistent' });

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

  it('should handle Firestore errors', async () => {
    mockFirestore.listCollections = vi.fn().mockRejectedValue(new Error('List failed'));

    const result = await registeredHandler({});

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
