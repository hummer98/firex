# Product Context

## Overview

**firex** is a command-line interface tool for Firebase Firestore database operations. It enables developers to perform CRUD operations, execute queries, and manage data directly from the terminal without relying on the Firebase Console GUI.

## Core Value Proposition

- **Terminal-first Firestore management**: Replace GUI-based workflows with efficient CLI commands
- **AI integration via MCP**: Enable AI assistants (Claude) to interact directly with Firestore
- **Developer productivity**: Rapid prototyping, debugging, and data management from the command line

## Primary Users

1. **Developers** working with Firestore who prefer CLI workflows
2. **DevOps engineers** managing Firestore data in scripts and automation
3. **AI assistants** (via MCP) that need programmatic Firestore access

## Core Capabilities

### CLI Operations
- Document operations: `get`, `set`, `update`, `delete`
- Collection operations: `list`, `collections`
- Batch operations: `export`, `import`
- Real-time monitoring: `--watch` flag for live changes

### MCP Server
- Exposes Firestore operations as MCP tools
- Enables Claude Desktop/Claude Code integration
- Uses stdio transport for JSON-RPC 2.0 communication

## Key Design Principles

1. **Multiple output formats**: JSON (default), YAML, table format
2. **Configuration flexibility**: CLI flags > Environment variables > Config file > Defaults
3. **Profile support**: Multiple project configurations (dev, staging, production)
4. **Emulator support**: Seamless local development with Firestore emulator
5. **Type safety**: Built with TypeScript for reliability

## Package Distribution

- Published as `@hummer98/firex` on npm
- Supports `npx` for zero-install usage
- Global installation available via npm/pnpm
