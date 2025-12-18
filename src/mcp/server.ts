/**
 * MCP Server for firex
 *
 * Exposes Firestore operations as MCP tools for Claude Desktop integration.
 * Uses stdio transport for JSON-RPC 2.0 communication.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Firestore } from 'firebase-admin/firestore';
import { AuthService } from '../services/auth.js';
import { ConfigService } from '../services/config.js';
import { registerTools } from './tools/index.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

/**
 * Start the MCP Server
 */
export async function startMcpServer(): Promise<void> {
  // 1. Load configuration
  const configService = new ConfigService();
  const configResult = await configService.loadConfig();

  if (configResult.isErr()) {
    const error = configResult.error;
    let errorMessage: string;

    switch (error.type) {
      case 'FILE_NOT_FOUND':
        errorMessage = `Config file not found: ${error.path}`;
        break;
      case 'PARSE_ERROR':
        errorMessage = `Config parse error: ${error.message}`;
        break;
      case 'VALIDATION_ERROR':
        errorMessage = `Config validation error: ${error.message}`;
        break;
      default:
        errorMessage = `Configuration error`;
    }

    console.error(errorMessage);
    process.exit(1);
  }

  const config = configResult.value;

  // 2. Initialize Firebase authentication
  const authService = new AuthService();
  const authResult = await authService.initialize(config);

  if (authResult.isErr()) {
    const error = authResult.error;
    let message: string;

    switch (error.type) {
      case 'INVALID_CREDENTIALS':
        message = `Authentication failed: ${error.message}`;
        break;
      case 'CONNECTION_TIMEOUT':
        message = `Connection timeout: ${error.message}`;
        break;
      case 'PROJECT_NOT_FOUND':
        message = `Project not found: ${error.projectId}`;
        break;
      case 'PERMISSION_DENIED':
        message = `Permission denied: ${error.message}`;
        break;
      default:
        message = `Authentication error: ${(error as { message?: string }).message || 'Unknown error'}`;
    }

    console.error(message);
    process.exit(1);
  }

  const firestore: Firestore = authResult.value;

  // 3. Create MCP Server
  const server = new McpServer({
    name: 'firex',
    version: packageJson.version as string,
  });

  // 4. Register all tools
  registerTools(server, firestore);

  // 5. Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for JSON-RPC)
  console.error(`firex MCP Server v${packageJson.version} started`);
}
