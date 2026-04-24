# Plan — T002: named database 補足ドキュメント更新

本プランは worktree `task-002-1777038024/task`（base: `master`、直前 commit `a344711 feat: named database サポート追加 (Issue #3)`）を Source of Truth として、T001 でカバーされなかった周辺ドキュメントを更新するための実装指示書である。

---

## 1. T001 で確定したシグネチャ（Source of Truth）

`git show a344711` および現行ソース確認の結果、以下が named database サポートの「正」である。**本タスクでは一切変更しない。**

| 種別 | 名前 | デフォルト | 備考 |
|---|---|---|---|
| CLI フラグ | `--database-id <id>` | （未指定時 `(default)`） | `src/commands/base-command.ts:42` 追加。env: `FIRESTORE_DATABASE_ID` 経由でも指定可 |
| `mcp` コマンドフラグ | `--database-id <id>` | 同上 | `src/commands/mcp.ts:42` 追加。description は `'Firestore database ID (default: (default))'` |
| 環境変数 | `FIRESTORE_DATABASE_ID` | 未設定時 `(default)` | `src/services/config.ts:259` で読み取り。`FIRESTORE_DATABASE_URL`（Realtime DB URL）とは別物 |
| 設定キー（`.firex.yaml` / ConfigSchema） | `databaseId` | 省略時 `(default)` | `src/services/config.ts:26` に `Config.databaseId?: string`。`profiles.<name>.databaseId` も可 |
| i18n キー | `flag.databaseId` | — | ja: `'Firestore データベース ID (デフォルト: (default))'` / en: `'Firestore database ID (default: (default))'` |
| MCP zod schema フィールド | `databaseId: z.string().optional().describe('Firestore database ID (optional, uses (default) if not specified)')` | 省略時 `(default)` | 8 ツール全件で追加済み（`src/mcp/tools/{get,list,set,update,delete,collections,export,import}.ts`） |
| FirestoreManager cache key | `${projectId||''}::${databaseId||''}::${credentialPath||''}` | — | `src/mcp/firestore-manager.ts` |
| AuthService 挙動 | `config.databaseId` 指定時 `getFirestore(app, databaseId)` | 未指定時 `getFirestore(app)` | `src/services/auth.ts` |
| README / README-jp | "named database" の使用例・`.firex.yaml` の `databaseId` 記述・環境変数表で `FIRESTORE_DATABASE_ID` と `FIRESTORE_DATABASE_URL` を並記（後者は "Realtime Database URL" と明記） | — | **T001 完了済みのため本タスクでは触らない** |

**用語ルール（全ドキュメント共通で揃える）:**
- "named database" / "named Firestore database"（英）／ "named database"（日）
- 未指定時のデフォルトは常に `(default)` と表記（バックティック込み）
- 使用例プロジェクト ID は README に倣って `my-db`（英）、`my-db` / `staging-db`（profile 例）
- `FIRESTORE_DATABASE_URL` に触れる場合は "Realtime Database URL"（`FIRESTORE_DATABASE_ID` と別物）と明示する README 方針を踏襲

---

## 2. ファイル別 現状 → 作業内容

### 2.1 `src/mcp/tools/*.ts` ― **変更不要（理由明記）**

- **現状**: 8 ファイル全てで `databaseId: z.string().optional().describe('Firestore database ID (optional, uses (default) if not specified)')` が T001 で追加済み。既存の `projectId` description トーン（`'Firebase project ID (optional, uses default if not specified)'`）と揃っている。
- **ツール全体 description**（`server.tool(name, description, schema, handler)` の 2 引数目）への追記は conductor-prompt で「あると親切（必須ではない）」とされている。
- **Planner 判断: 追記しない**。理由: (1) パラメータ単位の description で AI エージェントには十分伝わる、(2) ツール全体 description は「操作主旨（"Get a document from Firestore by its path" 等）」に絞られており、`projectId` ですら触れられていないので named DB だけを書くのは不均衡、(3) T002 のスコープを docs-only に保つ。
- **Implementer へ**: このファイル群は触らない。`git diff --name-only` に入れない。

---

### 2.2 `articles/zenn-firex-introduction.md` ― 追記 3 箇所

**現状**（2026-04-24 時点、317 行）:
- L96-116: "### 5. 複数プロジェクト対応" — `.firex.yaml` 例で `projectId` と `profiles` のみ
- L149-177: "### セットアップ" — Claude Code / Claude Desktop の MCP 登録例、env に `FIRESTORE_PROJECT_ID`
- L225-249: "## クイックスタート" — `export FIRESTORE_PROJECT_ID=...` と `--project-id` の例

**作業内容:**

**(a) L100-111 `.firex.yaml` 例に `databaseId` 行を追加**

```diff
 # .firex.yaml
 projectId: dev-project
+databaseId: my-db            # 任意。省略時は (default) データベースを使用。
 credentialPath: ./dev-service-account.json

 profiles:
   staging:
     projectId: staging-project
+    databaseId: staging-db
   production:
     projectId: prod-project
     credentialPath: ./prod-service-account.json
```

README-jp の L108-123 と文言・コメントを揃える。

**(b) L149-177 "### セットアップ" の MCP 登録例に named DB の注記を追加**

Claude Desktop JSON 例（L164-177）の直後に、短い注記ブロックを追加:

```
`(default)` 以外の **named database** を対象にしたい場合は、`FIRESTORE_DATABASE_ID` を `env` に追加してください（省略時は `(default)` が使われます）。
```

Claude Code セットアップ例（L153-158）内の `-e` フラグにはあえて書き足さず（シンプルさ維持）、上記注記でカバーする。

**(c) L225-249 "## クイックスタート" の実行例の直後に named DB の短い補足を追加**

L249 の末尾（`npx @hummer98/firex list users` のコードブロック直後）に以下を追加:

```
### named database を使う場合

`(default)` 以外の Firestore データベースを使う場合は `--database-id`（または `FIRESTORE_DATABASE_ID`）を指定します。

\`\`\`bash
npx @hummer98/firex list users --project-id your-project-id --database-id my-db
# または
export FIRESTORE_DATABASE_ID=my-db
npx @hummer98/firex list users
\`\`\`
```

（※ バッククォートは実ファイルでは通常のコードブロックにする）

**触らない箇所**: L194-204 の MCP tools 表（ツール一覧のみなので named DB 言及不要）、L251-287 のユースケース（共通例なので既存のまま OK）。

---

### 2.3 `articles/devto-firex-introduction.md` ― 追記 3 箇所（英訳版）

**現状**（2026-04-24 時点、354 行）:
- L96-116: "### 5. Multiple Project Support" — `.firex.yaml` 例
- L185-213: "### Setup" — Claude Code / Claude Desktop 例
- L263-287: "## Quick Start"

**作業内容:**

**(a) L100-111 `.firex.yaml` 例に `databaseId` 行を追加**

```diff
 # .firex.yaml
 projectId: dev-project
+databaseId: my-db            # Optional. Omit to use the (default) database.
 credentialPath: ./dev-service-account.json

 profiles:
   staging:
     projectId: staging-project
+    databaseId: staging-db
   production:
     projectId: prod-project
     credentialPath: ./prod-service-account.json
```

README.md の L108-123 と文言を揃える。

**(b) L185-213 "### Setup" の Claude Desktop JSON 直後に注記を追加**

```
> To target a **named database** (anything other than `(default)`), add `FIRESTORE_DATABASE_ID` to the `env` block. Omit it to keep using `(default)`.
```

**(c) L263-287 "## Quick Start" の実行例直後に短いセクションを追加**

```
### Using a named database

To target a Firestore database other than `(default)`, pass `--database-id` (or set `FIRESTORE_DATABASE_ID`).

\`\`\`bash
npx @hummer98/firex list users --project-id your-project-id --database-id my-db
# or
export FIRESTORE_DATABASE_ID=my-db
npx @hummer98/firex list users
\`\`\`
```

**触らない箇所**: L229-240 の MCP tools 表、L289-325 の Use Cases。

---

### 2.4 `docs/BOOT.md` ― **不要（理由明記）**

- **現状**: 初期コンセプトメモ（L1-22）。CLI 呼び出し例なし、環境変数記載なし、設定ファイル例なし。named DB に触れる「場所」自体が存在しない。
- **Planner 判断: 変更しない**。conductor-prompt の判断基準（「CLI 呼び出し例や環境変数の記載があれば触れる、なければ追記不要」）に合致。
- **Implementer へ**: summary.md では「不要（CLI 例・環境変数記載がないため）」と報告する。

---

### 2.5 `docs/cicd.md` ― 追記 1 セクション

**現状**（124 行）:
- L66-96: GitHub Actions ワークフロー例（`npx @hummer98/firex export users --output backup.json` を実行）
- L109-121: Service account key 代替例（`npx @hummer98/firex list users`）
- L98 の注記: `google-github-actions/auth` が `GOOGLE_APPLICATION_CREDENTIALS` を自動設定する旨

**作業内容:**

**L99（L98 の注記 Note ブロック直後、"### Other CI/CD Platforms" セクション L100 の前）に "### Named database" サブセクションを追加する。**

書くべき内容（英語）:

```
### Named database

If you target a Firestore database other than `(default)`, pass `--database-id` to firex or set `FIRESTORE_DATABASE_ID`. The database ID can be hardcoded in the workflow, stored as a repository variable, or read from a secret.

\`\`\`yaml
- name: Export Firestore collection
  env:
    FIRESTORE_DATABASE_ID: my-db   # optional; omit to use (default)
  run: npx @hummer98/firex export users --output backup.json
\`\`\`

The same env var / flag works in the Service account key variant below.
```

**触らない箇所**: L66-96 のサンプルワークフロー本体（`FIRESTORE_DATABASE_ID` を入れると基本例が膨らむので、補足サブセクションで案内する方針）。L109-121 の代替例も本文は変更せず、上記サブセクションの最終文で参照する形にする。

---

### 2.6 `docs/cicd-jp.md` ― 追記 1 セクション（日本語版）

**現状**（124 行、構造は `docs/cicd.md` と完全対応）:
- L66-96: GitHub Actions ワークフロー例
- L98: 注記 Note
- L100-: "### その他の CI/CD プラットフォーム"

**作業内容:**

`docs/cicd.md` と同じ位置（注記直後、L100 の前）に "### named database を使う場合" を追加:

```
### named database を使う場合

`(default)` 以外の Firestore データベースを対象にする場合は、firex に `--database-id` を渡すか、`FIRESTORE_DATABASE_ID` 環境変数を設定します。ワークフロー内にハードコードしても、リポジトリ変数 / Secret から読み込んでも構いません。

\`\`\`yaml
- name: Firestore コレクションをエクスポート
  env:
    FIRESTORE_DATABASE_ID: my-db   # 任意。省略時は (default) を使用
  run: npx @hummer98/firex export users --output backup.json
\`\`\`

後述のサービスアカウントキー代替方式でも同じフラグ / 環境変数が使えます。
```

`docs/cicd.md` の内容と情報量・構造を 1:1 対応させる（レビューしやすさ優先）。

---

### 2.7 `IMPLEMENTATION_STATUS.md` ― サブセクション 1 件追加

**現状**（151 行）:
- L4 "## 完了したタスク" 以下に Phase 1 / Phase 2 が Task 番号 + ✅ 付きで列挙
- L27-49 に Task 2.1 ConfigService / Task 2.2 AuthService のセクションがある
- 既存フォーマット: `#### Task X.Y: <name> ✅` → 箇条書き → `**実装ファイル**:` / `**テスト**:` 行

**作業内容:**

**Task 2.2 AuthService（L49 の "テスト: 4 tests passed" の直後、L50 の空行と L51 "#### Task 2.4" の間）に、named database サポートの完了セクションを追加する。**

書くべき内容（既存フォーマット踏襲）:

```
#### Task 2.2.1: Named Database サポート ✅ (Issue #3)
- CLI フラグ `--database-id`（env: `FIRESTORE_DATABASE_ID`）を BaseCommand / mcp コマンドに追加
- `Config.databaseId` と `.firex.yaml` / ConfigSchema / profile 対応
- AuthService: `config.databaseId` 指定時に `getFirestore(app, databaseId)` を呼び出し
- FirestoreManager: キャッシュキーを `${projectId||''}::${databaseId||''}::${credentialPath||''}` に拡張
- MCP: 8 ツール (`get` / `list` / `set` / `update` / `delete` / `collections` / `export` / `import`) 全てで `databaseId` パラメータを追加
- 未指定時は従来通り `(default)` データベースを使用（後方互換）

**実装ファイル**: `src/commands/base-command.ts`, `src/commands/mcp.ts`, `src/services/config.ts`, `src/services/auth.ts`, `src/mcp/firestore-manager.ts`, `src/mcp/tools/*.ts`, `src/shared/i18n.ts`
**テスト**: `src/mcp/firestore-manager.test.ts` (9) + 既存 5 ファイルに計 28 件追加 ✅
```

**L65 の "**全体テスト結果**: ✅ 30 tests passed (5 test files)" の数値は現在の実装と乖離している**（T001 で大幅にテストが追加されている）。**この行は T002 のスコープ外なので触らない**（実装状況リストの網羅的更新は別タスク）。ただし summary.md で「数値は古いが範囲外のため据え置き」と明記する。

**触らない箇所**: L67 以下の "未完了タスク" リスト（古い計画のため、named DB と無関係な Task 2.3〜Phase 9 が列挙されているが範囲外）。L95 以下のアーキテクチャ・次のステップ・ビルド手順なども据え置き。

---

### 2.8 `CONTRIBUTING.md` ― **不要（理由明記）**

- **現状**（211 行）: 開発環境セットアップ（L13-52）、ブランチ戦略、コミット規約、コーディング標準、リリースプロセス等を記述。
- Firestore 接続の具体的な説明（env 変数・CLI フラグ・設定ファイル）は**一切ない**。L42-51 に Emulator 使用のみ言及あり、これは named DB と直交。
- **Planner 判断: 変更しない**。conductor-prompt の判断基準（「Firestore 接続の説明があれば触れる、なければ変更不要」）に合致。
- **Implementer へ**: summary.md では「不要（Firestore 接続の説明が存在しないため）」と報告する。

---

## 3. 作業順序

docs-only のためファイル間依存はない。並列に編集可能。推奨順序:

**Group A（並列可）:**
1. `articles/zenn-firex-introduction.md` （§2.2）
2. `articles/devto-firex-introduction.md` （§2.3）
3. `docs/cicd.md` （§2.5）
4. `docs/cicd-jp.md` （§2.6）
5. `IMPLEMENTATION_STATUS.md` （§2.7）

**Group B（Group A 完了後、シーケンシャル）:**
6. `npm run typecheck`
7. `npm run lint`
8. `npm test`

**Group C（最終検証 / grep-regress）:**
9. `grep -rn "FIRESTORE_DATABASE_URL" articles/ docs/ IMPLEMENTATION_STATUS.md CONTRIBUTING.md README.md README-jp.md` — Realtime DB URL 表記が `FIRESTORE_DATABASE_ID` と混同されていないこと
10. `grep -rn "databaseId\|database-id\|FIRESTORE_DATABASE_ID\|named database" articles/ docs/ IMPLEMENTATION_STATUS.md` — 追記漏れがないこと、表記が用語ルール（§1 末尾）と揃っていること
11. `git diff --stat` で touched files が次の 5 本に限定されていることを確認:
    - `articles/zenn-firex-introduction.md`
    - `articles/devto-firex-introduction.md`
    - `docs/cicd.md`
    - `docs/cicd-jp.md`
    - `IMPLEMENTATION_STATUS.md`

---

## 4. テスト方針

- **新規テスト不要**: docs-only の変更。Vitest でカバーできる挙動変更がない。
- **既存テスト実行は必須**: 万が一にも grep ベースで誤ってコードファイルを巻き込まないことを保証するため、`npm run typecheck` / `npm run lint` / `npm test` を Group B で完走させる。
- **グレップ回帰検査（手動）**: §3 Group C の step 9〜11 を実行し、用語・ファイル範囲が計画通りであることを確認する。

---

## 5. 受け入れ基準（チェックリスト）

conductor-prompt.md の「受け入れ基準」を転記 + 進捗チェック可能な形式に展開:

### 必須項目
- [ ] **MCP ツール 8 個すべてで `databaseId` の description が適切に記述されている**
  - 検証: `grep -l "databaseId:" src/mcp/tools/*.ts | wc -l` が 8、かつ全ファイルで description 文字列が存在
  - 本タスクでは変更なし（T001 で完了済み）と summary.md で報告
- [ ] **`articles/*.md` 2 件に named DB の使用例 or 言及が入っている**
  - 検証: `grep -l "database-id\|databaseId\|FIRESTORE_DATABASE_ID\|named database" articles/zenn-firex-introduction.md articles/devto-firex-introduction.md` の両方がヒット
  - §2.2 / §2.3 の (a)(b)(c) 全てが反映されていること
- [ ] **`docs/BOOT.md` / `docs/cicd*.md` のうち関連する箇所が更新されている**
  - `docs/BOOT.md`: 更新なし（§2.4 の理由を summary.md に記載）
  - `docs/cicd.md`: §2.5 の "### Named database" サブセクションが追加されている
  - `docs/cicd-jp.md`: §2.6 の "### named database を使う場合" サブセクションが追加されている
- [ ] **`IMPLEMENTATION_STATUS.md` が更新されている**
  - §2.7 の "#### Task 2.2.1: Named Database サポート ✅" セクションが追加されている
- [ ] **`CONTRIBUTING.md` は読んで、必要なら更新**
  - 更新なし（§2.8 の理由を summary.md に記載）
- [ ] **`npm run typecheck` / `npm run lint` / `npm test` が全パス**
  - Group B で実行、いずれも exit 0

### 品質項目
- [ ] 追記した日本語・英語ドキュメントで用語が §1 末尾の用語ルールと揃っている（"named database" / "(default)" / `my-db` / `staging-db`）
- [ ] `FIRESTORE_DATABASE_URL` と `FIRESTORE_DATABASE_ID` が混同されていない（Realtime DB URL と named database ID は別物という README 既存方針を維持）
- [ ] `git diff --name-only master...HEAD` に含まれるのは §3 step 11 の 5 ファイルのみ（MCP ツールやソースコードが誤って混ざっていない）
- [ ] 外部（Zenn / dev.to）への再投稿は行っていない（ローカル `articles/*.md` の更新のみ）
- [ ] CHANGELOG.md / バージョンバンプは行っていない（T002 非対象）

---

## 6. 非対象（再掲）

- `README.md` / `README-jp.md` の編集 → T001 完了済み
- `.firex.yaml` 設定例ドキュメント（README 内の該当セクションも含む） → T001 完了済み
- CLI help i18n（`src/shared/i18n.ts`） → T001 完了済み
- `src/mcp/tools/*.ts` の zod schema description → T001 完了済み
- MCP ツール全体 description への追記 → Planner 判断で見送り（§2.1）
- `IMPLEMENTATION_STATUS.md` L65 のテスト数値更新 → スコープ外
- CHANGELOG.md 更新・バージョンバンプ → リリースタスクの担当
- 外部 Zenn / dev.to への再投稿 → ユーザーが別途手動同期
