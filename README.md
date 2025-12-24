English | **[日本語](README-jp.md)**

![firex banner](.github/banner.png)

# firex

Firebase Firestore CLI tool for command-line operations.

`firex` is a powerful command-line interface tool for managing Firebase Firestore databases. It allows developers to perform CRUD operations, execute queries, and manage data efficiently without relying on the Firebase Console GUI. It also works as an **MCP (Model Context Protocol) server**, enabling AI assistants like Claude to interact with Firestore directly.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
- [Configuration File](#configuration-file)
- [Environment Variables](#environment-variables)
- [Timestamp Formatting](#timestamp-formatting)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [TOON Output Format](#toon-output-format)
- [MCP Server Integration](#mcp-server-integration)
- [Development](#development)
- [Requirements](#requirements)
- [License](#license)
- [Contributing](#contributing)

## Features

- **Document Operations**: Read, create, update, and delete Firestore documents
- **Collection Queries**: List documents with filtering, sorting, and pagination
- **Batch Operations**: Import and export collections to/from JSON files
- **Real-time Monitoring**: Watch documents and collections for changes with `--watch` flag
- **Multiple Output Formats**: JSON, YAML, table, and TOON format support
- **Timestamp Formatting**: Flexible timestamp display (ISO format) with timezone support (respects TZ env var)
- **Configuration Profiles**: Support for multiple project configurations
- **Type-safe**: Built with TypeScript for reliability

## Installation

```bash
# Using npx (recommended - no installation required)
npx @hummer98/firex [command]

# Global installation
npm install -g @hummer98/firex

# Or with pnpm
pnpm add -g @hummer98/firex
```

## Quick Start

### 1. Authentication Setup

firex uses Firebase Admin SDK for authentication. You have several options:

**Option A: Service Account Key (Recommended for production)**
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Or specify with flag
firex get users/user123 --credential-path=/path/to/service-account.json
```

**Option B: Application Default Credentials (ADC)**
```bash
# Login with gcloud
gcloud auth application-default login
```

**Option C: Firestore Emulator (for development)**
```bash
# Start the emulator
firebase emulators:start --only firestore

# Set environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

**Option D: Workload Identity Federation (CI/CD)**

For GitHub Actions and other CI/CD platforms, use keyless authentication.
See [CI/CD Integration Guide](docs/cicd.md) for setup instructions.

### 2. Configuration File (Optional)

Create a `.firex.yaml` file in your project root:

```yaml
# .firex.yaml
projectId: your-project-id
credentialPath: ./service-account.json
defaultListLimit: 100
watchShowInitial: true

# Multiple profiles
profiles:
  staging:
    projectId: your-staging-project
  production:
    projectId: your-production-project
```

### 3. Basic Usage

```bash
# Read a document
firex get users/user123

# List documents in a collection
firex list users

# Create/update a document
firex set users/user123 '{"name": "John", "email": "john@example.com"}'

# Delete a document
firex delete users/user123

# Query with filters
firex list users --where "status==active" --limit 10

# Watch for changes
firex get users/user123 --watch
```

## Command Reference

### get - Read Document

Read a single Firestore document.

```bash
firex get <document-path> [options]
```

**Options:**
- `--format, -f <format>`: Output format (json, yaml, table, toon). Default: json
- `--toon`: Output in TOON format (alias for --format=toon)
- `--watch, -w`: Watch document for real-time changes
- `--show-initial`: Show initial data in watch mode (default: true)
- `--timestamp-format <format>`: Timestamp display format (iso, none). Default: iso
- `--timezone <zone>`: Timezone for timestamp display (local, utc, or IANA timezone like Asia/Tokyo)
- `--project-id <id>`: Firebase project ID
- `--credential-path <path>`: Path to service account key file
- `--verbose, -v`: Enable verbose output

**Examples:**
```bash
# Read document in JSON format
firex get users/user123 --format json

# Read document in table format
firex get users/user123 --format table

# Read document in TOON format (token-efficient for LLMs)
firex get users/user123 --toon

# Watch document for changes
firex get users/user123 --watch

# Display timestamps in ISO format with Tokyo timezone
firex get users/user123 --timestamp-format iso --timezone Asia/Tokyo

# Disable timestamp formatting (show raw Firestore Timestamp)
firex get users/user123 --timestamp-format none
```

### list - List/Query Documents

List documents in a collection with optional filtering.

```bash
firex list <collection-path> [options]
```

**Options:**
- `--where, -W <condition>`: Filter condition (field==value). Can be specified multiple times
- `--order-by, -o <field>`: Field to sort by
- `--order-dir <direction>`: Sort direction (asc, desc). Default: asc
- `--limit, -l <number>`: Maximum documents to return. Default: 100
- `--format, -f <format>`: Output format (json, yaml, table, toon). Default: json
- `--toon`: Output in TOON format (alias for --format=toon)
- `--timestamp-format <format>`: Timestamp display format (iso, none). Default: iso
- `--timezone <zone>`: Timezone for timestamp display (local, utc, or IANA timezone like Asia/Tokyo)
- `--watch, -w`: Watch collection for real-time changes

**Examples:**
```bash
# List all users
firex list users

# List with filter
firex list users --where "status==active"

# List with multiple filters and sorting
firex list products --where "category==electronics" --where "price>100" --order-by price --order-dir desc

# Watch collection for changes
firex list orders --watch

# List in TOON format
firex list users --toon --limit 10

# List with ISO timestamps
firex list users --timestamp-format iso --timezone utc
```

### set - Create/Update Document

Create a new document or overwrite an existing one.

```bash
firex set <document-path> <data> [options]
```

**Options:**
- `--merge, -m`: Merge with existing data instead of overwriting
- `--from-file <path>`: Read data from JSON file

**Examples:**
```bash
# Create/overwrite document
firex set users/user123 '{"name": "John", "email": "john@example.com"}'

# Merge with existing data
firex set users/user123 '{"phone": "123-456-7890"}' --merge

# From file
firex set users/user123 --from-file user-data.json
```

### update - Partial Update

Update specific fields of an existing document (alias for `set --merge`).

```bash
firex update <document-path> <data> [options]
```

**Examples:**
```bash
# Update specific fields
firex update users/user123 '{"lastLogin": "2024-01-15"}'

# Update from file
firex update users/user123 --from-file updates.json
```

### delete - Delete Document/Collection

Delete a document or entire collection.

```bash
firex delete <path> [options]
```

**Options:**
- `--recursive, -r`: Delete collection and all documents recursively
- `--yes, -y`: Skip confirmation prompt

**Examples:**
```bash
# Delete single document
firex delete users/user123

# Delete with confirmation skip
firex delete users/user123 --yes

# Delete entire collection
firex delete users --recursive
```

### export - Export Collection

Export a collection to a JSON file.

```bash
firex export <collection-path> [options]
```

**Options:**
- `--output, -o <path>`: Output file path. Default: <collection>.json
- `--include-subcollections`: Include subcollections in export

**Examples:**
```bash
# Export collection
firex export users --output backup.json

# Export with subcollections
firex export users --output full-backup.json --include-subcollections
```

### import - Import Data

Import documents from a JSON file.

```bash
firex import <file-path> [options]
```

**Options:**
- `--batch-size <number>`: Batch size for imports. Default: 500 (Firestore maximum)

**Examples:**
```bash
# Import data
firex import backup.json

# Import with custom batch size
firex import large-dataset.json --batch-size 250
```

### config - Show Configuration

Display current configuration settings.

```bash
firex config [options]
```

**Options:**
- `--show`: Show current configuration values

**Examples:**
```bash
# Show configuration
firex config --show
```

### examples - Show Usage Examples

Display common usage examples.

```bash
firex examples
```

### doctor - Environment Diagnostics

Diagnose firex CLI environment and configuration. This command checks various aspects of your setup to ensure firex can operate correctly.

```bash
firex doctor [options]
```

**Options:**
- `--json`: Output diagnosis results in JSON format (for CI/CD integration)
- `--verbose, -v`: Show detailed execution logs for each check

**Diagnostic Checks:**

| Category | Check Item | Description |
|----------|------------|-------------|
| Environment | Node.js Version | Verifies Node.js 18.0.0 or later is installed |
| Environment | Firebase CLI | Checks if Firebase CLI is installed |
| Environment | Authentication | Verifies valid credentials (ADC or Service Account) |
| Firebase | .firebaserc | Checks for Firebase project configuration |
| Firebase | Firestore API | Verifies Firestore API is enabled |
| Firebase | Firestore Access | Tests read access to Firestore |
| Config | Config File | Validates .firex.yaml/.firex.json syntax and schema |
| Build | Build Status | Checks if source is newer than build (dev only) |
| Emulator | Connection | Tests emulator connection when FIRESTORE_EMULATOR_HOST is set |

**Examples:**
```bash
# Basic diagnostics
firex doctor

# Output in JSON format (useful for CI/CD)
firex doctor --json

# Show detailed logs
firex doctor --verbose
```

**Example Output:**
```
=== firex doctor ===

Node.js: v20.10.0
Platform: darwin

--- Checks ---
[OK] Node.js version 20.10.0 meets minimum requirement (18.0.0)
[OK] Firebase CLI installed (version 13.0.0)
[OK] Valid authentication found via ADC
[OK] .firebaserc found, default project: my-project
[OK] Firestore API is enabled
[OK] Firestore access confirmed
[OK] Config file valid: .firex.yaml
[OK] Build is up to date

--- Summary ---
環境は正常です
Total: 8 checks (8 passed, 0 warnings, 0 errors)
```

**Exit Codes:**
- `0`: All checks passed or only warnings present
- `1`: One or more errors detected

## Configuration File

firex looks for configuration files in the following order:

1. `.firex.yaml` / `.firex.yml` in current directory
2. `.firex.json` in current directory
3. `firex` key in `package.json`
4. Parent directories (up to project root)
5. Home directory (`~/.firex.yaml`)

### User Preferences (~/.firexrc)

For user-specific preferences like timestamp format, create a `~/.firexrc` file:

```yaml
# ~/.firexrc
timestampFormat: iso     # iso, none
timezone: Asia/Tokyo     # local, utc, or IANA timezone (respects TZ env var)
```

**Priority order**: CLI options > ~/.firexrc > default values

### Configuration Options

```yaml
# Project configuration
projectId: your-firebase-project-id
credentialPath: ./path/to/service-account.json
databaseURL: https://your-project.firebaseio.com

# Default settings
defaultListLimit: 100    # Default limit for list command
watchShowInitial: true   # Show initial data in watch mode

# Logging
verbose: false
logFile: ./firex.log

# Profile configurations
profiles:
  development:
    projectId: dev-project
    emulatorHost: localhost:8080
  staging:
    projectId: staging-project
  production:
    projectId: prod-project
    credentialPath: ./prod-service-account.json
```

### Using Profiles

```bash
# Use specific profile
firex list users --profile staging
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key file |
| `FIRESTORE_PROJECT_ID` | Firebase project ID |
| `FIRESTORE_EMULATOR_HOST` | Firestore emulator host (e.g., localhost:8080) |
| `FIRESTORE_DATABASE_URL` | Firestore database URL |
| `FIREX_DEFAULT_LIMIT` | Default limit for list command |
| `FIREX_WATCH_SHOW_INITIAL` | Show initial data in watch mode (true/false) |
| `FIREX_VERBOSE` | Enable verbose output (true/false) |
| `FIREX_LOG_FILE` | Path to log file |
| `FIREX_TIMESTAMP_FORMAT` | Default timestamp format (iso, none) |
| `FIREX_TIMEZONE` | Default timezone (local, utc, or IANA timezone) |
| `TZ` | Standard UNIX timezone (used when `FIREX_TIMEZONE` is not set) |

**Timezone Priority**: CLI option > `FIREX_TIMEZONE` > `TZ` > System detection

> **Note:** firex also respects the following [Firebase Admin SDK standard environment variables](https://firebase.google.com/docs/admin/setup):
> - `GOOGLE_CLOUD_PROJECT` - Project ID (used when `FIRESTORE_PROJECT_ID` is not set)
> - `FIREBASE_CONFIG` - Firebase configuration as JSON string or path to JSON file (auto-set in Cloud Functions and App Hosting environments)

## Timestamp Formatting

firex automatically converts Firestore Timestamp fields to human-readable formats. This section explains how the timestamp options affect output.

### Options Overview

| Option | CLI Flag | Description |
|--------|----------|-------------|
| **timezone** | `--timezone <zone>` | Timezone for display (default: system timezone) |
| **dateFormat** | `--date-format <pattern>` | date-fns format pattern (default: ISO 8601) |
| **rawOutput** | `--raw-output` | Disable all formatting, output raw Firestore data |
| **noDateFormat** | `--no-date-format` | Keep timestamps as raw objects |

### Priority Order

Options are resolved in this priority (highest to lowest):

1. **CLI flags** (`--timezone`, `--date-format`, etc.)
2. **Config file** (`~/.firexrc` or `.firex.yaml`)
3. **Environment variables** (`FIREX_TIMEZONE`, `TZ`)
4. **Default values** (system timezone, ISO 8601 format)

### Output Examples

Given a Firestore document with a timestamp field:
```javascript
// Firestore data (raw)
{
  name: "John",
  createdAt: Timestamp { _seconds: 1705312200, _nanoseconds: 0 }
  // Equivalent to: 2024-01-15T14:30:00+09:00 (JST) / 2024-01-15T05:30:00Z (UTC)
}
```

#### Default Output (ISO 8601 with system timezone)

```bash
firex get users/user123
```
```json
{
  "name": "John",
  "createdAt": "2024-01-15T14:30:00+09:00"
}
```
Timestamps are converted to ISO 8601 format in your system timezone.

#### With Specific Timezone

```bash
firex get users/user123 --timezone UTC
```
```json
{
  "name": "John",
  "createdAt": "2024-01-15T05:30:00Z"
}
```

```bash
firex get users/user123 --timezone America/New_York
```
```json
{
  "name": "John",
  "createdAt": "2024-01-15T00:30:00-05:00"
}
```

#### With Custom Date Format

```bash
firex get users/user123 --date-format "yyyy/MM/dd HH:mm:ss"
```
```json
{
  "name": "John",
  "createdAt": "2024/01/15 14:30:00"
}
```

```bash
firex get users/user123 --date-format "yyyy-MM-dd" --timezone UTC
```
```json
{
  "name": "John",
  "createdAt": "2024-01-15"
}
```

#### Raw Output (No Formatting)

```bash
firex get users/user123 --raw-output
```
```json
{
  "name": "John",
  "createdAt": {
    "_seconds": 1705312200,
    "_nanoseconds": 0
  }
}
```
All formatting is disabled. Timestamps remain as Firestore's internal representation.

#### Disable Only Timestamp Formatting

```bash
firex get users/user123 --no-date-format
```
```json
{
  "name": "John",
  "createdAt": {
    "_seconds": 1705312200,
    "_nanoseconds": 0
  }
}
```
Timestamps are kept raw, but other formatting (colors, etc.) is applied.

### Nested Timestamps

Timestamps in nested objects and arrays are also converted:

```bash
firex get orders/order123 --timezone UTC
```
```json
{
  "user": {
    "name": "John",
    "profile": {
      "createdAt": "2024-01-15T05:30:00Z"
    }
  },
  "events": [
    { "timestamp": "2024-01-15T14:30:00Z", "name": "Event 1" },
    { "timestamp": "2024-01-16T10:00:00Z", "name": "Event 2" }
  ]
}
```

### Common Date Format Patterns

| Pattern | Example Output |
|---------|----------------|
| `yyyy-MM-dd'T'HH:mm:ssXXX` | `2024-01-15T14:30:00+09:00` (default) |
| `yyyy-MM-dd` | `2024-01-15` |
| `yyyy/MM/dd HH:mm:ss` | `2024/01/15 14:30:00` |
| `dd/MM/yyyy` | `15/01/2024` |
| `HH:mm:ss` | `14:30:00` |
| `yyyy-MM-dd'T'HH:mm:ss.SSSXXX` | `2024-01-15T14:30:00.000+09:00` |

See [date-fns format documentation](https://date-fns.org/docs/format) for all available patterns.

## Troubleshooting

### Authentication Errors

**"INVALID_CREDENTIALS" error**
- Verify your service account key file path is correct
- Ensure the service account has necessary Firestore permissions
- Check file permissions (should be readable only by owner: `chmod 600`)

**"PROJECT_NOT_FOUND" error**
- Verify the project ID is correct
- Ensure Firestore is enabled in Firebase Console

**"PERMISSION_DENIED" error**
- Check Firestore Security Rules
- Verify service account has required IAM roles (Firebase Admin, Cloud Datastore User)

### Connection Issues

**"CONNECTION_TIMEOUT" error**
- Check network connectivity
- Verify firewall settings allow outbound HTTPS
- Try again - this error is often transient

**Emulator Connection Failed**
- Ensure emulator is running: `firebase emulators:start --only firestore`
- Check `FIRESTORE_EMULATOR_HOST` environment variable
- Verify emulator port is not in use

### Common Issues

**"INVALID_PATH" error**
- Document paths must have even segments (collection/doc)
- Collection paths must have odd segments (collection)
- Paths cannot start or end with `/`

**"VALIDATION_ERROR" for JSON data**
- Ensure JSON is valid (use a JSON validator)
- Firestore does not support `undefined`, functions, or symbols
- Nested objects must be plain objects

## Security Considerations

### Service Account Key Protection

- **Never commit** service account keys to version control
- Add to `.gitignore`:
  ```
  *-service-account.json
  service-account*.json
  *.pem
  ```
- Set file permissions to owner-only: `chmod 600 service-account.json`
- Use environment variables or secret managers in CI/CD

### Export File Security

- Exported data may contain sensitive information
- Store exports with restricted permissions
- Consider encrypting backups
- Delete temporary export files after use

### Logging

- firex automatically masks credentials in logs
- Avoid logging full document contents in production
- Review log files before sharing for debugging

## TOON Output Format

TOON (Token-Oriented Object Notation) is a compact, human-readable JSON-compatible format optimized for LLMs. It reduces token consumption by 40-60% compared to JSON while maintaining semantic equivalence.

### Why TOON?

- **Token Efficiency**: Reduces API costs when using AI assistants
- **Human Readable**: Still easy to read and understand
- **JSON Compatible**: Semantically equivalent to JSON data
- **Best for Uniform Data**: Maximum savings with document arrays having the same schema

### Usage

```bash
# Single document
firex get users/user123 --toon

# Multiple documents (achieves ~60% token reduction)
firex list users --toon --limit 100

# With metadata
firex get users/user123 --toon --include-metadata

# Collections
firex collections --toon
```

### Example Output

**JSON (143 bytes):**
```json
[{"name":"John","age":30,"email":"john@example.com"},{"name":"Jane","age":25,"email":"jane@example.com"}]
```

**TOON (48 bytes, 66% smaller):**
```
[2]{name,age,email}:
John,30,john@example.com
Jane,25,jane@example.com
```

For more information about TOON format, see the [TOON specification](https://github.com/toon-format/spec).

## MCP Server Integration

firex can run as an MCP (Model Context Protocol) server, enabling AI assistants like Claude to interact with Firestore directly.

### Setup with Claude Code

```bash
# Basic setup
claude mcp add firex -- npx @hummer98/firex mcp

# With project ID and credentials
claude mcp add firex \
  -e FIRESTORE_PROJECT_ID=your-project-id \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  -- npx @hummer98/firex mcp

# Multiple projects (register with different names)
claude mcp add firex-prod \
  -e FIRESTORE_PROJECT_ID=prod-project \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/prod-key.json \
  -- npx @hummer98/firex mcp

claude mcp add firex-dev \
  -e FIRESTORE_PROJECT_ID=dev-project \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/dev-key.json \
  -- npx @hummer98/firex mcp
```

### Setup with Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json` or `~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### MCP Tools Reference

| Tool | Description |
|------|-------------|
| `firestore_get` | Get a document by path |
| `firestore_list` | Query documents with filters, sorting, pagination |
| `firestore_set` | Create or update a document |
| `firestore_update` | Partially update an existing document |
| `firestore_delete` | Delete a document or collection |
| `firestore_collections` | List root collections or subcollections |
| `firestore_export` | Export collection documents as JSON |
| `firestore_import` | Import documents into a collection |

### Tool Parameters

#### firestore_get
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Document path (e.g., `users/user123`) |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

#### firestore_list
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Collection path (e.g., `users`) |
| `where` | array | No | Filter conditions: `[{field, operator, value}]` |
| `orderBy` | array | No | Sort order: `[{field, direction}]` |
| `limit` | number | No | Maximum documents to return |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

**Supported operators:** `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`, `array-contains-any`, `in`, `not-in`

#### firestore_set
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Document path (e.g., `users/user123`) |
| `data` | object | Yes | Document data to write |
| `merge` | boolean | No | Merge with existing data (default: false) |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

#### firestore_update
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Document path (must exist) |
| `data` | object | Yes | Fields to update (supports dot notation) |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

#### firestore_delete
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Document or collection path |
| `recursive` | boolean | No | Delete all documents in collection (default: false) |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

#### firestore_collections
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentPath` | string | No | Document path for subcollections. Omit for root collections. |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

#### firestore_export
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Collection path to export |
| `recursive` | boolean | No | Include subcollections (default: false) |
| `limit` | number | No | Maximum documents to export |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

#### firestore_import
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Collection path to import into |
| `documents` | array | Yes | Array of `{id?, data}` objects |
| `merge` | boolean | No | Merge with existing documents (default: false) |
| `format` | string | No | Output format: `json` or `toon` (default: `json`) |

### MCP Usage Examples

```
# Ask Claude to get a document
"Get the user document at users/user123"

# Query with filters
"List all users where status equals active, sorted by createdAt descending, limit 10"

# Create a document
"Create a new user at users/newuser with name 'John' and email 'john@example.com'"

# Delete a collection
"Delete all documents in the temp collection"

# Export data
"Export the orders collection including subcollections"
```

## Development

### Build

```bash
npm run build      # Production build
npm run dev        # Development mode (watch)
```

### Test

```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage
npm run typecheck           # TypeScript type check
```

### Project Structure

```
src/
├── shared/          # Shared types
├── services/        # Application Layer (Config, Auth, Logging)
├── domain/          # Domain Layer (FirestoreOps, QueryBuilder, etc.)
├── presentation/    # Output formatting, prompts
├── commands/        # CLI commands (get, set, list, etc.)
└── index.ts         # Entry point
```

## Requirements

- Node.js 18 or later
- Firebase project with Firestore enabled
- Service account with Firestore access (or ADC)

## License

MIT

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
