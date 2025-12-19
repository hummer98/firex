# Project Structure

## Directory Organization

```
src/
  commands/       # CLI commands (oclif)
  domain/         # Core business logic
  services/       # Application services
  presentation/   # Output formatting
  shared/         # Shared types and utilities
  mcp/            # MCP server and tools
  integration/    # Integration tests
  e2e/            # End-to-end tests
  performance/    # Performance tests
  security/       # Security tests
```

## Layer Architecture

### Commands Layer (`src/commands/`)
- Each command is a class extending `BaseCommand`
- Handles CLI argument parsing, flag processing
- Delegates to domain/service layers
- Pattern: `{command}.ts` with corresponding `{command}.test.ts`

### Domain Layer (`src/domain/`)
- Core business logic, no external dependencies
- `FirestoreOps`: Document CRUD operations
- `QueryBuilder`: Firestore query construction
- `BatchProcessor`: Batch import/export operations
- `WatchService`: Real-time document watching
- `ValidationService`: Input validation

### Services Layer (`src/services/`)
- Application infrastructure
- `ConfigService`: Configuration loading (cosmiconfig)
- `AuthService`: Firebase authentication
- `ErrorHandler`: Error classification and messaging
- `LoggingService`: Structured logging

### Presentation Layer (`src/presentation/`)
- Output formatting and user interaction
- `OutputFormatter`: JSON/YAML/table formatting
- `PromptService`: Interactive prompts (inquirer)
- `FilesystemService`: File I/O operations

### Shared Layer (`src/shared/`)
- Cross-cutting concerns
- `types.ts`: Type definitions, Result re-exports
- `i18n.ts`: Internationalization (Japanese messages)

### MCP Layer (`src/mcp/`)
- MCP server implementation
- `server.ts`: Server initialization and transport
- `tools/`: Individual MCP tool handlers

## Naming Conventions

### Files
- Kebab-case for files: `base-command.ts`, `firestore-ops.ts`
- Test files co-located: `{name}.test.ts`
- Index exports: `index.ts` for barrel exports

### Classes
- PascalCase: `BaseCommand`, `FirestoreOps`, `ConfigService`
- Suffix by layer: `*Service`, `*Ops`, `*Command`

### Types
- Exported types in `shared/types.ts`
- Error types as discriminated unions: `type ConfigError = | { type: 'FILE_NOT_FOUND' } | ...`

## Import Patterns

- Relative imports within layers: `./base-command`
- Cross-layer imports: `../domain/firestore-ops`
- Type imports: `import type { ... }`
- Shared types from: `../shared/types`

## Command Pattern

Commands follow consistent structure:
1. Extend `BaseCommand`
2. Define `description`, `examples`, `args`, `flags`
3. Override `run()` method
4. Initialize config/auth via base class methods
5. Delegate to domain services
6. Format output via presentation layer

Example structure:
```typescript
export class GetCommand extends BaseCommand {
  static override hidden = false;
  static override description = t('cmd.get.description');
  static override args = { ... };
  static override flags = { ...BaseCommand.baseFlags, ... };

  async run(): Promise<void> {
    // 1. Parse args/flags
    // 2. Initialize (config, auth)
    // 3. Execute domain operation
    // 4. Format and output result
  }
}
```
