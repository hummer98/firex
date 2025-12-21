**[English](README.md)** | 日本語

![firex banner](.github/banner.png)

# firex

Firebase Firestore のコマンドライン操作ツール

`firex` は Firebase Firestore データベースを管理するための強力なコマンドラインインターフェースツールです。Firebase Console の GUI に頼らずに、CRUD 操作やクエリの実行、データ管理を効率的に行うことができます。また、**MCP（Model Context Protocol）サーバー**としても動作し、Claude などの AI アシスタントが Firestore を直接操作できます。

## 目次

- [機能](#機能)
- [インストール](#インストール)
- [クイックスタート](#クイックスタート)
- [コマンドリファレンス](#コマンドリファレンス)
- [設定ファイル](#設定ファイル)
- [環境変数](#環境変数)
- [トラブルシューティング](#トラブルシューティング)
- [セキュリティに関する注意](#セキュリティに関する注意)
- [TOON 出力形式](#toon-出力形式)
- [MCP サーバー連携](#mcp-サーバー連携)
- [開発](#開発)
- [要件](#要件)
- [ライセンス](#ライセンス)
- [コントリビューション](#コントリビューション)

## 機能

- **ドキュメント操作**: Firestore ドキュメントの読み取り、作成、更新、削除
- **コレクションクエリ**: フィルタリング、ソート、ページネーションによるドキュメント一覧表示
- **バッチ操作**: JSON ファイルへのコレクションのインポート・エクスポート
- **リアルタイム監視**: `--watch` フラグによるドキュメントとコレクションの変更監視
- **複数の出力形式**: JSON、YAML、テーブル、TOON形式をサポート
- **タイムスタンプフォーマット**: 柔軟なタイムスタンプ表示（ISO形式）とタイムゾーン対応（TZ環境変数を尊重）
- **設定プロファイル**: 複数のプロジェクト設定をサポート
- **型安全**: TypeScript で構築された信頼性

## インストール

```bash
# npx を使用（推奨 - インストール不要）
npx @hummer98/firex [command]

# グローバルインストール
npm install -g @hummer98/firex

# pnpm の場合
pnpm add -g @hummer98/firex
```

## クイックスタート

### 1. 認証設定

firex は認証に Firebase Admin SDK を使用します。いくつかの方法があります：

**オプション A: サービスアカウントキー（本番環境推奨）**
```bash
# 環境変数を設定
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# またはフラグで指定
firex get users/user123 --credential-path=/path/to/service-account.json
```

**オプション B: アプリケーションデフォルト認証情報（ADC）**
```bash
# gcloud でログイン
gcloud auth application-default login
```

**オプション C: Firestore エミュレータ（開発用）**
```bash
# エミュレータを起動
firebase emulators:start --only firestore

# 環境変数を設定
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

**オプション D: Workload Identity Federation（CI/CD）**

GitHub Actions などの CI/CD プラットフォームでは、キーレス認証を使用できます。
設定方法は [CI/CD 連携ガイド](docs/cicd-jp.md) を参照してください。

### 2. 設定ファイル（オプション）

プロジェクトルートに `.firex.yaml` ファイルを作成：

```yaml
# .firex.yaml
projectId: your-project-id
credentialPath: ./service-account.json
defaultListLimit: 100
watchShowInitial: true

# 複数プロファイル
profiles:
  staging:
    projectId: your-staging-project
  production:
    projectId: your-production-project
```

### 3. 基本的な使い方

```bash
# ドキュメントを読み取る
firex get users/user123

# コレクション内のドキュメントを一覧表示
firex list users

# ドキュメントを作成/更新
firex set users/user123 '{"name": "John", "email": "john@example.com"}'

# ドキュメントを削除
firex delete users/user123

# フィルタ付きクエリ
firex list users --where "status==active" --limit 10

# 変更を監視
firex get users/user123 --watch
```

## コマンドリファレンス

### get - ドキュメント読み取り

単一の Firestore ドキュメントを読み取ります。

```bash
firex get <document-path> [options]
```

**オプション:**
- `--format, -f <format>`: 出力形式（json, yaml, table, toon）。デフォルト: json
- `--toon`: TOON形式で出力（--format=toon のエイリアス）
- `--watch, -w`: リアルタイムでドキュメントの変更を監視
- `--show-initial`: 監視モードで初期データを表示（デフォルト: true）
- `--timestamp-format <format>`: タイムスタンプの表示形式（iso, none）。デフォルト: iso
- `--timezone <zone>`: タイムスタンプ表示のタイムゾーン（local, utc, または Asia/Tokyo のような IANA タイムゾーン）
- `--project-id <id>`: Firebase プロジェクト ID
- `--credential-path <path>`: サービスアカウントキーファイルのパス
- `--verbose, -v`: 詳細出力を有効化

**例:**
```bash
# JSON 形式でドキュメントを読み取る
firex get users/user123 --format json

# テーブル形式でドキュメントを読み取る
firex get users/user123 --format table

# TOON 形式でドキュメントを読み取る（LLM 向けトークン効率化）
firex get users/user123 --toon

# ドキュメントの変更を監視
firex get users/user123 --watch

# ISO 形式で東京タイムゾーンのタイムスタンプを表示
firex get users/user123 --timestamp-format iso --timezone Asia/Tokyo

# タイムスタンプフォーマットを無効化（Firestore Timestamp をそのまま表示）
firex get users/user123 --timestamp-format none
```

### list - ドキュメント一覧/クエリ

オプションのフィルタリングでコレクション内のドキュメントを一覧表示します。

```bash
firex list <collection-path> [options]
```

**オプション:**
- `--where, -W <condition>`: フィルタ条件（field==value）。複数回指定可能
- `--order-by, -o <field>`: ソートするフィールド
- `--order-dir <direction>`: ソート方向（asc, desc）。デフォルト: asc
- `--limit, -l <number>`: 返却する最大ドキュメント数。デフォルト: 100
- `--format, -f <format>`: 出力形式（json, yaml, table, toon）。デフォルト: json
- `--toon`: TOON形式で出力（--format=toon のエイリアス）
- `--timestamp-format <format>`: タイムスタンプの表示形式（iso, none）。デフォルト: iso
- `--timezone <zone>`: タイムスタンプ表示のタイムゾーン（local, utc, または Asia/Tokyo のような IANA タイムゾーン）
- `--watch, -w`: リアルタイムでコレクションの変更を監視

**例:**
```bash
# 全ユーザーを一覧表示
firex list users

# フィルタ付きで一覧表示
firex list users --where "status==active"

# 複数フィルタとソート付きで一覧表示
firex list products --where "category==electronics" --where "price>100" --order-by price --order-dir desc

# コレクションの変更を監視
firex list orders --watch

# TOON 形式で一覧表示
firex list users --toon --limit 10

# ISO 形式のタイムスタンプで一覧表示
firex list users --timestamp-format iso --timezone utc
```

### set - ドキュメント作成/更新

新しいドキュメントを作成するか、既存のドキュメントを上書きします。

```bash
firex set <document-path> <data> [options]
```

**オプション:**
- `--merge, -m`: 上書きではなく既存データとマージ
- `--from-file <path>`: JSON ファイルからデータを読み取る

**例:**
```bash
# ドキュメントを作成/上書き
firex set users/user123 '{"name": "John", "email": "john@example.com"}'

# 既存データとマージ
firex set users/user123 '{"phone": "123-456-7890"}' --merge

# ファイルから
firex set users/user123 --from-file user-data.json
```

### update - 部分更新

既存ドキュメントの特定フィールドを更新します（`set --merge` のエイリアス）。

```bash
firex update <document-path> <data> [options]
```

**例:**
```bash
# 特定のフィールドを更新
firex update users/user123 '{"lastLogin": "2024-01-15"}'

# ファイルから更新
firex update users/user123 --from-file updates.json
```

### delete - ドキュメント/コレクション削除

ドキュメントまたはコレクション全体を削除します。

```bash
firex delete <path> [options]
```

**オプション:**
- `--recursive, -r`: コレクションと全ドキュメントを再帰的に削除
- `--yes, -y`: 確認プロンプトをスキップ

**例:**
```bash
# 単一ドキュメントを削除
firex delete users/user123

# 確認をスキップして削除
firex delete users/user123 --yes

# コレクション全体を削除
firex delete users --recursive
```

### export - コレクションエクスポート

コレクションを JSON ファイルにエクスポートします。

```bash
firex export <collection-path> [options]
```

**オプション:**
- `--output, -o <path>`: 出力ファイルパス。デフォルト: <collection>.json
- `--include-subcollections`: エクスポートにサブコレクションを含める

**例:**
```bash
# コレクションをエクスポート
firex export users --output backup.json

# サブコレクション付きでエクスポート
firex export users --output full-backup.json --include-subcollections
```

### import - データインポート

JSON ファイルからドキュメントをインポートします。

```bash
firex import <file-path> [options]
```

**オプション:**
- `--batch-size <number>`: インポートのバッチサイズ。デフォルト: 500（Firestore の最大値）

**例:**
```bash
# データをインポート
firex import backup.json

# カスタムバッチサイズでインポート
firex import large-dataset.json --batch-size 250
```

### config - 設定表示

現在の設定を表示します。

```bash
firex config [options]
```

**オプション:**
- `--show`: 現在の設定値を表示

**例:**
```bash
# 設定を表示
firex config --show
```

### examples - 使用例表示

一般的な使用例を表示します。

```bash
firex examples
```

### doctor - 環境診断

firex CLI の環境と設定を診断します。このコマンドは、firex が正しく動作するために必要なセットアップの各項目をチェックします。

```bash
firex doctor [options]
```

**オプション:**
- `--json`: 診断結果を JSON 形式で出力（CI/CD 連携用）
- `--verbose, -v`: 各チェックの詳細な実行ログを表示

**診断項目:**

| カテゴリ | チェック項目 | 説明 |
|----------|-------------|------|
| 環境 | Node.js バージョン | Node.js 18.0.0 以降がインストールされているか確認 |
| 環境 | Firebase CLI | Firebase CLI がインストールされているか確認 |
| 環境 | 認証 | 有効な認証情報（ADC またはサービスアカウント）があるか確認 |
| Firebase | .firebaserc | Firebase プロジェクト設定があるか確認 |
| Firebase | Firestore API | Firestore API が有効化されているか確認 |
| Firebase | Firestore アクセス | Firestore への読み取りアクセスをテスト |
| 設定 | 設定ファイル | .firex.yaml/.firex.json の構文とスキーマを検証 |
| ビルド | ビルド状態 | ソースがビルドより新しいか確認（開発時のみ） |
| エミュレータ | 接続 | FIRESTORE_EMULATOR_HOST 設定時にエミュレータ接続をテスト |

**例:**
```bash
# 基本的な診断
firex doctor

# JSON 形式で出力（CI/CD に便利）
firex doctor --json

# 詳細ログを表示
firex doctor --verbose
```

**出力例:**
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

**終了コード:**
- `0`: 全てのチェックが成功、または警告のみ
- `1`: 1つ以上のエラーが検出された

## 設定ファイル

firex は以下の順序で設定ファイルを探します：

1. カレントディレクトリの `.firex.yaml` / `.firex.yml`
2. カレントディレクトリの `.firex.json`
3. `package.json` 内の `firex` キー
4. 親ディレクトリ（プロジェクトルートまで）
5. ホームディレクトリ（`~/.firex.yaml`）

### ユーザー設定（~/.firexrc）

タイムスタンプ形式などのユーザー固有の設定は、`~/.firexrc` ファイルで指定できます：

```yaml
# ~/.firexrc
timestampFormat: iso     # iso, none
timezone: Asia/Tokyo     # local, utc, または IANA タイムゾーン（TZ環境変数を尊重）
```

**優先順位**: CLI オプション > ~/.firexrc > デフォルト値

### 設定オプション

```yaml
# プロジェクト設定
projectId: your-firebase-project-id
credentialPath: ./path/to/service-account.json
databaseURL: https://your-project.firebaseio.com

# デフォルト設定
defaultListLimit: 100    # list コマンドのデフォルト件数
watchShowInitial: true   # 監視モードで初期データを表示

# ロギング
verbose: false
logFile: ./firex.log

# プロファイル設定
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

### プロファイルの使用

```bash
# 特定のプロファイルを使用
firex list users --profile staging
```

## 環境変数

| 変数 | 説明 |
|------|------|
| `GOOGLE_APPLICATION_CREDENTIALS` | サービスアカウントキーファイルのパス |
| `FIRESTORE_PROJECT_ID` | Firebase プロジェクト ID |
| `FIRESTORE_EMULATOR_HOST` | Firestore エミュレータホスト（例: localhost:8080） |
| `FIRESTORE_DATABASE_URL` | Firestore データベース URL |
| `FIREX_DEFAULT_LIMIT` | list コマンドのデフォルト件数 |
| `FIREX_WATCH_SHOW_INITIAL` | 監視モードで初期データを表示（true/false） |
| `FIREX_VERBOSE` | 詳細出力を有効化（true/false） |
| `FIREX_LOG_FILE` | ログファイルのパス |
| `FIREX_TIMESTAMP_FORMAT` | デフォルトのタイムスタンプ形式（iso, none） |
| `FIREX_TIMEZONE` | デフォルトのタイムゾーン（local, utc, または IANA タイムゾーン） |
| `TZ` | 標準UNIX タイムゾーン（`FIREX_TIMEZONE` 未設定時に使用） |

**タイムゾーン優先順位**: CLI オプション > `FIREX_TIMEZONE` > `TZ` > システム検出

> **Note:** firex は以下の [Firebase Admin SDK 標準環境変数](https://firebase.google.com/docs/admin/setup)にも対応しています：
> - `GOOGLE_CLOUD_PROJECT` - プロジェクト ID（`FIRESTORE_PROJECT_ID` 未設定時に使用）
> - `FIREBASE_CONFIG` - Firebase 設定（JSON 文字列または JSON ファイルパス、Cloud Functions や App Hosting 環境では自動設定）

## トラブルシューティング

### 認証エラー

**"INVALID_CREDENTIALS" エラー**
- サービスアカウントキーファイルのパスが正しいか確認
- サービスアカウントに必要な Firestore 権限があるか確認
- ファイル権限を確認（所有者のみ読み取り可能: `chmod 600`）

**"PROJECT_NOT_FOUND" エラー**
- プロジェクト ID が正しいか確認
- Firebase Console で Firestore が有効になっているか確認

**"PERMISSION_DENIED" エラー**
- Firestore セキュリティルールを確認
- サービスアカウントに必要な IAM ロールがあるか確認（Firebase Admin, Cloud Datastore User）

### 接続の問題

**"CONNECTION_TIMEOUT" エラー**
- ネットワーク接続を確認
- ファイアウォール設定で送信 HTTPS が許可されているか確認
- 再試行 - このエラーは一時的なことが多い

**エミュレータ接続失敗**
- エミュレータが実行中か確認: `firebase emulators:start --only firestore`
- `FIRESTORE_EMULATOR_HOST` 環境変数を確認
- エミュレータポートが使用中でないか確認

### よくある問題

**"INVALID_PATH" エラー**
- ドキュメントパスは偶数のセグメントが必要（collection/doc）
- コレクションパスは奇数のセグメントが必要（collection）
- パスは `/` で開始または終了できない

**JSON データの "VALIDATION_ERROR"**
- JSON が有効か確認（JSON バリデータを使用）
- Firestore は `undefined`、関数、シンボルをサポートしない
- ネストされたオブジェクトはプレーンオブジェクトである必要がある

## セキュリティに関する注意

### サービスアカウントキーの保護

- サービスアカウントキーを**バージョン管理にコミットしない**
- `.gitignore` に追加:
  ```
  *-service-account.json
  service-account*.json
  *.pem
  ```
- ファイル権限を所有者のみに設定: `chmod 600 service-account.json`
- CI/CD では環境変数またはシークレットマネージャーを使用

### エクスポートファイルのセキュリティ

- エクスポートされたデータには機密情報が含まれる可能性がある
- エクスポートは制限された権限で保存
- バックアップの暗号化を検討
- 使用後は一時的なエクスポートファイルを削除

### ロギング

- firex はログ内の認証情報を自動的にマスク
- 本番環境ではドキュメント全体の内容をログに記録しない
- デバッグ用に共有する前にログファイルを確認

## TOON 出力形式

TOON（Token-Oriented Object Notation）は、LLM 向けに最適化されたコンパクトで人間可読な JSON 互換フォーマットです。JSON と比較して 40-60% のトークン削減が可能で、意味的等価性を維持します。

### なぜ TOON？

- **トークン効率**: AI アシスタント使用時の API コストを削減
- **人間可読**: 読みやすく理解しやすい
- **JSON 互換**: JSON データと意味的に等価
- **均一データに最適**: 同じスキーマを持つドキュメント配列で最大の効果

### 使い方

```bash
# 単一ドキュメント
firex get users/user123 --toon

# 複数ドキュメント（約60%のトークン削減を実現）
firex list users --toon --limit 100

# メタデータ付き
firex get users/user123 --toon --include-metadata

# コレクション一覧
firex collections --toon
```

### 出力例

**JSON（143 バイト）:**
```json
[{"name":"John","age":30,"email":"john@example.com"},{"name":"Jane","age":25,"email":"jane@example.com"}]
```

**TOON（48 バイト、66% 削減）:**
```
[2]{name,age,email}:
John,30,john@example.com
Jane,25,jane@example.com
```

TOON 形式の詳細については、[TOON 仕様](https://github.com/toon-format/spec)を参照してください。

## MCP サーバー連携

firex は MCP（Model Context Protocol）サーバーとして動作し、Claude などの AI アシスタントが Firestore を直接操作できるようになります。

### Claude Code でのセットアップ

```bash
# 基本セットアップ
claude mcp add firex -- npx @hummer98/firex mcp

# プロジェクト ID と認証情報を指定
claude mcp add firex \
  -e FIRESTORE_PROJECT_ID=your-project-id \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  -- npx @hummer98/firex mcp

# 複数プロジェクト（別名で登録）
claude mcp add firex-prod \
  -e FIRESTORE_PROJECT_ID=prod-project \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/prod-key.json \
  -- npx @hummer98/firex mcp

claude mcp add firex-dev \
  -e FIRESTORE_PROJECT_ID=dev-project \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/dev-key.json \
  -- npx @hummer98/firex mcp
```

### Claude Desktop でのセットアップ

Claude Desktop の設定ファイル（`~/.config/claude/claude_desktop_config.json` または `~/Library/Application Support/Claude/claude_desktop_config.json`）に追加：

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

### MCP ツール一覧

| ツール | 説明 |
|--------|------|
| `firestore_get` | パスでドキュメントを取得 |
| `firestore_list` | フィルタ、ソート、ページネーション付きでドキュメントをクエリ |
| `firestore_set` | ドキュメントを作成または更新 |
| `firestore_update` | 既存ドキュメントを部分更新 |
| `firestore_delete` | ドキュメントまたはコレクションを削除 |
| `firestore_collections` | ルートコレクションまたはサブコレクションを一覧表示 |
| `firestore_export` | コレクションのドキュメントを JSON でエクスポート |
| `firestore_import` | コレクションにドキュメントをインポート |

### ツールパラメータ

#### firestore_get
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | ドキュメントパス（例: `users/user123`） |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

#### firestore_list
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | コレクションパス（例: `users`） |
| `where` | array | No | フィルタ条件: `[{field, operator, value}]` |
| `orderBy` | array | No | ソート順: `[{field, direction}]` |
| `limit` | number | No | 返却する最大ドキュメント数 |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

**対応演算子:** `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`, `array-contains-any`, `in`, `not-in`

#### firestore_set
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | ドキュメントパス（例: `users/user123`） |
| `data` | object | Yes | 書き込むドキュメントデータ |
| `merge` | boolean | No | 既存データとマージ（デフォルト: false） |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

#### firestore_update
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | ドキュメントパス（存在必須） |
| `data` | object | Yes | 更新するフィールド（ドット記法対応） |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

#### firestore_delete
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | ドキュメントまたはコレクションパス |
| `recursive` | boolean | No | コレクション内の全ドキュメントを削除（デフォルト: false） |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

#### firestore_collections
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `documentPath` | string | No | サブコレクション取得用のドキュメントパス。省略でルートコレクション。 |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

#### firestore_export
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | エクスポートするコレクションパス |
| `recursive` | boolean | No | サブコレクションを含める（デフォルト: false） |
| `limit` | number | No | エクスポートする最大ドキュメント数 |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

#### firestore_import
| パラメータ | 型 | 必須 | 説明 |
|------------|------|------|------|
| `path` | string | Yes | インポート先のコレクションパス |
| `documents` | array | Yes | `{id?, data}` オブジェクトの配列 |
| `merge` | boolean | No | 既存ドキュメントとマージ（デフォルト: false） |
| `format` | string | No | 出力形式: `json` または `toon`（デフォルト: `json`） |

### MCP 使用例

```
# Claude にドキュメント取得を依頼
「users/user123 のユーザードキュメントを取得して」

# フィルタ付きクエリ
「status が active のユーザーを createdAt の降順で10件取得して」

# ドキュメント作成
「users/newuser に name が 'John'、email が 'john@example.com' のユーザーを作成して」

# コレクション削除
「temp コレクションの全ドキュメントを削除して」

# データエクスポート
「orders コレクションをサブコレクション含めてエクスポートして」
```

## 開発

### ビルド

```bash
npm run build      # 本番ビルド
npm run dev        # 開発モード（監視）
```

### テスト

```bash
npm test                    # 全テストを実行
npm run test:coverage       # カバレッジ付き
npm run typecheck           # TypeScript 型チェック
```

### プロジェクト構造

```
src/
├── shared/          # 共有型
├── services/        # アプリケーション層（Config, Auth, Logging）
├── domain/          # ドメイン層（FirestoreOps, QueryBuilder など）
├── presentation/    # 出力フォーマット、プロンプト
├── commands/        # CLI コマンド（get, set, list など）
└── index.ts         # エントリーポイント
```

## 要件

- Node.js 18 以降
- Firestore が有効な Firebase プロジェクト
- Firestore アクセス権を持つサービスアカウント（または ADC）

## ライセンス

MIT

## コントリビューション

コントリビューションは歓迎します！ガイドラインについては [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。
