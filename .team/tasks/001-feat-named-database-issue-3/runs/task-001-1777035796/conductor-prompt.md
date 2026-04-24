# タスク割り当て

## タスク内容

---
id: 001
title: feat: named database サポート追加 (Issue #3)
priority: high
created_by: surface:1031
created_at: 2026-04-24T12:59:56.959Z
---

## タスク
# feat: named database サポート追加

## 背景

GitHub Issue #3 (https://github.com/hummer98/firex/issues/3) にて、GCP プロジェクト内の `(default)` 以外の named database に対して firex で操作できるようにしてほしいという機能要望が来ている。

現在 firex は `getFirestore(this.app)` を引数なしで呼び出しており、デフォルト DB のみをサポート。firebase-admin v13 では `getFirestore(app, databaseId)` で named database を指定できる。

## ゴール

- `databaseId` オプションを CLI / 環境変数 / 設定ファイル / MCP ツール で受け取れるようにする
- 未指定時は従来通り `(default)` を使う（**後方互換必須**）
- 全 CLI コマンドと全 MCP ツール（8個）で等しくサポート

## 実装方針（調査済みの変更箇所）

以下は Master 側で既に調査した結果。実装判断（シグネチャ名・エラーメッセージ文言・バリデーション詳細など）は Agent に委ねる。

### 1. 型定義・設定
- `src/services/config.ts` の `Config` インターフェースに `databaseId?: string` を追加
- 設定ファイル `.firex.yaml` でも `databaseId` を受け付けるようにする

### 2. Firestore クライアント初期化
- `src/services/auth.ts` L66-76 付近: `getFirestore(this.app)` → `getFirestore(this.app, databaseId)` （databaseId が指定されている場合のみ第2引数を渡す）
- AuthService のキャッシュキー（app 名）にも `databaseId` を含める必要があるか検証してほしい

### 3. CLI フラグ
- `src/commands/base-command.ts` L38-41 付近: 既存の `--project-id` と同じ形式で `--database-id` フラグを追加
  - 環境変数: `FIRESTORE_DATABASE_ID`
  - 説明文の i18n キー（`flag.databaseId` のような）も追加
- `src/commands/mcp.ts` L34-42 付近: MCP サーバー起動時にも同じフラグを受け付ける（サーバー起動時にデフォルトを指定できるようにする）

### 4. MCP ツール（8 ファイル）
以下すべてのツールのスキーマに `databaseId` を optional パラメータとして追加し、`firestoreManager.getFirestore({ projectId, databaseId })` に渡す：
- `src/mcp/tools/get.ts`
- `src/mcp/tools/list.ts`
- `src/mcp/tools/set.ts`
- `src/mcp/tools/update.ts`
- `src/mcp/tools/delete.ts`
- `src/mcp/tools/collections.ts`
- `src/mcp/tools/export.ts`
- `src/mcp/tools/import.ts`

### 5. キャッシュキー
- `src/mcp/firestore-manager.ts` L64-65 付近の `getCacheKey()` を `${projectId}::${databaseId ?? 'default'}::${credentialPath}` のように変更。同じ projectId でも DB が違えば別インスタンスにする

### 6. 優先順位（既存の projectId と同じ解決順序に合わせる）
CLI フラグ > 環境変数 > 設定ファイル > 未指定（`(default)`）

### 7. テスト
- 既存の integration / e2e テストが壊れないこと（デフォルト動作の後方互換）
- named database 指定のユースケースを最低 1 件（integration テスト推奨）
  - Firestore Emulator が named DB をサポートするか要確認。サポートしない場合は unit テストで getFirestore の呼び出し引数を検証するモック方式でよい

### 8. ドキュメント
- `README.md` / `README-jp.md` に `--database-id` の使用例を追加（`projectId` の記述箇所の近くが自然）
- `.firex.yaml` の設定例セクションにも `databaseId` を追記
- `CHANGELOG.md` は**更新しない**（リリース時に別タスクでまとめる）

## 受け入れ基準

- [ ] `firex get <collection>/<doc> --database-id my-db --project-id foo` が named DB に対して動作する
- [ ] `FIRESTORE_DATABASE_ID=my-db firex ...` が動作する
- [ ] `.firex.yaml` に `databaseId: my-db` を書いて動作する
- [ ] MCP サーバー経由（8 ツール全て）で `databaseId` パラメータを渡せる
- [ ] `databaseId` 未指定時は従来通り `(default)` で動作する（既存テスト全緑）
- [ ] `npm run typecheck` / `npm run lint` / `npm test` が全パス
- [ ] README に使用例あり

## 非対象

- CHANGELOG 更新（リリースタスクで行う）
- バージョンバンプ（リリースタスクで行う）
- GitHub Issue #3 へのリプライ（Master が別途行う）


## 作業ディレクトリ

すべての作業は git worktree `/Users/yamamoto/git/firex/.worktrees/task-001-1777035796` 内で行う。
```bash
cd /Users/yamamoto/git/firex/.worktrees/task-001-1777035796
```
master ブランチに直接変更を加えてはならない。

ブランチ名: `task-001-1777035796/task`

## 作業開始前の確認（ブートストラップ）

worktree は tracked files のみ含む。作業開始前に以下を確認すること:
- `package.json` があれば `npm install` を実行
- `.gitignore` に記載されたランタイムディレクトリ（`node_modules/`, `dist/`, `workspace/` 等）の有無を確認し、必要なら再構築
- `.envrc` や環境変数の設定

## 出力ディレクトリ

```
/Users/yamamoto/git/firex/.team/tasks/001-feat-named-database-issue-3/runs/task-001-1777035796
```

結果サマリーは `/Users/yamamoto/git/firex/.team/tasks/001-feat-named-database-issue-3/runs/task-001-1777035796/summary.md` に書き出す。

## マージ先ブランチ

このタスクの成果は `master` にマージすること。
納品方法（ローカルマージ or PR）は conductor-role.md の完了時の処理に従う。

## 完了通知

完了処理は `conductor-role.md` の「完了時の処理」（Step 1〜12）に従う。特に:
- Step 11: `cmux-team close-task --task-id <TASK_ID> --deliverable-kind <files|merged|pr|none> ... --journal "..."` がタスクを close し、内部で daemon に CONDUCTOR_DONE を送信する。**`--deliverable-kind` は必須**で Step 9 の納品方式と対応付ける（merged / pr / files / none）。詳細は `conductor-role.md` Step 11 を参照
- Step 12: 完了レポートをセッション上に表示する

**`cmux-team send CONDUCTOR_DONE --success true` を自分で呼び出さない** — close-task がその役割を果たす。rebase 衝突等で close-task を呼ばず abort したい場合のみ `conductor-role.md` Step 8 の `--success false` 経路を使う。
