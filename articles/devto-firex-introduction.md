---
title: "I Built 'firex' - A CLI Tool for Firestore Operations with AI Agent Integration"
published: false
description: "A CLI tool to interact with Firestore from your terminal. Also works as an MCP server for Claude Code, Gemini CLI, and other AI coding agents."
tags: firebase, firestore, cli, claude, mcp
cover_image: https://raw.githubusercontent.com/hummer98/firex/master/banner.png
---

## Introduction

Have you ever felt frustrated with Firestore and thought:

- "I just want to quickly check some data, but opening the console every time is tedious..."
- "I want to export production data to my local environment"
- "I need to query with multiple WHERE conditions, but the console has limitations"
- "I want Claude Code or Gemini CLI to directly operate Firestore"

To solve these problems, I created a CLI tool called **firex**.

{% github hummer98/firex %}

## What is firex?

It's a CLI tool that lets you perform CRUD operations on Firestore directly from your terminal.

Surprisingly, neither the `firebase` CLI nor the `gcloud` CLI provides commands to get or manipulate Firestore documents. firex fills this gap.

```bash
# Run instantly without installation
npx @hummer98/firex list users --where "status==active" --limit 10
```

Additionally, it works as an **MCP (Model Context Protocol) server**, allowing AI coding agents like Claude Code and Gemini CLI to directly operate Firestore.

## Key Features

### 1. Basic CRUD Operations

```bash
# Get a document
firex get users/user123

# List a collection
firex list users

# Create or update a document
firex set users/user123 '{"name": "John", "status": "active"}'

# Partial update
firex update users/user123 '{"lastLogin": "2024-12-20"}'

# Delete
firex delete users/user123
```

### 2. Complex Queries

You can perform queries with multiple conditions - something firebase-tools can't do:

```bash
# Multiple WHERE conditions + sort + limit
firex list products \
  --where "category==electronics" \
  --where "price>1000" \
  --order-by price --order-dir desc \
  --limit 20
```

### 3. Real-time Monitoring

Use the `--watch` flag to monitor document or collection changes in real-time:

```bash
# Watch document changes
firex get users/user123 --watch

# Watch collection changes
firex list orders --watch
```

This is useful for debugging during development or monitoring production environments.

### 4. Export & Import

```bash
# Export a collection to JSON
firex export users --output backup.json

# Export including subcollections
firex export users --output full-backup.json --include-subcollections

# Import
firex import backup.json
```

### 5. Multiple Project Support

Manage multiple environments with `.firex.yaml`:

```yaml
# .firex.yaml
projectId: dev-project
credentialPath: ./dev-service-account.json

profiles:
  staging:
    projectId: staging-project
  production:
    projectId: prod-project
    credentialPath: ./prod-service-account.json
```

```bash
# Check production data
firex list users --profile production
```

### 6. Output Format Options

Choose the output format based on your needs:

```bash
firex list users --format json   # JSON (default)
firex list users --format yaml   # YAML
firex list users --format table  # Human-readable table
firex list users --format toon   # Token-optimized (for AI agents)
```

### 7. Timestamp Display Formats (New in v0.6.0)

Format timestamps according to your preference:

```bash
firex list logs --timestamp-format iso       # 2024-12-22T10:30:00.000Z (default)
firex list logs --timestamp-format locale    # 12/22/2024, 10:30:00 AM
firex list logs --timestamp-format relative  # 2 hours ago
firex list logs --timestamp-format unix      # 1703241000
firex list logs --timestamp-format unix-ms   # 1703241000000
```

### 8. Environment Diagnostics (New in v0.5.0)

The `doctor` command helps diagnose your environment setup:

```bash
# Check your environment
firex doctor

# JSON output for CI/CD
firex doctor --json

# Verbose output for debugging
firex doctor --verbose
```

It checks:
- Node.js version (requires 18.0.0+)
- Firebase CLI installation
- Authentication (ADC or Service Account)
- Firestore API access
- Config file validation
- Emulator connection

## AI Coding Agent Integration (MCP Server)

The standout feature of firex is that it works as an **MCP server**.

### Why Do We Need an MCP Server?

Have you ever seen an AI coding agent try to access Firestore with commands like this?

```bash
# Non-existent command that AI tends to generate
gcloud firestore documents get projects/PROJECT_ID/databases/(default)/documents/users/user123
```

As mentioned earlier, CLI commands for Firestore operations don't exist, so AI generates fictional commands.

By registering firex as an MCP server, AI can use the correct tools to operate Firestore.

### What is MCP?

MCP (Model Context Protocol) is a protocol for AI to integrate with external tools. It was created by Anthropic and is now adopted by many AI coding agents including Claude Code, Gemini CLI, and VS Code (GitHub Copilot).

### Setup

#### For Claude Code

```bash
claude mcp add firex \
  -e FIRESTORE_PROJECT_ID=your-project-id \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  -- npx @hummer98/firex mcp
```

#### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "firex": {
      "command": "npx",
      "args": ["@hummer98/firex", "mcp"],
      "env": {
        "FIRESTORE_PROJECT_ID": "your-project-id",
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account.json"
      }
    }
  }
}
```

### Usage

After setup, just give natural language instructions to the AI:

```
"Get 10 users with status 'active' from the users collection"

"Update user123's lastLogin to today's date"

"Export the orders collection"
```

The AI will call the appropriate firex tools to operate Firestore.

### Available MCP Tools

| Tool Name | Description |
|-----------|-------------|
| `firestore_get` | Get a document |
| `firestore_list` | Query a collection |
| `firestore_set` | Create or update a document |
| `firestore_update` | Partial update |
| `firestore_delete` | Delete a document |
| `firestore_collections` | List collections |
| `firestore_export` | Export data |
| `firestore_import` | Import data |

## Comparison with Other Tools

In 2025, Google released the official [Firebase MCP Server](https://firebase.google.com/docs/ai-assistance/mcp-server). Here's how firex compares:

| Feature | firex | Firebase MCP Server |
|---------|-------|---------------------|
| Get document | Yes | Yes |
| Query (filter) | Yes | Yes |
| Create/Update document | Yes | Unknown |
| Delete document | Yes | Yes |
| Export/Import | Yes | No |
| Works as CLI | Yes | No (MCP only) |
| Real-time monitoring | Yes (`--watch`) | No |
| Timestamp formatting | Yes | No |
| Environment diagnostics | Yes (`doctor`) | No |
| Manage all Firebase | No | Yes (Auth, Storage, etc.) |

**When to use which**:
- **firex**: Specialized for Firestore data operations. Use when you also want a CLI, need export/import, or prefer detailed timestamp control
- **Firebase MCP**: Use when you want to manage all of Firebase (Auth, Storage, Hosting, etc.) with AI

## Quick Start

### 1. Authentication Setup

```bash
# Option A: Service account key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Option B: gcloud ADC
gcloud auth application-default login

# Option C: Emulator (for development)
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

### 2. Run

```bash
# Specify project ID
npx @hummer98/firex list users --project-id your-project-id

# Or set via environment variable
export FIRESTORE_PROJECT_ID=your-project-id
npx @hummer98/firex list users
```

## Use Cases

### Check and Debug Production Data

```bash
# Check a specific user's data
firex get users/problematic-user-id

# Check recently created documents
firex list logs --order-by createdAt --order-dir desc --limit 5
```

### Data Backup and Migration

```bash
# Export from production
firex export users --profile production --output users-backup.json

# Import to staging
firex import users-backup.json --profile staging
```

### Real-time Debugging During Development

```bash
# Monitor data changes while operating the frontend
firex list orders --watch
```

### Data Operations via AI Coding Agent

With Claude Code or Gemini CLI:

```
"Get orders from the past week and calculate the total amount"
"Update all orders with status='pending' to 'processing'"
```

## Installation

```bash
# Global installation
npm install -g @hummer98/firex

# Or run with npx (no installation needed)
npx @hummer98/firex [command]
```

## Conclusion

firex was born from my personal desire to "interact with Firestore from the terminal."

The MCP server feature is especially useful when developing Firebase projects with Claude Code or Gemini CLI. Just say "show me this data" or "update that field," and the AI handles it for you.

Feedback and feature requests are welcome on GitHub Issues and Discussions!

{% github hummer98/firex %}

---

**Related Links**
- [npm: @hummer98/firex](https://www.npmjs.com/package/@hummer98/firex)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Firebase MCP Server](https://firebase.google.com/docs/ai-assistance/mcp-server)
