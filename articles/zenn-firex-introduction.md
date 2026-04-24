---
title: "FirestoreをCLIで操作する「firex」を作った - AIコーディングエージェントとの連携も可能"
emoji: "🔥"
type: "tech"
topics: ["firebase", "firestore", "cli", "claude", "mcp"]
published: false
---

## はじめに

Firestoreを使っていて、こんなことを思ったことはありませんか？

- 「ちょっとデータ確認したいだけなのに、毎回コンソール開くの面倒...」
- 「本番のデータをローカルにエクスポートしたい」
- 「複数のWHERE条件でクエリしたいけど、コンソールだと限界がある」
- 「Claude CodeやGemini CLIからFirestoreを操作したい」

これらを解決するために **firex** というCLIツールを作りました。

https://github.com/hummer98/firex

## firexとは

FirestoreをターミナルからCRUD操作できるCLIツールです。

不思議なことに、`firebase` コマンドにも `gcloud` コマンドにも、Firestoreのドキュメントを取得・操作するCLIコマンドが用意されていません。firexはこの空白を埋めるツールです。

```bash
# インストール不要で即実行
npx @hummer98/firex list users --where "status==active" --limit 10
```

さらに **MCP（Model Context Protocol）サーバー** としても動作するので、Claude CodeやGemini CLIなどのAIコーディングエージェントからFirestoreを直接操作できます。

## 主な機能

### 1. 基本的なCRUD操作

```bash
# ドキュメント取得
firex get users/user123

# コレクション一覧
firex list users

# ドキュメント作成・更新
firex set users/user123 '{"name": "田中", "status": "active"}'

# 部分更新
firex update users/user123 '{"lastLogin": "2024-12-20"}'

# 削除
firex delete users/user123
```

### 2. 複雑なクエリ

firebase-toolsではできない、複数条件でのクエリが可能です。

```bash
# 複数のWHERE条件 + ソート + limit
firex list products \
  --where "category==electronics" \
  --where "price>1000" \
  --order-by price --order-dir desc \
  --limit 20
```

### 3. リアルタイム監視

`--watch` フラグでドキュメントやコレクションの変更をリアルタイムで監視できます。

```bash
# ドキュメントの変更を監視
firex get users/user123 --watch

# コレクションの変更を監視
firex list orders --watch
```

開発中のデバッグや、本番環境のモニタリングに便利です。

### 4. エクスポート・インポート

```bash
# コレクションをJSONでエクスポート
firex export users --output backup.json

# サブコレクションも含めてエクスポート
firex export users --output full-backup.json --include-subcollections

# インポート
firex import backup.json
```

### 5. 複数プロジェクト対応

`.firex.yaml` で複数の環境を管理できます。

```yaml
# .firex.yaml
projectId: dev-project
databaseId: my-db            # 任意。省略時は (default) データベースを使用。
credentialPath: ./dev-service-account.json

profiles:
  staging:
    projectId: staging-project
    databaseId: staging-db
  production:
    projectId: prod-project
    credentialPath: ./prod-service-account.json
```

```bash
# 本番環境のデータを確認
firex list users --profile production
```

### 6. 出力形式の選択

用途に応じて出力形式を選べます。

```bash
firex list users --format json   # JSON（デフォルト）
firex list users --format yaml   # YAML
firex list users --format table  # 見やすいテーブル形式
```

## AIコーディングエージェント連携（MCPサーバー）

firexの最大の特徴は、**MCPサーバーとして動作** することです。

### なぜMCPサーバーが必要なのか

AIコーディングエージェントがFirestoreにアクセスしようとしたとき、こんなコマンドを叩こうとしているのを見たことはありませんか？

```bash
# AIが生成しがちな存在しないコマンド
gcloud firestore documents get projects/PROJECT_ID/databases/(default)/documents/users/user123
```

前述の通り、Firestore操作用のCLIコマンドは存在しないため、AIは架空のコマンドを生成してしまいます。

firexをMCPサーバーとして登録すれば、AIは正しいツールを使ってFirestoreを操作できるようになります。

### MCPとは？

MCP（Model Context Protocol）は、AIが外部ツールと連携するためのプロトコルです。Anthropic社が策定し、現在はClaude Code、Gemini CLI、VS Code（GitHub Copilot）など多くのAIコーディングエージェントで採用されています。

### セットアップ

#### Claude Codeの場合

```bash
claude mcp add firex \
  -e FIRESTORE_PROJECT_ID=your-project-id \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  -- npx @hummer98/firex mcp
```

#### Claude Desktopの場合

`~/Library/Application Support/Claude/claude_desktop_config.json` に追加：

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

`(default)` 以外の **named database** を対象にしたい場合は、`FIRESTORE_DATABASE_ID` を `env` に追加してください（省略時は `(default)` が使われます）。

### 使い方

セットアップ後は、AIに自然言語で指示するだけです。

```
「usersコレクションからstatusがactiveのユーザーを10件取得して」

「user123のlastLoginを今日の日付に更新して」

「ordersコレクションをエクスポートして」
```

AIが適切なfirexのツールを呼び出し、Firestoreを操作してくれます。

### 利用可能なMCPツール

| ツール名 | 説明 |
|---------|------|
| `firestore_get` | ドキュメント取得 |
| `firestore_list` | コレクションをクエリ |
| `firestore_set` | ドキュメント作成・更新 |
| `firestore_update` | 部分更新 |
| `firestore_delete` | 削除 |
| `firestore_collections` | コレクション一覧 |
| `firestore_export` | エクスポート |
| `firestore_import` | インポート |

## 他のツールとの違い

2025年にGoogle公式の[Firebase MCP Server](https://firebase.google.com/docs/ai-assistance/mcp-server)がリリースされました。firexとの違いは以下の通りです。

| 機能 | firex | Firebase MCP Server |
|------|-------|---------------------|
| ドキュメント取得 | ✅ | ✅ |
| クエリ（フィルタ） | ✅ | ✅ |
| ドキュメント作成・更新 | ✅ | ❓（不明） |
| ドキュメント削除 | ✅ | ✅ |
| エクスポート・インポート | ✅ | ❌ |
| CLIとしても使える | ✅ | ❌（MCPのみ） |
| リアルタイム監視 | ✅ `--watch` | ❌ |
| Firebase全体管理 | ❌ | ✅（Auth, Storage等） |

**使い分け**:
- **firex**: Firestoreのデータ操作に特化。CLIとしても使いたい、エクスポート/インポートしたい場合に
- **Firebase MCP**: Firebase全体（Auth, Storage, Hosting等）をAIで管理したい場合に

## クイックスタート

### 1. 認証設定

```bash
# 方法A: サービスアカウントキー
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# 方法B: gcloud ADC
gcloud auth application-default login

# 方法C: エミュレータ（開発用）
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

### 2. 実行

```bash
# プロジェクトIDを指定して実行
npx @hummer98/firex list users --project-id your-project-id

# または環境変数で指定
export FIRESTORE_PROJECT_ID=your-project-id
npx @hummer98/firex list users
```

### named database を使う場合

`(default)` 以外の Firestore データベースを使う場合は `--database-id`（または `FIRESTORE_DATABASE_ID`）を指定します。

```bash
npx @hummer98/firex list users --project-id your-project-id --database-id my-db
# または
export FIRESTORE_DATABASE_ID=my-db
npx @hummer98/firex list users
```

## ユースケース

### 本番データの確認・デバッグ

```bash
# 特定ユーザーのデータを確認
firex get users/problematic-user-id

# 最近作成されたドキュメントを確認
firex list logs --order-by createdAt --order-dir desc --limit 5
```

### データのバックアップ・マイグレーション

```bash
# 本番からエクスポート
firex export users --profile production --output users-backup.json

# ステージングにインポート
firex import users-backup.json --profile staging
```

### 開発中のリアルタイムデバッグ

```bash
# フロントエンドを操作しながら、データの変化を監視
firex list orders --watch
```

### AIコーディングエージェントによるデータ操作

Claude CodeやGemini CLIで：

```
「過去1週間のordersを取得して、合計金額を計算して」
「status='pending'の注文をすべて'processing'に更新して」
```

## インストール

```bash
# グローバルインストール
npm install -g @hummer98/firex

# または npx で都度実行（インストール不要）
npx @hummer98/firex [command]
```

## おわりに

firexは個人的な「Firestoreをターミナルから触りたい」という欲求から生まれたツールです。

特にMCPサーバー機能は、Claude CodeやGemini CLIでFirebaseプロジェクトを開発するときに非常に便利です。「このデータ見せて」「あのフィールド更新して」と言うだけで、AIが勝手にやってくれます。

フィードバックや機能リクエストは、GitHubのIssuesやDiscussionsでお待ちしています！

https://github.com/hummer98/firex

---

**関連リンク**
- [npm: @hummer98/firex](https://www.npmjs.com/package/@hummer98/firex)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Firebase MCP Server](https://firebase.google.com/docs/ai-assistance/mcp-server)
