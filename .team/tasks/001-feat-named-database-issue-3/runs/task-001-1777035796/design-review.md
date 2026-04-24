# Design Review: feat: named database support (Issue #3)

## Verdict
**APPROVED**

## Summary
計画書は受け入れ基準を網羅し、既存の `projectId` 解決フロー・cache key・単一 AuthService 前提に忠実な最小侵襲の設計である。実ソースと照合した主要主張（`auth.ts` の `getFirestore(this.app)`、`firestore-manager.ts` の `getCacheKey` / `getCachedProjectIds`、`Config` 型、`Messages` 型、`McpServerOptions`）はすべて裏取り済み。ただし doctor の `ConfigSchema`（`profiles` サブスキーマ含む）への `databaseId` 追加と、`getCachedProjectIds` の後方互換検証が計画から抜け落ちているため Implementer へ申し送る。

## Findings

### Critical (must fix before impl)
- なし。

### Important (should fix before impl)

1. **`src/domain/doctor/config-checker.ts` の `ConfigSchema` 更新が計画から抜けている**
   - L17-36 に `.firex.yaml` 検証用 zod スキーマがある。`.passthrough()` のためバリデーションは通るが、`profiles` サブスキーマ（L26-35）はパススルーされないため、`.firex.yaml` の `profiles.<name>.databaseId: my-db` を書いた場合に **profile マージ後 `databaseId` が消失**する（`profileConfig` 経由で `{...baseConfig, ...profileConfig}` で上書きされる挙動は config.ts L205-209 だが、profiles の inner schema が `databaseId` を知らないことで将来の厳格化で取りこぼす）。少なくとも top-level と `profiles` の両方に `databaseId: z.string().optional()` を追加すること。
   - また L244-245 の `validFields` ヒント文字列（バリデーション失敗時に表示）にも `databaseId` を追加するのが一貫性として望ましい。
   - 影響ファイルが計画書の表（§2）から抜けているので Implementer が忘れる可能性がある。

2. **`src/mcp/firestore-manager.test.ts` が未作成**
   - 計画書の §5.2 テスト表に「`FirestoreManager` cache key テスト」が 2 件あるが、**既存の `firestore-manager.test.ts` はリポジトリに存在しない**（`src/mcp/tools/*.test.ts` のみ）。新規ファイル作成が必要であることを §2 影響範囲表もしくは §4 Step 9 に明記したほうが実装者の見落としを防げる。

3. **`getCachedProjectIds()` の後方互換テストが未定義**
   - 計画 §2 row 6 で `getCachedProjectIds()` の split ロジック更新に言及するが、§5.2 テスト表では cache key の分離しか検証していない。`getCachedProjectIds()` が返す値（`key.split('::')[0]` = projectId のみ）は 3 セグメント化しても壊れないため、その**明示的な回帰テスト** 1 件を追加することを推奨。

### Minor (can address during impl)

1. **`auth.ts` の行番号指摘がやや不正確**
   - 計画 §2 row 2 は「L66-76 の `getFirestore(this.app)`」と書いているが、実際の `getFirestore(this.app)` は **L76 のみ**。L66-73 は `initializeApp(...)` ブロック。conductor-prompt.md に由来する記述だが、差し替え対象行が L76 1 行であることを Implementer へ伝える。

2. **cache key のセグメント区切り文字**
   - 現実装は `${projectId || ''}::${credentialPath || ''}`（`||` を使用、L65）。計画 §3.4 は `??` で記述しているが意味論が微妙に違う（`''` は `||` なら false 相当、`??` なら truthy）。プロジェクト ID / 認証パスが空文字になるケースは実運用で起きないが、**既存コード表記の `||` に合わせる**方針でよい（プロジェクトの整合性優先）。

3. **`databaseId` 命名の正規表現**
   - 計画 §3.5/§7.3 で「Firestore database 名は `[a-z][a-z0-9-]*`」と記述しているが、正確には長さ制約があり `[a-z]` 始まり＋`[a-z0-9-]` で 4-63 文字。実装上バリデーションを行わない方針（firebase-admin 側に委譲）なので影響なし。レビュー文面としての正確性のみの指摘。

4. **`FIRESTORE_DATABASE_URL` との混同リスク**
   - 既存 env `FIRESTORE_DATABASE_URL`（Realtime DB 用、config.ts L254-256）と、新規 env `FIRESTORE_DATABASE_ID`（Firestore named DB 用）が共存することになる。衝突はないが、README の「環境変数表」では**両者の違いを明示的に並べて記載**することを推奨（「Realtime Database URL」と「Firestore database ID」の用途差が読者に伝わるように）。

5. **`base-command.ts` テストの挙動検証観点**
   - §5.2 テスト表「`--database-id` フラグが cliFlags に流れる」は既存 `base-command.test.ts` L45-57 の「flag 定義」式テストと、`initialize()` の `loadConfig` 呼び出し引数検証の 2 段階が必要。既存 `--project-id` も定義テストしかないので、同等でよい旨を実装時に確認。

6. **`AuthService.initialize()` の cached-firestore 早期 return 挙動（L34-37）**
   - 同一 AuthService で 2 回 `initialize()` が呼ばれると `databaseId` 違いでも最初の Firestore を返す。計画 §3.3 で「別の DB で使い回すことは想定しない」と明言しているので OK。ただし **FirestoreManager 経由のケース**では cacheKey ごとに別 AuthService になるのでこの制約は問題にならない。テストで「同じ AuthService インスタンスに 2 回 initialize しても問題が起きない」ことの明示テストは不要と判断。

7. **`doctor` コマンドへの反映 (計画 §7.5)**
   - 「余力があれば」扱いのため受け入れ基準外でよいが、`ConfigService.getCurrentConfig()` には `databaseId` を追加する旨が §2 row 1 にあるので、`doctor` の config 確認出力に自動的に現れる可能性がある。その挙動が意図通りか Implementer が確認すること。

## Recommendations

Changes Requested ではないため**大きな書き直しは不要**。Implementer へ下記を申し送るだけで実装に進んでよい:

1. **計画書 §2 影響範囲表へ追加** (`design-review 反映時`):
   - `src/domain/doctor/config-checker.ts` — `ConfigSchema` と `profiles` サブスキーマに `databaseId: z.string().optional()` を追加、`validFields` 文字列を更新
   - `src/mcp/firestore-manager.test.ts` — **新規作成**（cache key 分離と `getCachedProjectIds()` 後方互換）

2. **計画書 §5.2 テスト表へ追加**:
   - `FirestoreManager` | `getCachedProjectIds()` が `(projectId, databaseId)` 違いの複数 cache を含む状態でも、projectId のみのリストを正しく返すこと（split[0] 挙動の回帰テスト）

3. **計画書 §4 Step 9 更新**:
   - 「Step 1〜8 に対応させる」に加えて「§2 新規追加ファイル（doctor config-checker, firestore-manager.test.ts）を含む」と明記

4. **実装時メモ**:
   - `auth.ts` 実際の差し替え行は **L76 の 1 行**
   - cache key は既存の `||` 記法に合わせる
   - README 環境変数表は `FIRESTORE_DATABASE_URL`（Realtime DB）と `FIRESTORE_DATABASE_ID`（Firestore）を別々の行で並記

## Confirmed Strengths

1. **単一 AuthService 1 接続前提の活用**: `config.databaseId` を流すだけで OK という判断が正しい。`FirestoreManager` が cacheKey ごとに新 AuthService を作る設計を正しく踏まえている（実ソース L86-87 で確認済）。

2. **cache key のマイグレーション方針**: `'(default)'` 文字列ではなく空文字でセグメントを増やす設計 (§3.4) は、プロセス内キャッシュなので衝突リスクゼロで移行できる最小侵襲パターン。`appName = 'firex-${cacheKey}'` の一意性も自動的に保たれる考察は的確。

3. **`databaseId` 空文字の扱い**: `if (process.env.FIRESTORE_DATABASE_ID)` の falsy 判定で空文字を未指定同等にする方針 (§3.5) は、既存の `loadFromEnv()` スタイル（L241 の `if (process.env.FIRESTORE_PROJECT_ID)` など）と完全に整合する。

4. **受け入れ基準の明示的転記 (§6)**: conductor-prompt.md の 7 項目をそのまま抜き出してチェックリスト化しており、実装完了時の self-check に使える。

5. **既存 CLI コマンドに変更不要の判断**: `BaseCommand.initialize()` → `ConfigService.loadConfig()` → `AuthService.initialize(config)` のフロー (base-command.ts L131-147, L175) を正しく把握し、`databaseId` 自動伝搬を利用している。`src/commands/get.ts` 等を個別に触らない判断は正解。

6. **Integration テスト省略の判断根拠**: `firebase.json` 拡張コストと unit での引数検証 (`vi.mocked(getFirestore)`) の組み合わせで named DB ケースを担保する方針 (§5.3) はコストパフォーマンスが妥当で、Issue の本質（`getFirestore(app, databaseId)` が呼ばれること）を的確に押さえている。

7. **後方互換の根拠 (§8)**: 7 項目に分けて型・ランタイム・CLI・env・設定ファイル・MCP スキーマ・cache key の各レイヤで根拠を示しており、レビュー負荷が低い。
