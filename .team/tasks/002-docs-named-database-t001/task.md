---
id: 002
title: docs: named database の補足ドキュメント更新 (T001 フォローアップ)
priority: medium
depends_on: [001]
created_by: surface:1031
created_at: 2026-04-24T13:07:38.200Z
---

## タスク
# docs: named database サポートに伴う補足ドキュメント更新

## 背景

T001（named database サポート追加）では以下のドキュメントを更新する予定:
- CLI フラグの help 文字列（i18n 経由）
- README.md / README-jp.md
- `.firex.yaml` 設定例セクション

しかし、プロジェクトにはこれ以外にも `projectId` に言及しているドキュメントが存在する。T001 で触れなかった周辺ドキュメントを本タスクで網羅的に更新する。

**必ず T001 が closed になってから着手すること**（依存関係設定済み）。T001 で確定したシグネチャ・フラグ名・設定キー名を正として揃える。

## ゴール

T001 で追加された `databaseId` / `--database-id` / `FIRESTORE_DATABASE_ID` 機能が、主要ドキュメント全般で一貫して案内されている状態にする。

## 対象ドキュメント

### 1. MCP ツールの description 文字列（zod schema）
`src/mcp/tools/*.ts` の 8 ツールで、スキーマ定義の `databaseId` フィールドに**わかりやすい description** が付与されているかを確認し、不足があれば補う。

- ツール全体の description（`server.tool(name, description, schema, handler)` の description 引数）にも、named DB 対応を匂わせる文言があると親切（必須ではない）
- 既存の `projectId` フィールドの description トーンに合わせる

### 2. 外部記事の同期（articles/）
以下は firex の紹介記事で、`projectId` や CLI 使用例を含む。T001 で README に追加した使用例と平仄を合わせて、named DB について追記する:
- `articles/zenn-firex-introduction.md`（日本語）
- `articles/devto-firex-introduction.md`（英語）

**注意:** これらは外部（Zenn / dev.to）に既に公開済みの可能性がある。ローカルファイルの更新のみを行い、外部サイトへの再投稿は行わない。コミット後にユーザーが外部側を手動同期する想定。

### 3. docs/ 配下
以下を読んでチェックし、named DB 指定の説明が必要な箇所があれば追記:
- `docs/BOOT.md`（セットアップ手順）
- `docs/cicd.md` / `docs/cicd-jp.md`（CI/CD 設定例）

**判断基準:** CLI の呼び出し例や環境変数の記載があれば、`--database-id` / `FIRESTORE_DATABASE_ID` にも触れる。なければ追記不要。

### 4. IMPLEMENTATION_STATUS.md
機能の実装状況リストに named database サポートを追加（フォーマットは既存の記載に合わせる）。

### 5. CONTRIBUTING.md
開発者向け情報で Firestore 接続の説明があれば、named DB 対応に触れる。なければ変更不要。

## 受け入れ基準

- [ ] MCP ツール 8 個すべてで `databaseId` の description が適切に記述されている
- [ ] `articles/*.md` 2 件に named DB の使用例 or 言及が入っている
- [ ] `docs/BOOT.md` / `docs/cicd*.md` のうち関連する箇所が更新されている（不要なら「不要」と summary.md で報告）
- [ ] `IMPLEMENTATION_STATUS.md` が更新されている
- [ ] `CONTRIBUTING.md` は読んで、必要なら更新（不要なら不要とだけ報告）
- [ ] `npm run typecheck` / `npm run lint` / `npm test` が全パス（ドキュメント変更のみのはずだが念のため）

## 非対象

- CHANGELOG.md 更新（リリースタスクで行う）
- バージョンバンプ
- 外部（Zenn / dev.to）への再投稿
- T001 のスコープに含まれていた `README.md` / `README-jp.md` / `.firex.yaml` 設定例 / CLI help i18n の修正（T001 側で完了している前提）

## 参考

- T001: feat: named database サポート追加 (Issue #3)
- GitHub Issue #3: https://github.com/hummer98/firex/issues/3
