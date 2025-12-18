/**
 * MCP Command - Start firex as an MCP Server
 *
 * This command starts firex in MCP (Model Context Protocol) Server mode,
 * allowing Claude Desktop and other MCP clients to interact with Firestore.
 */

import { Command } from '@oclif/core';
import { startMcpServer } from '../mcp/server.js';

export class McpCommand extends Command {
  static override description = 'Start MCP Server mode for Claude Desktop integration';

  static override examples = [
    {
      command: '<%= config.bin %> mcp',
      description: 'Start MCP Server using default credentials',
    },
    {
      command: 'GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json <%= config.bin %> mcp',
      description: 'Start with service account key',
    },
  ];

  static override flags = {};

  async run(): Promise<void> {
    // Note: All output must go to stderr in MCP mode
    // stdout is reserved for JSON-RPC communication
    await startMcpServer();
  }
}
