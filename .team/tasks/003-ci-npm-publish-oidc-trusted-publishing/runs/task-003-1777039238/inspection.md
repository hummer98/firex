# inspection.md — task-003 検品レポート

## 総合判定

**GO / NOGO**: **GO**

## 受け入れ基準チェック

| # | 基準 | 判定 | 備考 |
|---|---|---|---|
| 1 | `release.yml` が cmux-team 準拠の OIDC 方式 | ✅ GO | 下記サブ項目すべて満足 |
| 1a | `permissions: id-token: write` 追加 | ✅ GO | L11 で追加確認 |
| 1b | `sed` で `_authToken` プレースホルダ削除 | ✅ GO | L66: `sed -i '/_authToken/d' "$NPM_CONFIG_USERCONFIG" 2>/dev/null \|\| true` |
| 1c | `npm publish --provenance --access public` | ✅ GO | L67 |
| 1d | `NODE_AUTH_TOKEN` / `secrets.NPM_TOKEN` 参照削除 | ✅ GO | grep で `NO_LEFTOVER` 確認 |
| 1e | awk + `gh release create` で CHANGELOG 抽出 | ✅ GO | L72-77 (env: GH_TOKEN, awk パターン正しい) |
| 1f | `verify-versions` job が無改変で残存 | ✅ GO | L13-38 一切変更なし（diff で確認） |
| 1g | `workflow_dispatch` トリガー追加 | ✅ GO | L7 で追加 |
| 2 | `release.yml.disabled` が存在しない | ✅ GO | 元から存在せず（vacuously satisfied） |
| 3 | `package.json.publishConfig` に `{access: "public", provenance: true}` | ✅ GO | L36-39、`node -p` 出力で確認 |
| 4 | `release.md` から手動 `npm publish` 案内が全削除 | ✅ GO | plan.md E 節 修正 1〜5 すべて反映 |
| 4a | 修正 1: ステップ 7 を「CI 完走を待つ」に差し替え | ✅ GO | L141-157 |
| 4b | 修正 2: ステップ 6.5 の publish コマンドを provenance 化 + Release 補足 | ✅ GO | L129-130 |
| 4c | 修正 3: ステップ 9 の「手動公開が必要な場合」削除 | ✅ GO | L179 |
| 4d | 修正 4: 注意事項の「npm publishは手動で実行してください」削除 | ✅ GO | L183-187 から消失確認 |
| 4e | 修正 5: クイックリファレンスの「# 手動で公開する場合」2 行削除 | ✅ GO | L218-220（gh run list 行のみ残存） |
| 5 | CHANGELOG.md フォーマットが awk 抽出パターンと適合 | ✅ GO | `VERSION=0.7.8` で `### Changed` セクション抽出成功 |
| 6 | `npm run typecheck` / `npm test` 全パス | ✅ GO | typecheck OK、1039/1039 tests passed |
| 7 | YAML 文法正しい | ✅ GO | `yaml.safe_load` で `YAML OK` |

## 検品コマンド実行結果

| # | コマンド | 結果 |
|---|---|---|
| 1 | `npm run typecheck` | ✅ PASS（tsc --noEmit エラー無し） |
| 2 | `npm test` | ✅ PASS（59 test files / 1039 tests / 9.5s） |
| 3 | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"` | ✅ PASS（`YAML OK`） |
| 4 | `VERSION=0.7.8 awk ... CHANGELOG.md` | ✅ PASS（`### Changed` 以降が抽出された） |
| 5 | `node -p "require('./package.json').publishConfig"` | ✅ PASS（`{ access: 'public', provenance: true }`） |
| 6 | `grep -E "NPM_TOKEN\|NODE_AUTH_TOKEN" release.yml` | ✅ PASS（`NO_LEFTOVER`） |
| 7 | `grep "手動で公開\|手動で実行\|npm publish" release.md` | ✅ PASS（マッチは CI 経由言及の 3 行のみ。「手動で〜」は完全に消えている） |
| 8 | `grep -E "id-token: write\|_authToken\|--provenance" release.yml` | ✅ PASS（3 要素すべて検出） |
| 9 | `ls .github/workflows/ \| grep disabled` | ✅ PASS（`NO_DISABLED_FILE`） |
| 10 | `git stash && npm run lint`（pre-existing failure 検証） | ✅ 確認（master 状態でも `ESLint couldn't find a configuration file.` で同じ失敗 → 本タスク無関係） |

## Critical findings（NOGO の場合のみ）

なし。

## Non-critical findings（GO でも記載可）

1. **release.md L139 の前置き文との重複感（軽微）**: ステップ 6.5 で「release.yml が自動で実行する内容」を 3 項目で説明し、ステップ 7（CI 完走を待つ）でも同じ内容を 4 項目で再掲している。読み手が「同じ事を 2 回読まされる」と感じる可能性はあるが、6.5 は「Plugin 配布の文脈」、7 は「実行待ち手順」として分離されているので機能的には問題ない。次回のドキュメント整理時に統合を検討してもよい（本タスクの範疇外）。

2. **lint pre-existing issue（ドキュメンテーション済み）**: `eslint.config.*` / `.eslintrc*` が repo ルートに存在せず `npm run lint` が常に失敗する。impl-notes.md にも記載済みで、master ブランチでも `git stash` 検証で再現確認済み。本タスクの責務外だが、別タスクで `eslint.config.js` を整備するか、`package.json` から `lint` スクリプトを削除する判断が将来必要。

3. **`provenance: true` フラグの冗長性（plan.md にも明記済み）**: `package.json.publishConfig.provenance: true` と CI の `--provenance` フラグは冗長だが、ローカル誤 publish 時の保険として残す方針で plan.md D 節に記載済み。問題なし。

4. **`prepublishOnly` との二重実行（懸念せず）**: `package.json` の `prepublishOnly: "npm run test && npm run build"` は CI workflow の `npm test` / `npm run build` ステップと重複するが、可視性向上のため CI で明示するのは plan.md C 節の判断通り。約 10〜30 秒の追加コストで問題なし。

5. **`needs: verify-versions` の関係性**: `release` job が `needs: verify-versions` を保持しており、整合検証失敗時に publish が走らない設計が維持されている（L41）。問題なし。

6. **permissions の最小性**: `contents: write`（GitHub Release 作成用）+ `id-token: write`（OIDC）の最小構成。過剰な権限なし。

## 結論

plan.md A〜I 節のすべての指示が完全に実装されており、受け入れ基準（実装可能な 6 項目すべて + vacuously satisfied の 1 項目）を満たしている。検品コマンド 10 件すべて期待通り。lint 失敗は master ブランチ由来の pre-existing issue であり本タスクの差分は src/ を一切触っていないため対象外。**マージ可能（GO）**。
