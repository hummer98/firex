/**
 * Tests for firestore_get MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import { registerGetTool } from './get.js';

describe('firestore_get tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockDocRef: Partial<DocumentReference>;
  let mockDocSnapshot: Partial<DocumentSnapshot>;
  let registeredHandler: (params: { path: string }) => Promise<unknown>;

  beforeEach(() => {
    // Capture the tool handler when registered
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredHandler = handler;
        return {} as any;
      }),
    };

    mockDocRef = {
      id: 'user123',
      path: 'users/user123',
      get: vi.fn(),
    };

    mockDocSnapshot = {
      exists: true,
      id: 'user123',
      ref: mockDocRef as DocumentReference,
      data: vi.fn().mockReturnValue({ name: 'Test User', email: 'test@example.com' }),
      createTime: { toDate: () => new Date('2024-01-01T00:00:00Z') } as any,
      updateTime: { toDate: () => new Date('2024-01-02T00:00:00Z') } as any,
      readTime: { toDate: () => new Date('2024-01-03T00:00:00Z') } as any,
    };

    mockDocRef.get = vi.fn().mockResolvedValue(mockDocSnapshot);

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
    };

    registerGetTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_get',
      'Get a document from Firestore by its path',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should return document data on success', async () => {
    const result = await registeredHandler({ path: 'users/user123' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('"name": "Test User"'),
        },
      ],
    });
  });

  it('should include metadata in response', async () => {
    const result = await registeredHandler({ path: 'users/user123' });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.id).toBe('user123');
    expect(parsed.metadata.path).toBe('users/user123');
  });

  it('should return error for non-existent document', async () => {
    mockDocSnapshot.exists = false;
    mockDocRef.get = vi.fn().mockResolvedValue(mockDocSnapshot);

    const result = await registeredHandler({ path: 'users/nonexistent' });

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

  it('should return error for invalid path', async () => {
    const result = await registeredHandler({ path: 'users' }); // Collection path, not document

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
    mockDocRef.get = vi.fn().mockRejectedValue(new Error('Permission denied'));

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
