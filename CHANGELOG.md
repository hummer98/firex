# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2025-12-19

### Fixed
- Read version dynamically from package.json instead of hardcoding

## [0.2.0] - 2025-12-19

### Added
- `collections` command for listing root collections and subcollections
- `--json`, `--yaml`, `--table` flags as aliases for `--format` option
- `--quiet` option for `get` and `list` commands to suppress headers

### Changed
- Package renamed to `@hummer98/firex` for npm publish

### Fixed
- Add `--run` flag to vitest for CI compatibility

## [0.1.1] - 2025-12-18

### Added
- Internationalization (i18n) support for CLI help and messages
- Locale detection based on LANG, LC_ALL, LC_MESSAGES environment variables
- Japanese translations for all commands, flags, and runtime messages
- English translations as default fallback

### Changed
- All command descriptions now use localized messages
- Examples command dynamically generates localized usage examples

## [0.1.0] - 2025-12-18

### Added
- Initial release of firex CLI
- **Document operations**
  - `get` - Retrieve and display Firestore documents
  - `set` - Create or overwrite documents with JSON data
  - `update` - Partial update documents (alias for `set --merge`)
  - `delete` - Delete documents with confirmation prompt
- **Collection operations**
  - `list` - List documents with query support (where, order-by, limit)
  - Recursive collection deletion with `--recursive` flag
- **Batch operations**
  - `export` - Export collections to JSON files
  - `import` - Import data from JSON files with batch processing
  - Subcollection support for export
  - Progress indicators for long-running operations
- **Real-time monitoring**
  - `--watch` flag for get and list commands
  - `--show-initial` flag to display initial data
- **Output formats**
  - JSON (default), YAML, and table formats
  - `--format` flag for all commands
- **Configuration**
  - Configuration file support (`.firex.yaml`, `firex.config.js`, etc.)
  - Profile support for multiple environments
  - CLI flags, environment variables, and config file precedence
- **Authentication**
  - Firebase Admin SDK authentication
  - Service account key file support
  - Application Default Credentials (ADC) support
  - Firestore Emulator support via `FIRESTORE_EMULATOR_HOST`
- **Developer experience**
  - oclif framework integration for CLI routing
  - `examples` command for usage reference
  - `config` command to display current settings
  - Comprehensive error messages with help suggestions

### Security
- Service account key path masking in logs
- API key and OAuth token masking
- Secure file permission recommendations

[Unreleased]: https://github.com/hummer98/firex/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/hummer98/firex/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/hummer98/firex/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/hummer98/firex/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/hummer98/firex/releases/tag/v0.1.0
