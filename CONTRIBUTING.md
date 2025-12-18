# Contributing to firex

Thank you for your interest in contributing to firex! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or pnpm
- Firebase CLI (for emulator)
- Git

### Setup Development Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/firex.git
   cd firex
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Running Tests with Emulator

For integration and E2E tests, you need the Firestore emulator:

```bash
# Start emulator in one terminal
npm run emulator:start

# Run tests in another terminal
npm run test:integration
npm run test:e2e
```

## Development Workflow

### Branching Strategy

We use the following branch naming convention:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions/updates

### Creating a Branch

```bash
# Feature branch
git checkout -b feature/add-new-command

# Bug fix branch
git checkout -b fix/authentication-error

# Documentation
git checkout -b docs/update-readme
```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```bash
feat(commands): add export command with subcollection support
fix(auth): handle expired credentials gracefully
docs(readme): update installation instructions
test(integration): add batch import tests
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes following the coding standards
3. Write/update tests for your changes
4. Ensure all tests pass: `npm test`
5. Update documentation if needed
6. Submit a pull request to `develop`

#### PR Checklist

- [ ] Tests added/updated and passing
- [ ] TypeScript types are correct (`npm run typecheck`)
- [ ] Code follows existing style (`npm run lint`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits
- [ ] PR description explains the changes

## Coding Standards

### TypeScript

- Use TypeScript for all source files
- Enable strict mode
- Use explicit types (avoid `any`)
- Use `Result<T, E>` pattern for error handling (neverthrow)

### File Structure

```
src/
├── shared/          # Shared types and utilities
├── services/        # Application layer services
├── domain/          # Domain layer (business logic)
├── presentation/    # Output formatting, prompts
├── commands/        # CLI command implementations
├── integration/     # Integration tests
├── e2e/             # End-to-end tests
└── performance/     # Performance tests
```

### Error Handling

Use the Result pattern from neverthrow:

```typescript
import { Result, ok, err } from '../shared/types';

function doSomething(): Result<Data, Error> {
  if (success) {
    return ok(data);
  }
  return err({ type: 'ERROR_TYPE', message: 'Error message' });
}
```

### Testing

- Write tests using Vitest
- Follow TDD methodology when possible
- Test file naming: `*.test.ts`
- Place unit tests alongside source files
- Place integration tests in `src/integration/`
- Place E2E tests in `src/e2e/`

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Creating a Release

1. Ensure all tests pass
2. Update CHANGELOG.md
3. Bump version:
   ```bash
   npm run release:patch  # or release:minor, release:major
   ```
4. Push tags:
   ```bash
   git push --tags
   ```
5. Create GitHub release with release notes

### Publishing to npm

Releases are published automatically via GitHub Actions when a version tag is pushed.

## Getting Help

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
