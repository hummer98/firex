/**
 * MCP Server for firex
 *
 * Exposes Firestore operations as MCP tools for Claude Desktop integration.
 * Uses stdio transport for JSON-RPC 2.0 communication.
 *
 * Authentication is performed lazily on first tool call, not at startup.
 * This allows the server to start even without credentials, and supports
 * specifying projectId per-request.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FirestoreManager } from './firestore-manager.js';
import { registerTools } from './tools/index.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

/**
 * Options for starting the MCP Server
 */
export interface McpServerOptions {
  projectId?: string;
  credentialPath?: string;
}

/**
 * Start the MCP Server
 *
 * The server starts immediately without requiring authentication.
 * Authentication is performed lazily when tools are called.
 */
export async function startMcpServer(options: McpServerOptions = {}): Promise<void> {
  // 1. Create FirestoreManager with base configuration
  const firestoreManager = new FirestoreManager();
  await firestoreManager.initialize({
    projectId: options.projectId,
    credentialPath: options.credentialPath,
  });

  // 2. Create MCP Server
  const server = new McpServer({
    name: 'firex',
    version: packageJson.version as string,
  });

  // 3. Register all tools (they will use FirestoreManager for lazy auth)
  registerTools(server, firestoreManager);

  // 4. Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for JSON-RPC)
  console.error(`firex MCP Server v${packageJson.version} started`);
}
