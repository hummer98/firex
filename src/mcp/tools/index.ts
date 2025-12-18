/**
 * MCP Tools registration
 *
 * Registers all Firestore operation tools with the MCP server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Firestore } from 'firebase-admin/firestore';
import { registerGetTool } from './get.js';
import { registerListTool } from './list.js';
import { registerSetTool } from './set.js';
import { registerUpdateTool } from './update.js';
import { registerDeleteTool } from './delete.js';
import { registerCollectionsTool } from './collections.js';
import { registerExportTool } from './export.js';
import { registerImportTool } from './import.js';

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer, firestore: Firestore): void {
  registerGetTool(server, firestore);
  registerListTool(server, firestore);
  registerSetTool(server, firestore);
  registerUpdateTool(server, firestore);
  registerDeleteTool(server, firestore);
  registerCollectionsTool(server, firestore);
  registerExportTool(server, firestore);
  registerImportTool(server, firestore);
}
