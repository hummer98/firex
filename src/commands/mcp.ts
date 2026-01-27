/**
 * MCP Command - Start firex as an MCP Server
 *
 * This command starts firex in MCP (Model Context Protocol) Server mode,
 * allowing Claude Desktop and other MCP clients to interact with Firestore.
 */

import { Command, Flags } from '@oclif/core';
import { startMcpServer } from '../mcp/server.js';

export class McpCommand extends Command {
  static override description = 'Start MCP Server mode for Claude Desktop integration';

  static override examples = [
    {
      command: '<%= config.bin %> mcp',
      description: 'Start MCP Server using default credentials',
    },
    {
      command: '<%= config.bin %> mcp --project-id my-project',
      description: 'Start with specific project ID',
    },
    {
      command: '<%= config.bin %> mcp --credential-path /path/to/key.json',
      description: 'Start with service account key',
    },
  ];

  static override flags = {
    'project-id': Flags.string({
      description: 'Firebase project ID',
      env: 'FIRESTORE_PROJECT_ID',
    }),
    'credential-path': Flags.string({
      description: 'Path to service account key file',
      // Note: Don't use env: 'GOOGLE_APPLICATION_CREDENTIALS' here.
      // ADC is handled automatically by Firebase Admin SDK's applicationDefault().
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(McpCommand);

    // Note: All output must go to stderr in MCP mode
    // stdout is reserved for JSON-RPC communication
    await startMcpServer({
      projectId: flags['project-id'],
      credentialPath: flags['credential-path'],
    });
  }
}
