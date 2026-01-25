/**
 * MCP Tools registration
 *
 * Registers all Firestore operation tools with the MCP server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FirestoreManager } from '../firestore-manager.js';
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
export function registerTools(server: McpServer, firestoreManager: FirestoreManager): void {
  registerGetTool(server, firestoreManager);
  registerListTool(server, firestoreManager);
  registerSetTool(server, firestoreManager);
  registerUpdateTool(server, firestoreManager);
  registerDeleteTool(server, firestoreManager);
  registerCollectionsTool(server, firestoreManager);
  registerExportTool(server, firestoreManager);
  registerImportTool(server, firestoreManager);
}
