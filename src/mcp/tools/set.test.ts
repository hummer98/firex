/**
 * Tests for firestore_set MCP tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { registerSetTool } from './set.js';

describe('firestore_set tool', () => {
  let mockServer: Partial<McpServer>;
  let mockFirestore: Partial<Firestore>;
  let mockDocRef: Partial<DocumentReference>;
  let registeredHandler: (params: {
    path: string;
    data: Record<string, unknown>;
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
      id: 'user123',
      path: 'users/user123',
      set: vi.fn().mockResolvedValue(undefined),
    };

    mockFirestore = {
      doc: vi.fn().mockReturnValue(mockDocRef),
    };

    registerSetTool(mockServer as McpServer, mockFirestore as Firestore);
  });

  it('should register tool with correct name and description', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'firestore_set',
      expect.stringContaining('Create or update'),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should set document successfully', async () => {
    const data = { name: 'New User', email: 'new@example.com' };
    const result = await registeredHandler({ path: 'users/user123', data });

    expect(mockDocRef.set).toHaveBeenCalledWith(data, {});

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.operation).toBe('set');
  });

  it('should merge document when merge=true', async () => {
    const data = { name: 'Updated Name' };
    const result = await registeredHandler({ path: 'users/user123', data, merge: true });

    expect(mockDocRef.set).toHaveBeenCalledWith(data, { merge: true });

    const response = result as { content: Array<{ text: string }> };
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.operation).toBe('merged');
  });

  it('should return error for invalid path', async () => {
    const result = await registeredHandler({
      path: 'users', // Collection path, not document
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

  it('should handle Firestore errors', async () => {
    mockDocRef.set = vi.fn().mockRejectedValue(new Error('Write failed'));

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
