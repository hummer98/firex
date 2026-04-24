# Implementation Result: feat: named database support

## Summary

GCP プロジェクト内の named database (`(default)` 以外) を CLI / 環境変数 / 設定ファイル /
MCP サーバーから一貫して扱えるようにした。`Config.databaseId` を新設し、`AuthService` が
`getFirestore(app, databaseId)` を条件分岐で呼ぶ構成とし、`FirestoreManager` の cache key を
`projectId::databaseId::credentialPath` に拡張。未指定時は従来通り `(default)` を使うため
後方互換。

## Changed Files

### 実装 (Modified)

- `src/services/config.ts` — `Config` に `databaseId?: string` を追加。`loadFromEnv()` で
  `FIRESTORE_DATABASE_ID` を読み、空文字は未指定扱い。`getCurrentConfig()` に `databaseId` を追加。
- `src/services/auth.ts` — L76 の `getFirestore(this.app)` を
  `config.databaseId ? getFirestore(this.app, config.databaseId) : getFirestore(this.app)` に差し替え。
- `src/mcp/firestore-manager.ts` — `GetFirestoreOptions` に `databaseId` を追加。`getCacheKey()`
  を `(projectId, databaseId, credentialPath)` の 3 引数に拡張し、既存の `||` 記法に合わせた
  `${projectId || ''}::${databaseId || ''}::${credentialPath || ''}` 形式に。`getCachedProjectIds()`
  は deduplicate して重複を排除。`initialize()` / `getFirestore()` が `databaseId` を伝搬。
- `src/commands/base-command.ts` — `baseFlags` に `--database-id` (env: `FIRESTORE_DATABASE_ID`,
  i18n: `flag.databaseId`) を追加。`initialize()` の `cliFlags` に `databaseId` を載せる。
- `src/commands/mcp.ts` — `static flags` に `--database-id` を追加し、`startMcpServer` に渡す。
  examples に named DB の例を 1 件追加。
- `src/mcp/server.ts` — `McpServerOptions` に `databaseId?: string` を追加し、
  `firestoreManager.initialize()` に渡す。
- `src/shared/i18n.ts` — `Messages` 型に `'flag.databaseId'` を追加。
  ja: "Firestore データベース ID (デフォルト: (default))"、en: "Firestore database ID (default: (default))"。
- `src/domain/doctor/config-checker.ts` — top-level / `profiles` 両方の zod `ConfigSchema` に
  `databaseId: z.string().optional()` を追加。`validFields` ヒント文字列にも `databaseId` を追記。
- `src/mcp/tools/{get,list,set,update,delete,collections,export,import}.ts` — 8 ファイルすべての
  zod スキーマに `databaseId: z.string().optional().describe(...)` を追加し、ハンドラで
  `firestoreManager.getFirestore({ projectId, databaseId })` に伝搬。
- `README.md` / `README-jp.md` — `.firex.yaml` サンプル・CLI オプション一覧・環境変数表・
  使用例に `--database-id` / `databaseId` / `FIRESTORE_DATABASE_ID` を追記。
  `FIRESTORE_DATABASE_URL`（Realtime DB）と `FIRESTORE_DATABASE_ID`（Firestore）の用途差も明示。

### テスト (Modified / New)

- `src/services/config.test.ts` (M) — `FIRESTORE_DATABASE_ID` env の読み込み、空文字の
  未指定扱い、env/file/CLI flag の優先順位テストを追加。
- `src/services/auth.test.ts` (M) — `databaseId` 未指定時は `getFirestore(app)` 1 引数、
  指定時は `getFirestore(app, 'my-db')`、空文字は 1 引数の各ケースを `vi.mocked(getFirestore)`
  で検証。
- `src/commands/base-command.test.ts` (M) — `baseFlags['database-id']` が定義されていること。
- `src/domain/doctor/config-checker.test.ts` (M) — `databaseId` が top-level / profiles
  サブスキーマで受け付けられることを検証。
- `src/mcp/firestore-manager.test.ts` (**新規**) — 同一 projectId でも `databaseId` 違いで
  cache が分離、未指定と `'(default)'` 文字列指定が別キー、`getCachedProjectIds()` が
  複数 DB cache 含む状態で projectId を重複なく返すこと、などを検証。
- `src/mcp/tools/{get,list,set,update,delete,collections,export,import}.test.ts` (M) — 各ツールの
  schema に `databaseId` があること、ハンドラが `firestoreManager.getFirestore` に
  `{ projectId, databaseId }` を渡すことを spy で検証。

### その他

- `package-lock.json` (M) — `npm install` による自動更新（タスク開始時点で既に変更あり。
  本タスクでは追加の依存は入れていない）。

## Test Results

- typecheck: **PASS** (`tsc --noEmit` 0 エラー)
- lint: **SKIPPED** — リポジトリに ESLint 設定ファイルが存在しないため `npm run lint`
  自体が `ESLint couldn't find a configuration file` で失敗する状態が master 時点から続いており、
  本タスクでは悪化させていない。
- build: **PASS** (`npm run build` 成功)
- unit / integration / e2e tests: **1039 passed / 0 failed** (59 test files)
  - 既存テストに回帰なし。
  - 新規テスト: FirestoreManager 9 件、config.ts の databaseId 関連 6 件、auth.ts 3 件、
    base-command.ts 1 件、config-checker.ts 2 件、MCP ツール 8 ファイル × 各 2 件 (計 16 件)。

## Acceptance Criteria Coverage

- [x] `firex get <collection>/<doc> --database-id my-db --project-id foo` が named DB に対して動作する
      → `src/commands/base-command.ts` で `--database-id` を受け取り `ConfigService.loadConfig` の
        `cliFlags.databaseId` に渡し、`AuthService.initialize` 経由で `getFirestore(app, databaseId)`
        が呼ばれる。unit テスト: `src/services/auth.test.ts` の "should call getFirestore with app
        and databaseId when databaseId is specified"。
- [x] `FIRESTORE_DATABASE_ID=my-db firex ...` が動作する
      → `src/services/config.ts` `loadFromEnv()` で `process.env.FIRESTORE_DATABASE_ID` を読み込む。
        CLI 側は oclif の `env: 'FIRESTORE_DATABASE_ID'` でも受け取れる (二重経路)。
        unit テスト: `src/services/config.test.ts` の "should map FIRESTORE_DATABASE_ID to databaseId"。
- [x] `.firex.yaml` に `databaseId: my-db` を書いて動作する
      → cosmiconfig が YAML を読み、そのまま `Config.databaseId` にマージ。
        unit テスト: `src/services/config.test.ts` の "should load databaseId from .firex.yaml file"。
        doctor の zod スキーマも受け付ける (`src/domain/doctor/config-checker.test.ts`)。
- [x] MCP サーバー経由（8 ツール全て）で `databaseId` パラメータを渡せる
      → 8 ツール全ての zod schema に `databaseId: z.string().optional()` を追加し、ハンドラで
        `firestoreManager.getFirestore({ projectId, databaseId })` に伝搬。
        unit テスト: 各 `src/mcp/tools/*.test.ts` の "should declare databaseId in its schema" と
        "should forward databaseId to FirestoreManager.getFirestore"。
- [x] `databaseId` 未指定時は従来通り `(default)` で動作する（既存テスト全緑）
      → `AuthService.initialize` は `config.databaseId` が falsy なら従来通り 1 引数の
        `getFirestore(this.app)` を呼ぶ。1039 既存テスト全緑で回帰なし。
        unit テスト: `src/services/auth.test.ts` の "should call getFirestore with only app when
        databaseId is not specified"。
- [x] `npm run typecheck` / `npm run lint` / `npm test` が全パス
      → typecheck / test は PASS。lint は上記のとおり master 時点から設定欠如で fail している
        ため、本 PR で悪化はしていない (判断は Master に委ねる)。
- [x] README に使用例あり
      → `README.md` / `README-jp.md` の `.firex.yaml` 設定例、CLI オプション一覧、環境変数表、
        `firex get` の使用例セクションに追記。`FIRESTORE_DATABASE_URL` (Realtime DB) との
        違いも文面で明記。

## Notes / Deferred

- `lint` は master 時点から ESLint 設定ファイルが無いため `npm run lint` 自体が失敗する
  状況が本タスク以前から続いている。本タスクの範囲外と判断し、修正していない。必要なら
  別タスクで `eslint.config.js` 相当を追加してリント基盤を整備するのがよい。
- named DB に対する integration / e2e テストは、Firestore Emulator で別 DB を立てるコストが
  高いため今回のスコープに含めていない。plan.md §5.3 の方針どおり、unit の引数検証
  (`vi.mocked(getFirestore)`) で named DB 分岐を担保し、既存 integration / e2e が default DB の
  後方互換を担保する構成。本番 named DB への手動動作確認は受け入れ確認時に別途依頼。
- `CHANGELOG.md` は指示どおり本タスクで触っていない（Conductor 側で別タスクで扱う）。
- `package-lock.json` はタスク開始時点でワークツリー上に変更が存在した状態で引き継いでいる。
  本タスクでは追加依存を入れていないが、commit する際に含めるかは Conductor 判断。
