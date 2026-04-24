# 実装計画: feat: named database サポート追加 (Issue #3)

## 1. 概要

firex は現状 `getFirestore(this.app)` 引数なしで呼び出しており `(default)` DB しか扱えない。firebase-admin v13 の `getFirestore(app, databaseId)` を利用し、GCP プロジェクト内の named database に対しても CLI / 環境変数 / 設定ファイル / MCP ツールから一貫して操作できるようにする。未指定時は従来どおり `(default)` を使うため既存ユーザーへの影響はない。既存の `projectId` / `credentialPath` の解決フローに沿って `databaseId` を伝搬させるのが基本方針。

## 2. 影響範囲

| # | ファイル | 変更内容 |
|---|----------|----------|
| 1 | `src/services/config.ts` | `Config` に `databaseId?: string` 追加。`loadFromEnv()` で `FIRESTORE_DATABASE_ID` を読む。`getCurrentConfig()` の表示項目にも追加 |
| 2 | `src/services/auth.ts` | `initialize()` 内 L66-76 の `getFirestore(this.app)` を `config.databaseId` 指定時に `getFirestore(this.app, config.databaseId)` に差し替え。第3引数として既存 `appName` は `initializeApp` 側のまま |
| 3 | `src/commands/base-command.ts` | `baseFlags` に `--database-id` (env: `FIRESTORE_DATABASE_ID`) を追加。`initialize()` の `cliFlags` に `databaseId` を載せる |
| 4 | `src/commands/mcp.ts` | `static flags` に `--database-id` (env: `FIRESTORE_DATABASE_ID`) を追加。`startMcpServer()` 呼び出しに `databaseId` を渡す。examples にも1件追加 |
| 5 | `src/mcp/server.ts` | `McpServerOptions` に `databaseId?: string` 追加。`firestoreManager.initialize()` 呼び出しに渡す |
| 6 | `src/mcp/firestore-manager.ts` | `GetFirestoreOptions` に `databaseId?: string` を追加。`getCacheKey()` を `${projectId}::${databaseId ?? '(default)'}::${credentialPath}` に拡張。`getFirestore()` で解決した `databaseId` を `Config` 経由で `AuthService.initialize` に渡す。`getCachedProjectIds()` の split ロジックを更新 |
| 7 | `src/mcp/tools/get.ts` | `GetSchema` に `databaseId: z.string().optional().describe(...)` 追加、ハンドラで `firestoreManager.getFirestore({ projectId, databaseId })` に渡す |
| 8 | `src/mcp/tools/list.ts` | 同上 |
| 9 | `src/mcp/tools/set.ts` | 同上 |
| 10 | `src/mcp/tools/update.ts` | 同上 |
| 11 | `src/mcp/tools/delete.ts` | 同上 |
| 12 | `src/mcp/tools/collections.ts` | 同上 |
| 13 | `src/mcp/tools/export.ts` | 同上 |
| 14 | `src/mcp/tools/import.ts` | 同上 |
| 15 | `src/shared/i18n.ts` | `Messages` 型に `'flag.databaseId'` キー追加。`jaMessages` / `enMessages` に訳文を追加 |
| 16 | `src/services/auth.test.ts` | named DB 指定時に `getFirestore` が `(app, databaseId)` で呼ばれることを検証する unit テストを追加 |
| 17 | `src/services/config.test.ts` | `databaseId` の env / file / cliFlags 解決優先度テストを追加 |
| 18 | `src/commands/base-command.test.ts` | `--database-id` フラグが `loadConfig` に渡ることを検証するテストを追加 |
| 19 | `src/mcp/tools/*.test.ts` (8ファイル) | 各ツールのスキーマに `databaseId` が受け渡されることを最小限モックで検証 |
| 20 | `README.md` | `--database-id` / `FIRESTORE_DATABASE_ID` / `.firex.yaml` への追記。環境変数表にも1行追加 |
| 21 | `README-jp.md` | 同上（日本語） |

※ `src/commands/get.ts` 等の個別 CLI コマンドは `BaseCommand.initialize()` → `ConfigService.loadConfig()` → `AuthService.initialize(config)` というフローで `databaseId` が自然に伝搬するため**追加変更は不要**。

## 3. 設計判断

### 3.1 フラグ名・環境変数名・設定キー
- CLI フラグ: `--database-id`（Issue #3 の方針どおり、既存 `--project-id` の命名に合わせる）
- 環境変数: `FIRESTORE_DATABASE_ID`（既存 `FIRESTORE_PROJECT_ID` / `FIRESTORE_EMULATOR_HOST` に揃える。firebase 公式環境変数には `FIRESTORE_DATABASE_ID` 相当は存在しないが、firex 内の命名規約として一貫）
- Config フィールド: `databaseId` (camelCase、既存 `projectId` / `databaseURL` / `credentialPath` に合わせる)

### 3.2 優先順位解決
既存 `projectId` と同じく `CLI flag > env > config file > undefined(=default)` で解決する。`ConfigService.loadConfig()` の merge 順 `DEFAULT_CONFIG → fileConfig → envConfig → cliFlags` を流用するだけで実現可能。個別の優先度実装は不要。

### 3.3 AuthService のキャッシュキー戦略
`AuthService` 自体は**単一インスタンス1接続**のシンプル設計（`this.firestore` 1個）。キャッシュキーではなく、`Config` に `databaseId` を持たせて `getFirestore(this.app, config.databaseId)` に渡すだけで足りる。同じ AuthService インスタンスを別の DB で使い回すことは想定しない（firestore-manager が既に projectId / credentialPath ごとに別インスタンスを作る前提のため）。

### 3.4 FirestoreManager のキャッシュキー
同じ projectId でも別 DB を別コネクションとして扱う必要がある。`getCacheKey(projectId, databaseId, credentialPath)` → `${projectId ?? ''}::${databaseId ?? ''}::${credentialPath ?? ''}` とする。`'(default)'` のようなマジック文字列ではなく空文字にして既存形式を拡張する方がマイグレーションが楽（`getCachedProjectIds()` の `split('::')[0]` も壊れない）。

firebase-admin の `initializeApp` は app 名ベースの uniqueness を要求する。firestore-manager 側の `appName = 'firex-${cacheKey}'` がそのまま一意性を担保するため、cacheKey 側に databaseId を含めれば app 名も自動的に重複しない。**追加の app 名変更ロジックは不要**。

### 3.5 エラーメッセージ・バリデーション
- 空文字 `databaseId === ''` は「未指定」と同じ扱い（`(default)` 経路へフォールバック）が実装簡潔。これは `ConfigService` の env 読み込み時点で `if (process.env.FIRESTORE_DATABASE_ID)` としておけば自動的に満たせる（空文字は falsy）。
- Firestore の `database` 識別子は `[a-z][a-z0-9-]*` 等の制限があるが、firex 側で前段バリデーションは行わず、firebase-admin のエラーをそのまま通す（既存 `projectId` も同様の思想）。Issue #3 でもバリデーション要件は出ていない。
- エラーメッセージ文言の追加は最小限（`flag.databaseId` の description のみ）。既存の auth エラーメッセージは共通でよい。

### 3.6 テスト戦略
- **unit**: `AuthService` が `getFirestore` を `databaseId` 付きで呼ぶこと、`ConfigService` が優先順位通りに `databaseId` を解決すること、`FirestoreManager` の cacheKey が DB ごとに分かれること、各 MCP ツールの zod schema が `databaseId` を受け付け `firestoreManager.getFirestore({ projectId, databaseId })` に渡すこと、を最小モックで検証。
- **integration (emulator)**: 公式エミュレータは named DB を `firebase.json` で定義できるが UI は default のみ対応で、firex の integration テストで named DB を立てるのは現状コスパが悪い。**named DB の integration は行わず unit の引数検証で担保**し、既存 integration / e2e テストが「default 動作の後方互換」を担保する（`databaseId` 未指定で従来どおり動くこと）。
- **受け入れ基準の手動検証**: CI 外で本番 named DB or `firebase.json` 拡張エミュレータに対して動作確認する方針（レビュー時に Master 依頼）。

### 3.7 ドキュメント
既存 `projectId` の記述箇所のすぐ近くに `databaseId` を並記する。`.firex.yaml` 設定例、環境変数テーブル、CLI オプション一覧、ドクター出力の例が主な追記箇所。`CHANGELOG.md` は触らない（リリース時に別タスク）。

## 4. 実装ステップ（依存順）

実装は依存関係の薄い順に積む。各ステップ後に `npm run typecheck && npm test` を走らせて緑を維持することを推奨。

1. **型定義** — `src/services/config.ts` に `databaseId?: string` を `Config` / `getCurrentConfig` 表示に追加
2. **設定読み込み** — 同ファイル `loadFromEnv()` に `FIRESTORE_DATABASE_ID` 読み込みを追加。cosmiconfig は追加設定なしで `.firex.yaml` の `databaseId` を読める
3. **AuthService 拡張** — `src/services/auth.ts` の `initialize()` の `getFirestore(this.app)` を `config.databaseId ? getFirestore(this.app, config.databaseId) : getFirestore(this.app)` に分岐
4. **FirestoreManager 拡張** — `src/mcp/firestore-manager.ts` の `GetFirestoreOptions` に `databaseId` 追加。`getCacheKey()` 3引数化。`getFirestore()` 内で解決した `databaseId` を `config.databaseId` にセットして `authService.initialize` に渡す。`getCachedProjectIds()` の split を更新
5. **CLI フラグ** — `src/commands/base-command.ts` の `baseFlags` に `--database-id` を追加。`initialize()` の `cliFlags` に `databaseId: flags['database-id']` を追加
6. **i18n** — `src/shared/i18n.ts` の `Messages` 型 / `jaMessages` / `enMessages` に `'flag.databaseId'` を追加
7. **MCP サーバー起動フラグ** — `src/commands/mcp.ts` に `--database-id` フラグ追加、`src/mcp/server.ts` の `McpServerOptions` に `databaseId` 追加し `firestoreManager.initialize` に伝搬
8. **MCP ツール 8 個のスキーマ拡張** — 8 ファイルすべてに `databaseId: z.string().optional()` を追加し `firestoreManager.getFirestore({ projectId, databaseId })` で渡す（並列実装可）
9. **テスト追加・更新** — unit テストを Step 1〜8 に対応させる形で追加／更新
10. **ドキュメント** — `README.md` / `README-jp.md` を更新

## 5. テスト計画

### 5.1 既存テストの後方互換確認
- `databaseId` を Config に追加してもオプショナルのため型エラーは生じない
- `AuthService.initialize()` は `config.databaseId` が `undefined` のとき `getFirestore(this.app)` を呼ぶので既存 mock (`getFirestore: vi.fn(() => mockFirestore)`) はそのまま通る
- `FirestoreManager` 既存テスト（もしあれば）および MCP ツール全 test ファイルのモックは引数非依存で動作するため後方互換
- 確認コマンド: `npm run typecheck && npm run lint && npm test`

### 5.2 新規 unit テスト
| 対象 | 内容 |
|------|------|
| `AuthService` | `config.databaseId` が指定されていない場合は `getFirestore(app)` を1引数で呼ぶ |
| `AuthService` | `config.databaseId = 'my-db'` の場合 `getFirestore(app, 'my-db')` で呼ぶ（`vi.mocked(getFirestore)` で引数検証） |
| `ConfigService` | `.firex.yaml` の `databaseId` が読まれる |
| `ConfigService` | `FIRESTORE_DATABASE_ID` env が file 設定を上書きする |
| `ConfigService` | `cliFlags.databaseId` が env を上書きする |
| `ConfigService` | env 未設定時に `databaseId` は `undefined` |
| `FirestoreManager` | 同じ projectId でも `databaseId` 違いで cache が別エントリになる（`getFirestore` を 2 回呼び cache hit/miss を検証） |
| `FirestoreManager` | `databaseId` 未指定と `'(default)'` 文字列指定が**同一**cache にならない（文字列は別キー扱いにする） |
| `BaseCommand` | `--database-id` フラグが `configService.loadConfig` の cliFlags に流れる（既存 `--project-id` テストに準拠） |
| 各 MCP ツール (8) | schema に `databaseId` が含まれ、引数として渡したときに `firestoreManager.getFirestore` へ `{ projectId, databaseId }` が渡ることを spy で検証 |

### 5.3 Emulator での named DB 検証（スコープ外）
- 公式エミュレータは `firebase.json` で追加 DB 定義すれば named DB を受け付けるが、現状 firex の `firebase.json` は default のみ。integration でこれを拡張すると他テストへの影響が大きい
- 本タスクでは **unit の引数検証** で named DB ケースを担保し、既存 integration で default DB 側の後方互換を担保する構成とする
- 本番 named DB への手動動作確認は受け入れ確認時に別途行う（受け入れ基準 3 項目）

## 6. 受け入れ基準チェックリスト (conductor-prompt.md より転記)

- [ ] `firex get <collection>/<doc> --database-id my-db --project-id foo` が named DB に対して動作する
- [ ] `FIRESTORE_DATABASE_ID=my-db firex ...` が動作する
- [ ] `.firex.yaml` に `databaseId: my-db` を書いて動作する
- [ ] MCP サーバー経由（8 ツール全て）で `databaseId` パラメータを渡せる
- [ ] `databaseId` 未指定時は従来通り `(default)` で動作する（既存テスト全緑）
- [ ] `npm run typecheck` / `npm run lint` / `npm test` が全パス
- [ ] README に使用例あり

## 7. リスク・未確定事項

| 項目 | 内容 | 対応方針 |
|------|------|----------|
| Firestore Emulator と named DB | UI は default のみ。integration で named DB を使うのは負担大 | 本タスクは unit ベース検証のみとし、手動動作確認を Master に依頼 |
| databaseId の文字列バリデーション | firex 側でバリデーションすべきかどうか Issue #3 に明記なし | firebase-admin 側のエラーに委譲。前段バリデーションは入れない |
| cache key のエスケープ | `::` がキー文字列に含まれた場合の衝突リスク | Firestore database 名は `[a-z][a-z0-9-]*` 相当で `:` を許容しないためエスケープ不要（projectId / credentialPath も `::` を含むのは実運用で極めて稀） |
| `databaseId` 空文字時の扱い | CLI で `--database-id ""` を指定された場合 | oclif の `Flags.string` は `""` を許容するが、`ConfigService` merge 後に空文字は `undefined` 同等とみなすか。**単純マージのまま通し**、firebase-admin 側エラーに委譲する方針でよい（過剰設計を避ける） |
| doctor コマンドへの反映 | `doctor` で `databaseId` の表示を出すか | 余力があれば対応、スコープ外でも可（受け入れ基準外）。最小実装では `getCurrentConfig()` の表示項目追加のみ |
| CHANGELOG | Conductor 側で扱うため Implementer は触らない | 明示的にガードインザプロンプト |

## 8. 後方互換保証の根拠

1. **型レベル**: `Config.databaseId` は `?:` でオプショナル。既存コード・設定ファイルで未定義なら常に `undefined`。
2. **ランタイム**: `AuthService.initialize()` は `config.databaseId` が falsy (`undefined` / `''`) なら `getFirestore(this.app)` を従来どおり 1 引数で呼ぶ。firebase-admin の該当オーバーロードは v13 以前と同じ挙動。
3. **CLI**: `--database-id` は optional。フラグを付けなければ既存動作に完全一致。
4. **環境変数**: `FIRESTORE_DATABASE_ID` 未設定なら `ConfigService.loadFromEnv()` は従来と同じオブジェクトを返す。
5. **設定ファイル**: `.firex.yaml` の `databaseId` 欄未記載ならキーは undefined のままで既存プロフィール / マージ動作を変更しない。
6. **MCP ツールスキーマ**: `databaseId` は zod optional。既存クライアントが渡していなくても受け付けられる。
7. **キャッシュキー**: 既存 `${projectId}::${credentialPath}` → 新 `${projectId}::${databaseId ?? ''}::${credentialPath}`。`databaseId` 未指定時は `::::` の空セグメントが1つ増えるだけで、同プロセス内の新旧キャッシュ間で衝突はあり得ないため問題なし（プロセス横断の永続キャッシュではない）。
8. **既存テスト**: 全 test は `databaseId` を触らないため影響なし。`npm test` を各ステップ後に回すことで回帰を即座に検出。
