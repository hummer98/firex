**[English](README.md)** | 日本語

![firex banner](.github/banner.png)

# firex

Firebase Firestore のコマンドライン操作ツール

`firex` は Firebase Firestore データベースを管理するための強力なコマンドラインインターフェースツールです。Firebase Console の GUI に頼らずに、CRUD 操作やクエリの実行、データ管理を効率的に行うことができます。

## 機能

- **ドキュメント操作**: Firestore ドキュメントの読み取り、作成、更新、削除
- **コレクションクエリ**: フィルタリング、ソート、ページネーションによるドキュメント一覧表示
- **バッチ操作**: JSON ファイルへのコレクションのインポート・エクスポート
- **リアルタイム監視**: `--watch` フラグによるドキュメントとコレクションの変更監視
- **複数の出力形式**: JSON、YAML、テーブル形式をサポート
- **設定プロファイル**: 複数のプロジェクト設定をサポート
- **型安全**: TypeScript で構築された信頼性

## インストール

```bash
# npx を使用（推奨 - インストール不要）
npx firex [command]

# グローバルインストール
npm install -g firex

# pnpm の場合
pnpm add -g firex
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
- `--format, -f <format>`: 出力形式（json, yaml, table）。デフォルト: json
- `--watch, -w`: リアルタイムでドキュメントの変更を監視
- `--show-initial`: 監視モードで初期データを表示（デフォルト: true）
- `--project-id <id>`: Firebase プロジェクト ID
- `--credential-path <path>`: サービスアカウントキーファイルのパス
- `--verbose, -v`: 詳細出力を有効化

**例:**
```bash
# JSON 形式でドキュメントを読み取る
firex get users/user123 --format json

# テーブル形式でドキュメントを読み取る
firex get users/user123 --format table

# ドキュメントの変更を監視
firex get users/user123 --watch
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
- `--format, -f <format>`: 出力形式（json, yaml, table）。デフォルト: json
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

## 設定ファイル

firex は以下の順序で設定ファイルを探します：

1. カレントディレクトリの `.firex.yaml` / `.firex.yml`
2. カレントディレクトリの `.firex.json`
3. `package.json` 内の `firex` キー
4. 親ディレクトリ（プロジェクトルートまで）
5. ホームディレクトリ（`~/.firex.yaml`）

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
