# plan.md — task-003: npm 自動 publish を OIDC Trusted Publishing に移行

## 前提（実装者が最初に読むこと）

- タスク本文 (`.team/tasks/003-ci-npm-publish-oidc-trusted-publishing/task.md`) は旧情報を含む。実態は以下:
  - `.github/workflows/release.yml` は **既に存在**（2 job: `verify-versions` → `release`）。**新規作成ではなく書き換え**。
  - `.github/workflows/release.yml.disabled` は **存在しない**。削除作業は不要（受け入れ基準は vacuously 満たされる）。
- 本タスクは設定変更のみ。実際の `npm publish` は実行しない。npm 側の Trusted Publisher 登録はユーザー完了済み。
- 参考実装: `~/git/cmux-team/.github/workflows/release.yml`（Implementer は Read ツールで確認すること）。

## A. 目標と成功基準

### 目標
`git push origin v<X.Y.Z>` をトリガーに、GitHub Actions が:
1. package.json / plugin.json / marketplace.json / タグのバージョン整合を検証（既存の `verify-versions` job を維持）
2. OIDC Trusted Publishing で `npm publish --provenance --access public` を実行（NPM_TOKEN 廃止）
3. CHANGELOG.md から `## [<VERSION>]` セクションを awk で抽出し `gh release create` で GitHub Release を作成

### 受け入れ基準（task.md L164-170 から転記 / 現状に合わせて達成方法を補足）
- [ ] `.github/workflows/release.yml` が cmux-team 準拠の OIDC 方式に**書き換えられている**
  - `permissions: id-token: write` 追加
  - `sed -i '/_authToken/d' "$NPM_CONFIG_USERCONFIG"` で setup-node の `.npmrc` から token プレースホルダを除去
  - `npm publish --provenance --access public`
  - `NODE_AUTH_TOKEN` / `secrets.NPM_TOKEN` 参照を削除
  - GitHub Release 作成を awk + `gh release create` 方式に差し替え
  - `workflow_dispatch` トリガーを追加
- [ ] `.github/workflows/release.yml.disabled` が存在しない（**既に満たされている**: 元々存在しない）
- [ ] `package.json` の `publishConfig` に `{ "access": "public", "provenance": true }` が設定されている
- [ ] `.claude/commands/release.md` から手動 `npm publish` の案内が削除され、CI 完走待ちステップが入っている
- [ ] CHANGELOG.md のフォーマットが awk 抽出に適合（**既に適合**: `## [0.7.8] - 2026-02-27` 形式で抽出成功を確認済み）
- [ ] `npm run typecheck` / `npm run lint` / `npm test` が全パス
- [ ] YAML 文法が正しい（`python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"` で検証）

## B. 変更ファイル一覧

| ファイル | 現状 | 目標 | 差分の要点 |
|---|---|---|---|
| `.github/workflows/release.yml` | 2 job 構成・NPM_TOKEN 方式・softprops/action-gh-release | 2 job 構成維持・OIDC 方式・awk + `gh release create` | permissions / publish ステップ / release 作成ステップを書き換え。`verify-versions` job はそのまま保持 |
| `package.json` | `publishConfig` 未設定 | `publishConfig: { access: "public", provenance: true }` を追加 | scripts ブロックの後に追記（key 順序は `homepage` 直後あたりが自然） |
| `.claude/commands/release.md` | 手動 `npm publish` 案内が 4 箇所残る | CI 完走待ちステップに差し替え | L141-149 / L167-173 / L181 / L216-217 を修正（詳細は E 節） |
| `.github/workflows/release.yml.disabled` | 存在しない | — | **作業不要**（task.md の前提ズレ） |
| `CHANGELOG.md` | `## [X.Y.Z] - YYYY-MM-DD` 形式 | 変更なし | awk `/^## \[VERSION\]/` と適合することを確認済み |

## C. `.github/workflows/release.yml` の具体設計

### 設計方針
- 既存の `verify-versions` job は**そのまま保持**（タグと package/plugin/marketplace の整合を検証しており、そのまま有用）。
- `release` job のみを書き換える。`needs: verify-versions` は維持。
- テスト・ビルドは workflow で明示する（可視性向上。`prepublishOnly` に任せると publish ログに埋もれる）。
- `cache: 'npm'` は維持。
- GitHub Release 作成は cmux-team 準拠の awk + `gh release create` に変更（CHANGELOG からリリースノートを取れる方が firex の運用に適合）。
- prerelease 判定（alpha / beta / rc）は現状の `softprops` で実装されているが、cmux-team 方式には無い。**今回は省略**して cmux-team と揃える（firex で prerelease タグ運用が確立していないため、必要になったら別タスクで追加）。

### 最終 YAML（Implementer はほぼこのまま書けばよい。`verify-versions` job は一切触らない）

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

permissions:
  contents: write
  id-token: write

jobs:
  verify-versions:
    # ← 現状のまま変更しない。L12-36 をそのまま残す
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.extract.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - name: Extract tag version
        id: extract
        run: |
          TAG="${GITHUB_REF#refs/tags/v}"
          echo "version=$TAG" >> $GITHUB_OUTPUT
      - name: Verify package.json / plugin.json / marketplace.json versions match tag
        env:
          TAG_VERSION: ${{ steps.extract.outputs.version }}
        run: |
          PKG=$(node -p "require('./package.json').version")
          PLUGIN=$(node -p "require('./.claude-plugin/plugin.json').version")
          MARKETPLACE=$(node -p "require('./.claude-plugin/marketplace.json').plugins.find(p => p.name === 'firex').version")
          echo "tag=$TAG_VERSION package.json=$PKG plugin.json=$PLUGIN marketplace.json=$MARKETPLACE"
          if [ "$PKG" != "$TAG_VERSION" ] || [ "$PLUGIN" != "$TAG_VERSION" ] || [ "$MARKETPLACE" != "$TAG_VERSION" ]; then
            echo "::error::version mismatch. All four must match." >&2
            exit 1
          fi

  release:
    needs: verify-versions
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to npm (OIDC Trusted Publishing)
        run: |
          # setup-node が書き込む .npmrc の _authToken プレースホルダを削除し
          # npm に OIDC 認証を使わせる
          sed -i '/_authToken/d' "$NPM_CONFIG_USERCONFIG" 2>/dev/null || true
          npm publish --provenance --access public

      - name: Extract changelog and create GitHub Release
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          VERSION="${GITHUB_REF_NAME#v}"
          NOTES=$(awk "/^## \[${VERSION}\]/{found=1; next} /^## \[/{if(found) exit} found" CHANGELOG.md)
          gh release create "$GITHUB_REF_NAME" \
            --title "$GITHUB_REF_NAME" \
            --notes "$NOTES"
```

### 書き換えの要点（旧→新の差分サマリ）
| 項目 | 旧 | 新 |
|---|---|---|
| トリガー | `push: tags: 'v*'` のみ | `+ workflow_dispatch` |
| permissions | `contents: write` | `+ id-token: write` |
| `registry-url` | 既にあり | 維持 |
| publish 前処理 | なし | `sed -i '/_authToken/d' "$NPM_CONFIG_USERCONFIG"` |
| publish コマンド | `npm publish --access public` | `npm publish --provenance --access public` |
| publish 認証 | `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` | **削除**（OIDC） |
| GitHub Release | `softprops/action-gh-release@v1` (`generate_release_notes: true`) | `gh release create` + awk で CHANGELOG から抽出 |
| prerelease 判定 | `contains(github.ref, 'alpha'/'beta'/'rc')` | **削除**（運用実態なし。必要になれば別タスク） |

### 注意点（Implementer 向け）
- `sed -i` のコメント行（`#` で始まる説明）は YAML の `run: |` ブロック内ではシェルコメントとして扱われる。そのまま書いて OK。
- `sed -i` の後の `2>/dev/null || true` は「token プレースホルダが既に存在しない/ファイルが未生成」ケースのフォールバック。削除してはいけない。
- `GH_TOKEN` は `github.token`（自動発行）で十分。`secrets.GITHUB_TOKEN` も同値だが、`github.token` 表記が cmux-team 準拠。
- 現状 `.disabled` ファイルは存在しないので `git rm` 不要。

## D. `package.json` の変更

### 追加内容
`scripts` ブロックの後、`keywords` の前（または既存構造上自然な位置）に以下を追加:

```json
"publishConfig": {
  "access": "public",
  "provenance": true
}
```

### 配置位置の具体指定
現状 package.json L14-35 が `scripts`、L36-52 が `keywords`。**L35（scripts の閉じ `}` 行）の直後、L36（`"keywords"`）の前**に挿入する。

### 追加後のインデント・カンマに注意
- scripts 閉じ `}` 行の末尾に `,` を維持
- `publishConfig` の閉じ `}` 行の末尾に `,` を追加
- インデントは 2 スペース（既存と揃える）

### 注意
- 既存 `publishConfig` は**無い**ため、新規追加のみ（マージ処理は発生しない）。
- `provenance: true` は `npm publish --provenance` フラグと冗長だが、両方指定しても害はない。ローカルで誤って `npm publish` しても provenance 付きになることを狙ってブレークダウン耐性として残す。

## E. `.claude/commands/release.md` の変更

### 変更箇所（行番号レベルで具体指定）

#### 【修正 1】L141-149: ステップ 7「GitHubリリース作成」を削除

現状 L141-149:
```markdown
### 7. GitHubリリース作成

リリースノートをCHANGELOGから抽出し、GitHubリリースを作成：

```bash
gh release create vX.Y.Z \
  --title "firex vX.Y.Z" \
  --notes "[CHANGELOGから抽出したリリースノート]"
```
```

→ **ステップ 7 を「CI 完走待ち」に差し替える**:

```markdown
### 7. CI 完走を待つ

タグ push 後、GitHub Actions の `release.yml` が自動で以下を実行する:
1. バージョン整合検証
2. テスト・ビルド
3. OIDC で `npm publish --provenance --access public`
4. CHANGELOG から該当バージョンを抽出して GitHub Release 作成

CI 完走を確認:

```bash
sleep 5
RUN_ID=$(gh run list --workflow=release.yml --limit=1 --json databaseId --jq '.[0].databaseId')
gh run watch ${RUN_ID} --exit-status
```

CI が成功すれば npm 公開 & GitHub Release 作成まで完了している。失敗時は `gh run view ${RUN_ID} --log-failed` でログ確認。
```

#### 【修正 2】L124-139: ステップ 6.5 の整理（軽微）

現状 L126 で「`.github/workflows/release.yml` が自動で以下を実行する」とあり内容は概ね正しいが、以下のみ更新:
- L129 の `npm publish --access public` → `npm publish --provenance --access public`（OIDC 化の明記）
- L130 「GitHub Release を作成」の直前に「（CHANGELOG の該当バージョンセクションをリリースノートとして抽出）」を補足

#### 【修正 3】L164-173: ステップ 9「完了報告」の文言修正

現状 L171-172:
```markdown
- npm 公開状況: CI (release.yml) が自動実行。失敗時は `gh run list --workflow=release.yml` で確認。
  - 手動公開が必要な場合: `npm publish --access public`
```

→ 「手動公開が必要な場合」の行を削除。OIDC 移行後は手動 publish の運用を想定しないため。

```markdown
- npm 公開状況: CI (release.yml) が OIDC で自動 publish。GitHub Release も CI が自動作成。
```

※ ステップ番号が 7→CI 完走、8→ローカルインストール、9→完了報告、と shift する（現状 8 のローカルインストールは内容維持。番号のみ再確認）。

#### 【修正 4】L181: 「npm publishは手動で実行してください」を削除

現状 L181:
```markdown
- npm publishは手動で実行してください（npm loginが完了していることを確認）
```

→ **行ごと削除**。OIDC 方式では手動 publish も npm login も不要。

#### 【修正 5】L213-217: クイックリファレンスの手動 publish 案内を削除

現状 L213-217:
```markdown
# タグ push 後、release.yml が自動で npm publish + GitHub Release 作成
gh run list --workflow=release.yml --limit 3

# 手動で公開する場合
npm publish --access public
```

→ L216「# 手動で公開する場合」と L217「npm publish --access public」の 2 行を削除。

```markdown
# タグ push 後、release.yml が自動で npm publish + GitHub Release 作成
gh run list --workflow=release.yml --limit 3

# プラグインバージョン手動同期（通常は不要）
npm run sync:plugin-version
```

### 変更しない箇所
- L1-123: 前提条件〜npm version までは変更不要。
- L124-139: ステップ 6.5（修正 2 の軽微更新のみ）
- L150-163: ステップ 8（ローカルインストール）は内容維持（番号のみ 7→8 のまま保持で OK。修正 1 でステップ 7 を差し替えたので整合）
- L183-201: エラー処理・ロールバック手順

### ステップ番号の整合性チェック
- 旧: 1→2→3→4→5→6→6.5→7(GitHubリリース)→8(ローカル)→9(完了)
- 新: 1→2→3→4→5→6→6.5→7(CI完走待ち)→8(ローカル)→9(完了)

番号は保持される。

## F. 削除対象の確認

- `.github/workflows/release.yml.disabled` は **現状のファイルシステムに存在しない**（`ls .github/workflows/` で確認済み: `ci.yml / delete-merged-branches.yml / release.yml / version-bump.yml` のみ）。
- よって task.md L158-160 の「### 5. `release.yml.disabled` の削除」と受け入れ基準 L165 は**作業不要で満たされる**。
- Implementer はこの事実を commit message / PR description に明記すること（レビュアが混乱しないよう「task.md の前提ズレ。`.disabled` は元々存在しない」と一言添える）。

## G. 検証手順（Implementer が最後に実行するコマンド）

```bash
# 1. typecheck / lint / test
npm run typecheck
npm run lint
npm test

# 2. YAML 文法チェック（yamllint が無い環境でも動く）
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"

# 3. awk 抽出パターンの動作確認（既存バージョンで抽出成功することを確認）
VERSION=0.7.8 awk "/^## \[${VERSION}\]/{found=1; next} /^## \[/{if(found) exit} found" CHANGELOG.md
# → "### Changed" 以降のエントリが出力されれば OK

# 4. package.json の JSON 整合性
node -p "require('./package.json').publishConfig"
# → { access: 'public', provenance: true } が出力されれば OK

# 5. 変更差分の目視確認
git diff .github/workflows/release.yml
git diff package.json
git diff .claude/commands/release.md
```

すべてパスしたらタスク完了。**実際の `npm publish` / タグ push は実行しない**（次回 `/release` 実行時に動作確認する）。

## H. 非対象（やらないこと）

- **実際のリリース実行**（`git tag` / `git push --tags` / `npm publish`）— 設定のみで完結
- **CHANGELOG.md 過去エントリの書き換え** — 現行フォーマットが awk と適合済み
- **バージョンバンプ** — package.json の `version` は変更しない
- **2FA モード変更** — npm 側で OIDC Trusted Publisher 登録済み（ユーザー完了）
- **prerelease タグ判定の移植** — 旧 release.yml の `contains(github.ref, 'alpha' / 'beta' / 'rc')` 判定は運用実態が無いため削除のみ。必要になれば別タスク
- **ci.yml との重複整理** — ci.yml は `push: branches: [main, develop]` と `pull_request` のみ発火。tag push には反応しないため release.yml で test/build を再実行しても二重実行にならない。整理不要
- **CLAUDE.md / skills/firex 配下の更新** — 本タスクの範疇外

## I. 実装順序の推奨

1. `.github/workflows/release.yml` を書き換え（`verify-versions` job は無改変で残す）
2. `package.json` に `publishConfig` 追加
3. `.claude/commands/release.md` の 5 箇所を修正
4. 検証コマンド（G 節）を実行
5. コミット（例: `ci: release workflow を OIDC Trusted Publishing に移行 (task-003)`）
   - コミットメッセージに「task.md の `.disabled` 削除前提は既に満たされている」ことを記載

以上。
