# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.7] - 2026-02-25

### Changed
- MCPサーバーのFirebase Appをプロジェクト別にプーリングするように改善
  - 従来は単一インスタンスのみキャッシュし、プロジェクト切り替え時に毎回再初期化が発生していた
  - 一度接続したプロジェクトのインスタンスを保持し、切り替え時の再初期化コストを削減

## [0.7.6] - 2026-02-18

### Added
- **`$timestampValue` syntax support** in set/update commands and MCP tools
  - ISO 8601文字列を指定してFirestore Timestampとして保存可能
  - Example: `firex set events/event1 '{"startAt": {"$timestampValue": "2025-06-01T09:00:00Z"}}'`
  - タイムゾーンオフセット付きISO文字列にも対応（例: `2025-02-18T21:00:00+09:00`）
  - 既存の`$fieldValue`構文（serverTimestamp等）と併用可能
  - ネストされたオブジェクト・配列内でも使用可能
  - 無効な日時文字列に対するバリデーションとエラーメッセージ（日英対応）

### Fixed
- MCP E2Eテストの並行実行時タイムアウトを修正

## [0.7.5] - 2026-02-13

### Fixed
- MCPサーバーでFirebase初期化後の接続検証失敗時に`[DEFAULT]`アプリが残存し、以降のリトライがすべて失敗するバグを修正

## [0.7.4] - 2026-01-27

### Fixed
- `--credential-path`フラグが`GOOGLE_APPLICATION_CREDENTIALS`環境変数を誤って読み込んでいた問題を修正

## [0.7.3] - 2026-01-27

### Fixed
- `GOOGLE_APPLICATION_CREDENTIALS`がADCユーザークレデンシャル（`authorized_user`タイプ）を指している場合に認証エラーになる問題を修正

## [0.7.2] - 2026-01-26

### Fixed
- MCP設定のエントリーポイントを`bin/run.js`に修正

### Changed
- MCPサーバーをリクエスト時認証に変更（起動時認証から変更）

## [0.7.1] - 2026-01-21

### Fixed
- `doctor` command `--project-id` option not working correctly

## [0.7.0] - 2026-01-02

### Added
- **FieldValue syntax support** in set/update commands
  - `serverTimestamp`: Server-side timestamp
  - `increment`: Atomic increment/decrement
  - `arrayUnion`: Add elements to array (duplicates ignored)
  - `arrayRemove`: Remove elements from array
  - `delete`: Delete a field from document
  - Example: `firex set users/user1 '{"createdAt": {"$fieldValue": "serverTimestamp"}}'`
  - Example: `firex update posts/post1 '{"viewCount": {"$fieldValue": "increment", "operand": 1}}'`

### Changed
- **Full i18n coverage** for error messages and diagnostics
  - Error handler messages (auth, config, firestore, validation)
  - Doctor service progress messages
  - Checker modules (environment, firebase, config, build)
  - All messages now support English and Japanese based on system locale

### Docs
- Added FieldValue usage examples to `examples` command

## [0.6.1] - 2025-12-22

### Fixed
- TZ environment variable support for timestamp formatting

## [0.6.0] - 2025-12-22

### Added
- Timestamp display format options (`--timestamp-format`)
  - `iso`: ISO 8601 format (default)
  - `locale`: Locale-aware format
  - `relative`: Relative time (e.g., "2 hours ago")
  - `unix`: Unix timestamp in seconds
  - `unix-ms`: Unix timestamp in milliseconds

## [0.5.0] - 2025-12-20

### Added
- `doctor` command for environment diagnostics
  - Node.js version check (requires 18.0.0+)
  - Firebase CLI installation check
  - Authentication validation (ADC or Service Account)
  - Firestore API and access verification
  - Config file syntax and schema validation
  - Build status check (development mode)
  - Emulator connection test
  - `--json` flag for CI/CD integration
  - `--verbose` flag for detailed logs

### Docs
- Added CI/CD Integration guide

## [0.4.0] - 2025-12-20

### Added
- TOON (Token-Optimized Object Notation) output format support (`--format toon`)
- Bug fix workflow commands for .kiro specs (`/kiro:bug-*`)
- Root collection listing when `list` command is executed without path argument

### Changed
- Banner image text updated to "firex mcp"
- README: MCP commands updated to npx format with table of contents

### Docs
- Added Zenn article introducing firex
- Documented Firebase Admin SDK standard environment variable support

## [0.3.0] - 2025-12-19

### Added
- MCP Server mode for Claude integration (`firex mcp`)

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

[Unreleased]: https://github.com/hummer98/firex/compare/v0.7.7...HEAD
[0.7.7]: https://github.com/hummer98/firex/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/hummer98/firex/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/hummer98/firex/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/hummer98/firex/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/hummer98/firex/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/hummer98/firex/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/hummer98/firex/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/hummer98/firex/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/hummer98/firex/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/hummer98/firex/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/hummer98/firex/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/hummer98/firex/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/hummer98/firex/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/hummer98/firex/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/hummer98/firex/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/hummer98/firex/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/hummer98/firex/releases/tag/v0.1.0
