---
name: firex
description: "Firestore を CLI / MCP で操作するスキル。ドキュメント取得・更新、コレクション一覧とクエリ、インポート/エクスポート、リアルタイム監視、MCP サーバー連携。Firestore のパス(例: users/abc)・プロジェクトID・コレクションが話題に上ったらトリガーする。"
---

# firex

`firex` は Firestore の CLI + MCP サーバー。**インストール不要**で `npx @hummer98/firex <command>` として呼び出せる。

## 認証

以下のいずれかを設定する（優先度: コマンドフラグ > 環境変数）。

| 方法 | 設定 |
|------|------|
| サービスアカウント | `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json` |
| ADC | `gcloud auth application-default login` |
| エミュレータ | `export FIRESTORE_EMULATOR_HOST=localhost:8080` |

プロジェクト ID は `FIRESTORE_PROJECT_ID` 環境変数、または各コマンドの `--project` で指定する。

認証に問題が出たら `npx @hummer98/firex doctor` で診断する。

## CLI: 基本操作

| 操作 | コマンド |
|------|---------|
| ドキュメント取得 | `npx @hummer98/firex get users/user123` |
| コレクション一覧 | `npx @hummer98/firex list users --limit 10` |
| ドキュメント作成/上書き | `npx @hummer98/firex set users/user123 --data '{"name":"Alice"}'` |
| 部分更新 | `npx @hummer98/firex update users/user123 --data '{"status":"active"}'` |
| 削除 | `npx @hummer98/firex delete users/user123` |
| コレクション削除 | `npx @hummer98/firex delete users --recursive` |
| ルートコレクション列挙 | `npx @hummer98/firex collections` |
| サブコレクション列挙 | `npx @hummer98/firex collections --path users/user123` |
| JSON エクスポート | `npx @hummer98/firex export users --output users.json` |
| JSON インポート | `npx @hummer98/firex import users --input users.json` |
| 設定確認 | `npx @hummer98/firex config show` |
| 診断 | `npx @hummer98/firex doctor` |

> 継続的に使うなら `npm install -g @hummer98/firex` すれば `firex` だけで起動できる。AI による単発操作は npx のままで十分。

## list のクエリ構文

```bash
# 単一フィルタ
npx @hummer98/firex list users --where "status==active"

# 複数条件 + ソート + 件数制限
npx @hummer98/firex list orders \
  --where "status==completed" \
  --where "total>1000" \
  --order-by "createdAt:desc" \
  --limit 50
```

サポート演算子: `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`, `array-contains-any`, `in`, `not-in`

## 出力フォーマット

すべてのコマンドで `--format` を指定できる。

| format | 用途 |
|--------|------|
| `json` | 既定。機械処理・スクリプト |
| `yaml` | 人間可読・diff 友好 |
| `table` | ターミナル表示 |
| `toon` | LLM 向け圧縮形式（トークン節約） |

LLM に大量ドキュメントを渡すときは `--format toon` を選ぶ。

## リアルタイム監視

`--watch` でドキュメント/コレクションの変更を購読する。

```bash
npx @hummer98/firex get users/user123 --watch
npx @hummer98/firex list orders --where "status==pending" --watch
```

## MCP サーバー連携

CLI を毎回叩くより、Claude Code / Claude Desktop の MCP として登録すると会話内で直接 Firestore を操作できる。

### Claude Code に登録

```bash
claude mcp add firex \
  -e FIRESTORE_PROJECT_ID=your-project-id \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  -- npx @hummer98/firex mcp
```

複数プロジェクトは別名で登録する:

```bash
claude mcp add firex-prod -e FIRESTORE_PROJECT_ID=prod ... -- npx @hummer98/firex mcp
claude mcp add firex-dev  -e FIRESTORE_PROJECT_ID=dev  ... -- npx @hummer98/firex mcp
```

### MCP ツール一覧

| ツール | 用途 |
|--------|------|
| `firestore_get` | ドキュメント取得 |
| `firestore_list` | クエリ（where/orderBy/limit） |
| `firestore_set` | 作成/上書き（`merge` でマージ） |
| `firestore_update` | 部分更新（dot notation 対応） |
| `firestore_delete` | 削除（`recursive` でコレクション削除） |
| `firestore_collections` | コレクション列挙 |
| `firestore_export` | JSON エクスポート |
| `firestore_import` | JSON インポート |

すべてのツールに `format` パラメータ（`json` / `toon`）があり、大量データを読むときは `toon` を使う。

## タイムスタンプ

- 出力は ISO 8601 形式（`2026-01-01T00:00:00.000Z`）。
- タイムゾーンは `TZ` 環境変数に従う（例: `TZ=Asia/Tokyo`）。
- 入力データに `{"_type":"timestamp","value":"2026-01-01T00:00:00Z"}` を使うと Firestore Timestamp として書き込まれる（単なる文字列と区別される）。

## 設定ファイル

プロジェクトルートに `.firex.yaml` を置くと繰り返しフラグを省略できる。

```yaml
projectId: your-project-id
credentialPath: ./service-account.json
defaultListLimit: 100
watchShowInitial: true

profiles:
  prod:
    projectId: prod-project
    credentialPath: ./prod-key.json
  dev:
    projectId: dev-project
```

プロファイル切り替え: `--profile prod`

## 破壊的操作の安全策

- `delete --recursive` は **確認プロンプト**が出る。CI では `--yes` を付ける。
- 本番プロジェクトへの書き込みは `--profile prod` を明示することで事故を減らす。
- 大量インポート前は `--dry-run` で件数を確認する。

## よくあるミス

| 症状 | 原因 | 対処 |
|------|------|------|
| `permission-denied` | サービスアカウントの権限不足 | Firestore User / Admin ロールを付与 |
| `NOT_FOUND` on set | パスが不正 | 奇数セグメント=コレクション、偶数セグメント=ドキュメント |
| エミュレータに繋がらない | `FIRESTORE_EMULATOR_HOST` 未設定 | `export FIRESTORE_EMULATOR_HOST=localhost:8080` |
| TZ が UTC のまま | `TZ` 未設定 | `export TZ=Asia/Tokyo` |
| 大量クエリでトークン爆発 | `--format json` 既定 | `--format toon` に切り替え |

## トラブルシューティング

最初に `npx @hummer98/firex doctor` を叩く。認証・プロジェクト ID・ネットワークを自動診断する。
