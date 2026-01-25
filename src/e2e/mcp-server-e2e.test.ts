/**
 * E2E tests for MCP Server startup
 *
 * Tests that the MCP server starts correctly and responds to JSONRPC messages.
 * These tests verify the CLI entry point works correctly with MCP protocol.
 *
 * No emulator required - these tests only verify server startup and protocol handling.
 */

import { describe, it, expect } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CLI_PATH = path.join(PROJECT_ROOT, 'bin/run.js');
const DIST_INDEX_PATH = path.join(PROJECT_ROOT, 'dist/index.js');

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Send a JSONRPC message to MCP server and get response
 */
const sendMcpMessage = (
  child: ChildProcess,
  message: JsonRpcRequest
): Promise<JsonRpcResponse> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('MCP server response timeout'));
    }, 5000);

    let buffer = '';

    const onData = (data: Buffer) => {
      buffer += data.toString();
      // Try to parse complete JSON response
      try {
        const response = JSON.parse(buffer);
        clearTimeout(timeout);
        child.stdout?.off('data', onData);
        resolve(response);
      } catch {
        // Incomplete JSON, wait for more data
      }
    };

    child.stdout?.on('data', onData);
    child.stdin?.write(JSON.stringify(message) + '\n');
  });
};

/**
 * Start MCP server process
 */
const startMcpServer = (): ChildProcess => {
  return spawn('node', [CLI_PATH, 'mcp'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // Don't require actual credentials for startup test
    },
  });
};

describe('MCP Server E2E', () => {
  describe('Server Startup', () => {
    it('should start and respond to initialize request', async () => {
      const child = startMcpServer();

      try {
        const initRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        };

        const response = await sendMcpMessage(child, initRequest);

        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBe(1);
        expect(response.error).toBeUndefined();
        expect(response.result).toBeDefined();

        const result = response.result as {
          protocolVersion: string;
          serverInfo: { name: string; version: string };
          capabilities: { tools?: { listChanged?: boolean } };
        };

        expect(result.protocolVersion).toBe('2024-11-05');
        expect(result.serverInfo.name).toBe('firex');
        expect(result.serverInfo.version).toBeDefined();
        expect(result.capabilities.tools).toBeDefined();
      } finally {
        child.kill();
      }
    });

    it('should list available tools after initialization', async () => {
      const child = startMcpServer();

      try {
        // First initialize
        const initRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        };
        await sendMcpMessage(child, initRequest);

        // Send initialized notification (required by MCP protocol)
        child.stdin?.write(
          JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'
        );

        // Then list tools
        const listToolsRequest: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
        };

        const response = await sendMcpMessage(child, listToolsRequest);

        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBe(2);
        expect(response.error).toBeUndefined();
        expect(response.result).toBeDefined();

        const result = response.result as { tools: Array<{ name: string }> };
        expect(Array.isArray(result.tools)).toBe(true);
        expect(result.tools.length).toBeGreaterThan(0);

        // Verify expected tools are present
        const toolNames = result.tools.map((t) => t.name);
        expect(toolNames).toContain('firestore_get');
        expect(toolNames).toContain('firestore_list');
        expect(toolNames).toContain('firestore_set');
        expect(toolNames).toContain('firestore_delete');
      } finally {
        child.kill();
      }
    });
  });

  describe('Entry Point Validation', () => {
    it('should work with bin/run.js entry point', async () => {
      const child = spawn('node', [CLI_PATH, 'mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      try {
        const response = await sendMcpMessage(child, {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        });

        expect(response.result).toBeDefined();
      } finally {
        child.kill();
      }
    });

    it('should NOT work with dist/index.js directly (regression test)', async () => {
      const distIndexPath = DIST_INDEX_PATH;
      const child = spawn('node', [distIndexPath, 'mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // dist/index.js doesn't call run() automatically, so it should exit immediately
      // or not respond to JSONRPC messages
      const exitPromise = new Promise<number>((resolve) => {
        child.on('close', (code) => resolve(code ?? 0));
      });

      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        setTimeout(() => resolve('timeout'), 1000);
      });

      // Send initialize request
      child.stdin?.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        }) + '\n'
      );
      child.stdin?.end();

      const result = await Promise.race([exitPromise, timeoutPromise]);

      // Either exits quickly or times out (no response) - both indicate dist/index.js
      // doesn't work as an MCP server entry point
      expect(['timeout', 0]).toContain(result);

      child.kill();
    });
  });
});
