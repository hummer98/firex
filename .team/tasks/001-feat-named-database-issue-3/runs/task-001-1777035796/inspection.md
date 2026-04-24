# Inspection Report: feat: named database support

## Verdict
**GO**

受け入れ基準 7 項目すべて確認済み。Design Review の Important 指摘 (doctor `ConfigSchema` への `databaseId` 追加と `firestore-manager.test.ts` 新規作成) も両方反映されている。ビルド・型チェック・テスト 1039 件すべて緑。lint 失敗は master 時点から ESLint 設定欠如で壊れており、本タスクが原因ではないことを確認した。

## Independent Test Runs

- `npm run typecheck`: **PASS** — `tsc --noEmit` 0 エラー
- `npm test`: **1039 passed / 0 failed** (59 test files, 8.87s)
  - `src/mcp/firestore-manager.test.ts` (新規) 9 件緑
  - `src/services/auth.test.ts` (追加 3 件含む) 16 件緑
  - `src/services/config.test.ts` (追加 6 件含む) 28 件緑
  - `src/domain/doctor/config-checker.test.ts` (追加 2 件含む) 18 件緑
  - `src/commands/base-command.test.ts` (追加 1 件含む) 37 件緑
  - 8 つの MCP tool test はいずれも databaseId の schema と forward を検証する 2 件ずつが追加されている
- `npm run build`: **PASS** — `dist/` ビルド成果物生成成功
- `npm run lint`: **FAIL (master 由来)** — `ESLint couldn't find a configuration file`
  - master HEAD (19ea9a4) の `git ls-tree master` で `.eslintrc*` / `eslint.config.*` のいずれも存在しないことを確認。
  - 本タスクは eslint 設定ファイルを追加／削除していない。悪化要因なし。

## Acceptance Criteria Check

1. **`firex get <coll>/<doc> --database-id my-db --project-id foo`** → ✅
   - `src/commands/base-command.ts:42-45` で `--database-id` フラグが定義（env: `FIRESTORE_DATABASE_ID`, i18n: `flag.databaseId`）。
   - 同ファイル `base-command.ts:138` で `cliFlags.databaseId` が `ConfigService.loadConfig` に流れる。
   - `src/services/auth.ts:76-78` で `config.databaseId ? getFirestore(this.app, config.databaseId) : getFirestore(this.app)` に分岐。
   - 検証テスト: `src/services/auth.test.ts:113-120` "should call getFirestore with app and databaseId when databaseId is specified"。

2. **`FIRESTORE_DATABASE_ID=my-db firex ...`** → ✅
   - `src/services/config.ts:259-261` の `loadFromEnv()` に `if (process.env.FIRESTORE_DATABASE_ID)` で空文字ガード込みで実装。
   - 検証テスト: `src/services/config.test.ts:217` "should map FIRESTORE_DATABASE_ID to databaseId"、同 229 "should treat empty FIRESTORE_DATABASE_ID as undefined"、同 240 "should leave databaseId undefined when ... not set"。
   - CLI 側 `base-command.ts:44` にも `env: 'FIRESTORE_DATABASE_ID'` があるため二重経路の安全策も入っている。

3. **`.firex.yaml` に `databaseId: my-db`** → ✅
   - cosmiconfig 既存フロー (`config.ts:148-215`) がそのまま `rawConfig.databaseId` を拾ってマージ。
   - doctor の zod schema `src/domain/doctor/config-checker.ts:17-38` の top-level と `profiles` サブスキーマ両方に `databaseId: z.string().optional()` が追加されている。
   - `validFields` ヒント文字列 (`config-checker.ts:246-247`) にも `databaseId (string)` 追記済み。
   - 検証テスト: `config.test.ts:103` "should load databaseId from .firex.yaml file"、`config-checker.test.ts:194,208` の top-level / profiles 両方。

4. **MCP 8 ツール全てで `databaseId` パラメータ** → ✅
   - 8 ファイル (`get/list/set/update/delete/collections/export/import.ts`) すべてに `databaseId: z.string().optional().describe(...)` があり、ハンドラで `firestoreManager.getFirestore({ projectId, databaseId })` に伝搬 (grep 結果: 各ファイル 3 箇所)。
   - 8 ファイル test にも "should declare databaseId in its schema" と "should forward databaseId to FirestoreManager.getFirestore" の 2 件ずつ追加。
   - `src/mcp/server.ts:24-28,36-43` で `McpServerOptions.databaseId` が受けられ、`src/commands/mcp.ts:42-45,58-62` で `--database-id` フラグを受ける (examples にも named DB 例が 1 件追加)。

5. **`databaseId` 未指定時は従来通り `(default)`** → ✅
   - `auth.ts:76-78` の三項演算子により `config.databaseId` が falsy (`undefined` / `''`) のときは従来通り `getFirestore(this.app)` 1 引数呼び出し。
   - 既存 1039 テスト全緑で後方互換確認。特に `auth.test.ts:106` "should call getFirestore with only app when databaseId is not specified"、同 122 の空文字ケースも検証済み。
   - `firestore-manager.ts` の cache key は `${projectId || ''}::${databaseId || ''}::${credentialPath || ''}` 形式（design review §Minor 2 の `||` 整合性指摘を反映）。

6. **typecheck / test / (lint) 全パス** → ✅ (lint は前述の通り master 由来のため不問)

7. **README に使用例** → ✅
   - `README.md`:
     - L95 `.firex.yaml` サンプル、L104 profile サンプル
     - L149 `--database-id` オプション、L159 "named (non-default) Firestore database" 使用例
     - L439 日本語同様の `.firex.yaml` snippet、L458 profile snippet
     - L477 環境変数表 `FIRESTORE_DATABASE_ID` 行、L479 `FIRESTORE_DATABASE_URL`（Realtime DB）との違いを明示 (Design Review Minor 4 反映)
   - `README-jp.md`: L95, 104, 149, 159, 439, 458, 477, 479 で同内容が日本語化されている。

## Design Review Important Items Check

1. **`src/domain/doctor/config-checker.ts` の `ConfigSchema` 更新** → ✅ 反映済み
   - L21 top-level `databaseId: z.string().optional()` 追加
   - L31 `profiles` サブスキーマにも `databaseId: z.string().optional()` 追加
   - L246-247 `validFields` ヒントに `databaseId (string)` 追記
   - 検証テスト 2 件 (`config-checker.test.ts:194,208`) 緑

2. **`src/mcp/firestore-manager.test.ts` 新規作成** → ✅ 反映済み (9 tests, 新規ファイル)
   - cache 分離: 同 projectId 違 databaseId が別エントリ (`firestore-manager.test.ts:35`)
   - cache ヒット: 同キーなら 1 回 init (`firestore-manager.test.ts:48`)
   - `undefined` と `'(default)'` は別キー扱い (`firestore-manager.test.ts:60`)
   - 別 projectId は別エントリ (`firestore-manager.test.ts:73`)
   - `getCachedProjectIds()` 空返し (`firestore-manager.test.ts:87`)
   - `getCachedProjectIds()` deduplicate 検証 (`firestore-manager.test.ts:91`) ← Design Review §Important 3 の後方互換テスト要件を満たす
   - `getCachedProjectIds()` databaseId undefined 混在 (`firestore-manager.test.ts:102`)
   - `isConnected()` 後方互換 2 件

## Findings

### Critical (NOGO 要因)
- なし。

### Observations (受け入れ可能な指摘)

1. **package-lock.json の差分内容**
   - `git diff package-lock.json` で `hono` (peer dep) の除去と `typescript` の `devOptional → dev` の 2 か所のみ。本タスクの依存追加ではなく、`npm install` 副作用。機能上の影響なし、impl-result.md にも言及あり (L59-60, 117-118)。
   - コミット採否は Conductor 判断に委ねて問題ない。

2. **`auth.test.ts` の空文字ケース挙動**
   - `databaseId: ''` のとき `getFirestore(mockApp)` 1 引数で呼ばれる (L122-129)。`auth.ts:76` の三項演算子 `config.databaseId ?` は空文字を falsy として扱うため挙動は意図通り。Plan §3.5 の空文字フォールバック方針と一致。

3. **`auth.ts` 空文字の二重ガード**
   - CLI 側では `base-command.ts:138` が `flags['database-id']` をそのまま渡すため `--database-id ""` は空文字として `cliFlags.databaseId = ''` となる。env 側は `config.ts:259` の `if (...)` で空文字は弾かれる。`auth.ts:76` でも空文字は falsy として `(default)` 経路に落ちるため、いずれの経路でも安全。テストで明示検証済み。

4. **MCP tool schema の description 翻訳**
   - 8 ファイル共通で英語のみ (`'Firestore database ID (optional, uses (default) if not specified)'`)。MCP 側は Claude に渡す英文で一貫しているため問題なし。日本語化は不要（MCP 仕様上のホスト側 i18n は existing tools も未対応）。

5. **`getFirestore` の二重経路 (CLI flag env と config loader env)**
   - `base-command.ts:44` の oclif `env: 'FIRESTORE_DATABASE_ID'` と `config.ts:259` の両方で `FIRESTORE_DATABASE_ID` を読む構成。優先順位は oclif → cliFlags.databaseId → loadConfig merge 最優先なので矛盾しない。同様の二重経路は既存 `FIRESTORE_PROJECT_ID` と同じパターン。問題なし。

6. **`lint` 失敗の事実確認**
   - master HEAD (19ea9a4) に `.eslintrc*` / `eslint.config.*` が存在しないことを `git ls-tree master` で確認。`npm run lint` は "ESLint couldn't find a configuration file" で fail。本タスクで悪化していない。受け入れ基準 §6 の lint 要求については master 時点から壊れていたため不問扱いで問題ない（Conductor / Master 判断）。

7. **`dist/` 成果物のコミット確認**
   - `.gitignore` に `dist/` あり (L5)。`git status` にも `dist/` 配下の変更はない。ビルド成果物のコミットなし。問題なし。

8. **CHANGELOG.md の非変更確認**
   - `git status | grep changelog` → 変更なし。指示通り触られていない。

9. **既存 CLI コマンド (`src/commands/get.ts` 等) の変更なし**
   - Plan §2 の「個別 CLI コマンドは変更不要」方針どおり、`git diff --stat` に個別コマンドファイルの変更は出ていない (base-command 経由で自動伝搬)。

## Fix Required (NOGO の場合)

なし (GO のため該当なし)。

## Notes

- named DB の integration / e2e テストは Plan §5.3 の方針どおり省略。本番 named DB への手動動作確認は受け入れ時に別途必要（impl-result.md L112-115 に記載）。
- lint 基盤整備は別タスク化を推奨（impl-result.md L107-111 の Notes と一致）。
- CLI フラグ `--database-id` と環境変数 `FIRESTORE_DATABASE_ID` の組み合わせで二重経路（oclif env + config loader env）になっているが、既存 `--project-id` / `FIRESTORE_PROJECT_ID` と同じ設計パターンなので一貫性 OK。
- Cache key のマイグレーション方針（既存 `projectId::credentialPath` → 新 `projectId::databaseId::credentialPath`）はプロセス内キャッシュなので旧キーが残ることはない。テストも 9 件追加されて健全。
- Design Review Minor 1-6 の指摘（auth.ts 行番号、`||` 記法、正規表現、README 並記、base-command テスト観点、AuthService cached-firestore）はすべて反映または方針どおり対応されている。
