# Summary — T002: named database 補足ドキュメント更新 (T001 フォローアップ)

- Task ID: `002`
- Task Run ID: `task-002-1777038024`
- Base: `master` (T001 commit `a344711` が直前 HEAD)
- Branch: `task-002-1777038024/task`
- Worktree: `/Users/yamamoto/git/firex/.worktrees/task-002-1777038024`
- 完了時刻: 2026-04-24

## 完了したサブタスク

| Phase | Agent | 結果 |
|---|---|---|
| Phase 1 (Plan) | Planner (surface:1040) | `plan.md` 作成。T001 を Source of Truth と位置付け、対象 5 ファイル+「不要」3 ファイルの判定を明記 |
| Phase 3 (Implementation) | Implementer (surface:1041) | plan 通り 5 ファイルに docs-only 差分 67 insertions(+)。typecheck ✅ / test ✅ / lint ❌（pre-existing） |
| Phase 4 (Inspection) | Inspector (surface:1042) | **GO**。受け入れ基準・品質項目すべて ✅。Critical findings なし |

## 変更ファイル一覧

```
 IMPLEMENTATION_STATUS.md             | 11 +++++++++++
 articles/devto-firex-introduction.md | 15 +++++++++++++++
 articles/zenn-firex-introduction.md  | 15 +++++++++++++++
 docs/cicd-jp.md                      | 13 +++++++++++++
 docs/cicd.md                         | 13 +++++++++++++
 5 files changed, 67 insertions(+)
```

追加内容:
- `articles/zenn-firex-introduction.md`: `.firex.yaml` 例に `databaseId` 追加、Claude Desktop MCP 注記、Quick Start 末尾に "### named database を使う場合" セクション
- `articles/devto-firex-introduction.md`: 同上の英訳版（注記は blockquote、セクションは "### Using a named database"）
- `docs/cicd.md` / `docs/cicd-jp.md`: GitHub Actions 例 Note 直後に "### Named database" / "### named database を使う場合" サブセクションを追加
- `IMPLEMENTATION_STATUS.md`: Task 2.2 直後に `#### Task 2.2.1: Named Database サポート ✅ (Issue #3)` を既存フォーマットで追加

## 「不要」と判断したファイルと理由

| ファイル | 理由 |
|---|---|
| `src/mcp/tools/*.ts` (8本) | T001 で 8 ツール全件の `databaseId` description を追加済み。ツール全体 description は既存の `projectId` でも触れられておらず不均衡のため見送り |
| `docs/BOOT.md` | 初期コンセプトメモ 22 行。CLI 例・環境変数・設定例がなく named DB に触れる場所自体が存在しない |
| `CONTRIBUTING.md` | 開発環境セットアップ中心で Firestore 接続の具体的説明がない（Emulator 言及のみで named DB と直交） |

## テスト結果

| コマンド | 結果 |
|---|---|
| `npm run typecheck` | ✅ exit 0 |
| `npm test` | ✅ 1039/1039 tests passed (59 files, 9.10s) |
| `npm run lint` | ❌ exit 2 — **pre-existing config 欠落** |

`npm run lint` 失敗について: ESLint v8.57.1 が `.eslintrc*` / `eslint.config.*` を発見できず失敗。Implementer / Inspector / Conductor の 3 者が master ブランチ上で独立に再現確認した pre-existing 問題。T001 の journal でも「lint 不具合は master 由来で不問」と記載済み。本タスク（docs-only）の責務外。別タスクで `eslint.config.*` 再生成か ESLint v9 flat config 移行が必要。

## 用語整合性

- "named database" / `(default)` / `my-db` / `staging-db` を全追加箇所で統一
- `FIRESTORE_DATABASE_URL`（Realtime DB URL）と `FIRESTORE_DATABASE_ID`（named DB ID）を混同せず、README 方針を踏襲
- `grep -n "FIRESTORE_DATABASE_URL" articles/*.md docs/cicd*.md IMPLEMENTATION_STATUS.md` は 0 ヒット（T002 追加箇所に DATABASE_URL は一切出現しない）

## 懸念・残課題

1. **`npm run lint` の pre-existing 失敗**: 別タスクで ESLint 再設定が必要。T002 では対応不可（スコープ外）
2. **`IMPLEMENTATION_STATUS.md` L76 のテスト数値**: 現状 "30 tests passed (5 test files)" だが実際は 1039/59。named DB サブセクションだけ追加し本数値は据え置き（別タスクでの全面リフレッシュ候補）
3. **外部 Zenn / dev.to への再投稿**: ローカル `articles/*.md` の更新のみ。ユーザー側で外部プラットフォームへの手動同期を想定
4. **Zenn/dev.to 注記の文体差**: zenn 版は通常段落、dev.to 版は blockquote（plan 準拠、Inspector が「将来揃えたければ zenn も blockquote にする案」と提案）

## 納品方法

- 方式: **ローカル ff-only merge** (master へ)
- conductor-prompt.md 指示: 「このタスクの成果は `master` にマージすること。納品方法（ローカルマージ or PR）は conductor-role.md の完了時の処理に従う。」
- レビュー必須の破壊的変更ではなく docs-only のため、デフォルトのローカルマージを選択

## 参考

- Plan: `plan.md`
- 実装レポート: `impl-report.md`
- 検品レポート: `inspection-report.md`
- 先行タスク: T001 (`001`) — `feat: named database サポート追加 (Issue #3)` commit `a344711`
- GitHub Issue: #3
