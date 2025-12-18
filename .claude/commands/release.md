---
description: firex CLIの新バージョンをリリース（--publishでnpm公開）
allowed-tools: Bash(git *), Bash(npm *), Bash(gh *), Read, Edit
---

# Release - firex新バージョンリリース

このコマンドは、firex CLIの新バージョンをリリースするための一連の手順を自動化します。

**引数**: `$ARGUMENTS`
- `--publish`: npm publishを実行する（省略時はGitタグ作成まで）
- `--local`: ローカルにグローバルインストール（npm link）を実行する

## 実行手順

以下の順序で実行してください：

### 1. 前提条件チェック

まず、未コミットの変更があるか確認します：

```bash
git status --porcelain
```

**未コミットの変更がある場合:**
- ユーザーに確認してください
- 必要であれば `/commit` コマンドを実行してコミットを作成
- コミット後、このコマンドを再実行

### 2. テストの実行

リリース前にテストが通ることを確認：

```bash
npm test
npm run typecheck
```

**テストが失敗した場合:**
- エラー内容をユーザーに報告
- リリースを中断

### 3. バージョン決定

現在のバージョンを確認し、次のバージョンを決定します：

```bash
# 現在のバージョン確認
node -p "require('./package.json').version"

# 最近のコミットを確認してバージョンタイプを判定
git log --oneline -10
```

**バージョンタイプの判定基準:**
- **patch (0.1.1 → 0.1.2)**: バグ修正のみ（`fix:`, `docs:` など）
- **minor (0.1.1 → 0.2.0)**: 新機能追加（`feat:` など）
- **major (0.1.1 → 1.0.0)**: 破壊的変更（`BREAKING CHANGE`）

ユーザーに次のバージョンを提案し、確認を取ってください。

### 4. CHANGELOG.md更新

最新のコミットログから変更内容を抽出し、CHANGELOG.mdに追記します：

```bash
# 前回のリリースタグから現在までのコミットを取得
git log $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")..HEAD --oneline
```

CHANGELOG.mdのフォーマット:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- 新機能の説明

### Fixed
- バグ修正の説明

### Changed
- 変更内容の説明
```

**注意**: ファイル末尾のリンク参照も更新してください：
```markdown
[Unreleased]: https://github.com/hummer98/firex/compare/vX.Y.Z...HEAD
[X.Y.Z]: https://github.com/hummer98/firex/compare/vX.Y.Z-1...vX.Y.Z
```

### 5. CHANGELOG更新のコミット（npm version前に実行）

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for vX.Y.Z

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 6. バージョン更新・ビルド・タグ作成

npm versionコマンドで一括処理（package.jsonの`version`と`postversion`スクリプトが自動実行）：

```bash
# patch/minor/major のいずれかを選択
npm version patch  # または minor / major
```

このコマンドは以下を自動実行します：
1. package.jsonのversion更新
2. `npm run build` の実行（prepareスクリプト経由）
3. git commit（バージョンタグ付き）
4. git tag vX.Y.Z
5. git push && git push --tags（postversion経由）

### 7. GitHubリリース作成

リリースノートをCHANGELOGから抽出し、GitHubリリースを作成：

```bash
gh release create vX.Y.Z \
  --title "firex vX.Y.Z" \
  --notes "[CHANGELOGから抽出したリリースノート]"
```

### 8. npmへの公開（--publish指定時のみ）

**`--publish` が指定されている場合のみ実行:**

```bash
npm publish
```

**注意**: 初回公開時やスコープ付きパッケージの場合は `npm publish --access public` が必要な場合があります。

**`--publish` が指定されていない場合:**
- このステップをスキップ
- ユーザーに「npm publishはスキップされました。公開する場合は `/release --publish` を実行してください」と通知

### 9. ローカルインストール（--local指定時のみ）

**`--local` が指定されている場合のみ実行:**

```bash
npm link
```

これにより、ローカル環境で `firex` コマンドがグローバルに使用可能になります。

**`--local` が指定されていない場合:**
- このステップをスキップ

### 10. 完了報告

ユーザーに以下を報告：
- リリースバージョン
- GitHubリリースURL
- **--publish指定時のみ**: npmパッケージURL: https://www.npmjs.com/package/@hummer98/firex
- **--local指定時のみ**: ローカルインストール完了の旨
- 主な変更内容のサマリー

## 注意事項

- このコマンドはfirexプロジェクト専用です
- 必ずmasterブランチで実行してください
- リリース作成前にテストが通っていることを確認してください
- バージョン番号は手動で確認・承認を得てから進めてください
- npm publish時はnpm loginが完了していることを確認してください

## エラー処理

各ステップでエラーが発生した場合:
1. エラー内容をユーザーに報告
2. 修正方法を提案
3. 必要に応じてロールバック手順を案内

### npm publish失敗時のロールバック

```bash
# ローカルタグの削除
git tag -d vX.Y.Z

# リモートタグの削除（プッシュ済みの場合）
git push origin :refs/tags/vX.Y.Z

# コミットの取り消し（必要に応じて）
git reset --hard HEAD~1
```

## クイックリファレンス

```bash
# タグ作成まで（npm publishなし）
npm test && npm run typecheck
# CHANGELOG.md を編集
git add CHANGELOG.md && git commit -m "docs: update CHANGELOG for vX.Y.Z"
npm version patch  # または minor / major
gh release create vX.Y.Z --title "firex vX.Y.Z" --notes "..."

# npm公開も含める場合
npm publish

# ローカルインストール
npm link
```
