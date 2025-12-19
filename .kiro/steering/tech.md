# Technology Context

## Core Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Language | TypeScript 5.x | Strict mode enabled |
| Runtime | Node.js 18+ | ESM modules |
| CLI Framework | oclif | Command routing, flags, args |
| Firebase SDK | firebase-admin 13.x | Server-side Firestore access |
| MCP SDK | @modelcontextprotocol/sdk | AI assistant integration |

## Key Dependencies

### Production
- **oclif/core**: CLI framework for command structure
- **firebase-admin**: Firebase Admin SDK for Firestore operations
- **@modelcontextprotocol/sdk**: MCP server implementation
- **neverthrow**: Result type for functional error handling
- **cosmiconfig**: Configuration file discovery and loading
- **zod**: Runtime schema validation
- **inquirer/prompts**: Interactive CLI prompts
- **cli-table3**: Table output formatting
- **yaml**: YAML parsing and serialization

### Development
- **vitest**: Test runner
- **tsup**: TypeScript bundler
- **eslint**: Linting with TypeScript rules

## TypeScript Configuration

```
- Target: ES2022
- Module: ESNext (bundler resolution)
- Strict: All strict options enabled
- Output: dist/ with declarations and source maps
```

## Build System

- **tsup**: Fast TypeScript bundler for production builds
- **vitest**: Test execution with coverage support
- Entry point: `bin/run.js` (CLI), `src/index.ts` (library)

## Error Handling Pattern

Uses **neverthrow** Result types throughout:
```typescript
Result<T, E> = Ok<T> | Err<E>
```

All operations return typed Results instead of throwing exceptions, enabling:
- Explicit error handling at call sites
- Type-safe error discrimination
- Composable error flows

## Authentication Methods

1. Service Account Key (GOOGLE_APPLICATION_CREDENTIALS)
2. Application Default Credentials (gcloud ADC)
3. Firestore Emulator (FIRESTORE_EMULATOR_HOST)

## Configuration Hierarchy

Priority (highest to lowest):
1. CLI flags (`--project-id`, `--credential-path`)
2. Environment variables (`FIRESTORE_PROJECT_ID`, etc.)
3. Config file (`.firex.yaml`, `.firex.json`)
4. Default values

## Testing Strategy

| Level | Location | Purpose |
|-------|----------|---------|
| Unit | `src/**/*.test.ts` | Component isolation |
| Integration | `src/integration/` | Cross-component flows |
| E2E | `src/e2e/` | Full command execution |
| Performance | `src/performance/` | Benchmarking |

Tests require Firestore emulator: `FIRESTORE_EMULATOR_HOST=localhost:8080`
