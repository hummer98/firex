---
id: 003
title: ci: npm 自動 publish を OIDC Trusted Publishing で有効化
priority: medium
depends_on: [001, 002]
created_by: surface:1031
created_at: 2026-04-24T13:31:21.696Z
---

## タスク
# ci: npm 自動 publish を OIDC Trusted Publishing で有効化

## 背景

現状の firex は `/release` スキルの最終ステップで手動 `npm publish --access public` を実行する運用。以前は `.github/workflows/release.yml.disabled` という自動 publish ワークフロー（旧式の `NPM_TOKEN` 方式）が用意されていたが、`.disabled` サフィックスで無効化されている。

姉妹プロジェクト `cmux-team`（`~/git/cmux-team`）では **OIDC Trusted Publishing** 方式でタグ push → 自動 `npm publish --provenance --access public` が動いている。firex にも同じ仕組みを移植する。

**前提:** npm 側での Trusted Publisher 登録はユーザーが既に完了済み（Master 確認済み）。本タスクはコード/設定側の対応のみ行う。

## ゴール

`git push origin v<X.Y.Z>` でタグを push すれば、GitHub Actions が自動的に:
1. テスト・ビルドを実行
2. OIDC 認証で npm registry に publish
3. CHANGELOG から該当バージョンのセクションを抽出して GitHub Release を作成

`/release` スキルは CHANGELOG 更新 → タグ push までを担当し、それ以降は CI 任せとなる状態を作る。

## 参考: cmux-team の実装

参考元: `~/git/cmux-team/.github/workflows/release.yml` と `~/git/cmux-team/.claude/commands/release.md`

cmux-team の release.yml の要点:
- トリガー: `push: tags: 'v*'` + `workflow_dispatch`
- `permissions: contents: write, id-token: write`
- `actions/setup-node@v4` で `registry-url: https://registry.npmjs.org`
- setup-node が書き込む `.npmrc` の `_authToken` プレースホルダーを sed で削除
- `npm publish --provenance --access public`
- awk で `CHANGELOG.md` から `## [VERSION]` セクションを抽出
- `gh release create "$GITHUB_REF_NAME" --title "$GITHUB_REF_NAME" --notes "$NOTES"`

firex は cmux-team と違い:
- 純 npm プロジェクト（bun 不要）
- tsup でビルド
- `prepare` / `prepublishOnly` スクリプト既存

## 実装方針

### 1. `.github/workflows/release.yml` の作成

`release.yml.disabled` を削除し、新しい `release.yml` を作成する（`mv` ではなく新規に書き換える方が安全。旧版は NPM_TOKEN 方式で内容が古い）。

概略（最終的な記述は Agent が判断してよい）:

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
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: https://registry.npmjs.org
          cache: 'npm'

      - run: npm ci

      - run: npm test
      - run: npm run typecheck
      - run: npm run build

      - name: Publish to npm (OIDC Trusted Publishing)
        run: |
          sed -i '/_authToken/d' "$NPM_CONFIG_USERCONFIG" 2>/dev/null || true
          npm publish --provenance --access public

      - name: Extract changelog and create GitHub Release
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          VERSION="\${GITHUB_REF_NAME#v}"
          NOTES=\$(awk "/^## \\[\${VERSION}\\]/{found=1; next} /^## \\[/{if(found) exit} found" CHANGELOG.md)
          gh release create "\$GITHUB_REF_NAME" \\
            --title "\$GITHUB_REF_NAME" \\
            --notes "\$NOTES"
```

**注意:**
- `prepublishOnly: "npm run test && npm run build"` が既に package.json にあるので、`npm publish` 前に test/build が自動で走る。明示的に `npm test` / `npm run build` を workflow に書くかは Agent 判断（可視性のためには明示推奨）
- integration/e2e テストは Firestore Emulator が必要。デフォルトの `npm test` が unit のみで完結することを確認（package.json L17: `"test": "vitest --run"` — emulator を要求しないはず）
- 念のため `npm run typecheck` も CI で走らせる（現状 ci.yml で既に走っているかもしれないので重複回避を検討）

### 2. `package.json` の調整

`publishConfig` に以下を追加:

```json
"publishConfig": {
  "access": "public",
  "provenance": true
}
```

既存の `publishConfig` がある場合はマージ。

### 3. `.claude/commands/release.md` の書き換え

現状 L148-151, L159, L191-192 で手動 `npm publish --access public` を案内している箇所を削除し、代わりに CI 完走待ちステップに差し替える。

差し替え例（ステップ 7 の後に追加）:

```markdown
### 8. CI 完走を待つ

タグ push 後、GitHub Actions の release.yml が自動で npm publish と GitHub Release 作成を行う。CI 完走を確認:

\`\`\`bash
sleep 5
RUN_ID=\$(gh run list --workflow=release.yml --limit=1 --json databaseId --jq '.[0].databaseId')
gh run watch \${RUN_ID} --exit-status
\`\`\`

CI が成功すれば npm 公開 & GitHub Release 作成まで完了している。

### 9. ローカルインストール（--local 指定時のみ）
...
\`\`\`

そして L153-159 の注意書きから「npm publishは手動で実行してください」を削除。L191-192 の「npm公開（手動で実行）」セクションも削除または「CI で自動実行される」に変更。

### 4. CHANGELOG.md フォーマット確認

awk の抽出パターン `/^## \[VERSION\]/` に現状の CHANGELOG.md が適合するか確認:

\`\`\`bash
# 既存バージョンで抽出できるか試す
VERSION="0.7.8"
awk "/^## \\[\${VERSION}\\]/{found=1; next} /^## \\[/{if(found) exit} found" CHANGELOG.md
\`\`\`

適合しない場合、CHANGELOG の過去エントリを整形するのではなく、**今後のエントリが適合するフォーマットで書かれていればよい**（過去分の書き換えは不要）。現状のフォーマット（`## [X.Y.Z] - YYYY-MM-DD` 形式）が合っているかだけ確認し、合っていなければ `/release` スキルの CHANGELOG 生成手順側を修正する。

### 5. `.github/workflows/release.yml.disabled` の削除

新 `release.yml` を作成したら、古い `.disabled` ファイルを削除する。

## 受け入れ基準

- [ ] `.github/workflows/release.yml` が作成されており、cmux-team 準拠の OIDC 方式になっている
- [ ] `.github/workflows/release.yml.disabled` が削除されている
- [ ] `package.json` の `publishConfig` に `provenance: true` が設定されている
- [ ] `.claude/commands/release.md` から手動 `npm publish` の案内が削除され、代わりに CI 完走待ちステップが入っている
- [ ] CHANGELOG.md のフォーマットが awk 抽出に適合している（または release.md の CHANGELOG 生成手順が適合するフォーマットを生成するようになっている）
- [ ] `npm run typecheck` / `npm run lint` / `npm test` が全パス
- [ ] yaml の文法が正しい（`act` 等でのドライラン不要、`yamllint` で十分）

## 非対象

- **実際のリリース実行** — 本タスクでは設定のみ。動作確認は次回の `/release` 実行時に行う。このタスクで試しに publish しないこと
- **CHANGELOG の過去エントリ書き換え** — 互換性があるなら触らない
- **バージョンバンプ** — 本タスクは純粋に CI/設定の変更
- **2FA モード変更** — OIDC Trusted Publishing は 2FA 不要（npm 側で既に設定済み）

## 参考リンク

- cmux-team release workflow: `~/git/cmux-team/.github/workflows/release.yml`
- cmux-team release skill: `~/git/cmux-team/.claude/commands/release.md`
- npm OIDC Trusted Publishing docs: https://docs.npmjs.com/trusted-publishers
