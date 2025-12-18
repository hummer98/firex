/**
 * Tests for firestore_update MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import { registerUpdateTool } from './update.js';

describe('firestore_update tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockDocRef: Partial<DocumentReference>;
  let mockDocSnapshot: Partial<DocumentSnapshot>;
  let registeredHandler: (params: {
    path: string;
    data: Record<string, unknown>;
  }) => Promise<unknown>;

  beforeEach(() => {
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        registeredHandler = handler;
        return {} as any;
      }),
    };

    mockDocSnapshot = {
      exists: true,
    };

    mockDocRef = {
      id: 'user123',
      path: 'users/user123',
      get: vi.fn().mockResolvedValue(mockDocSnapshot),
      update: vi.fn().mockResolvedValue(undefined),
    };

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
    };

    registerUpdateTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_update',
      expect.stringContaining('Update specific fields'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should update document successfully', async () => {
    const data = { name: 'Updated Name', 'profile.bio': 'New bio' };
    const result = await registeredHandler({ path: 'users/user123', data });

    expect(mockDocRef.update).toHaveBeenCalledWith(data);

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.updatedFields).toContain('name');
    expect(parsed.updatedFields).toContain('profile.bio');
  });

  it('should return error for non-existent document', async () => {
    mockDocSnapshot.exists = false;
    mockDocRef.get = vi.fn().mockResolvedValue(mockDocSnapshot);

    const result = await registeredHandler({
      path: 'users/nonexistent',
      data: { name: 'Test' },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Document not found'),
        },
      ],
      isError: true,
    });
  });

  it('should handle Firestore errors', async () => {
    mockDocRef.update = vi.fn().mockRejectedValue(new Error('Update failed'));

    const result = await registeredHandler({
      path: 'users/user123',
      data: { name: 'Test' },
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
