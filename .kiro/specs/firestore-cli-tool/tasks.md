# 実装タスク: firestore-cli-tool

## タスク概要

本ドキュメントは、Firebase Firestore用CLIツール「firex」の実装タスクを定義します。各タスクは1-3時間で完了可能な粒度に分割されており、並列実行可能なタスクには `(P)` マーカーを付与しています。

## タスクリスト

- [x] 1. プロジェクトセットアップと基盤構築
- [x] 1.1 (P) プロジェクト初期化とビルド環境構成
  - TypeScriptプロジェクト初期化（tsconfig.json、package.json）
  - tsupビルド設定（CJS/ESM両対応）
  - npmパッケージメタデータ設定（name, bin, engines）
  - ~~oclifフレームワーク統合とCLIエントリーポイント設定~~ → **タスク10に移動**
  - _Requirements: 1.1, 1.2_
  - **Note**: oclif統合は別途タスク10で実装（本タスクはビルド環境のみ）

- [x] 1.2 (P) 依存関係インストールと型定義
  - firebase-admin v13.6.0インストールと型定義
  - oclif v3.x、neverthrow v7.x、cosmiconfig v9.xインストール
  - @inquirer/prompts v7.x（PromptService用）、cli-table3、js-yamlインストール
  - 共有型定義ファイル（shared/types.ts）作成
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Application Layer実装
- [x] 2.1 ConfigService実装
  - cosmiconfigによる設定ファイル検索・読み込み機能
  - 環境変数読み取りとCLIフラグマージロジック（優先順位: CLIフラグ > 環境変数 > 設定ファイル）
  - プロファイル機能サポート
  - Config型定義（defaultListLimit, watchShowInitial含む）とResult<Config, ConfigError>パターン実装
  - _Requirements: 1.2, 1.5, 8.6, 8.7, 9.1, 9.2, 9.4, 9.5_

- [x] 2.2 AuthService実装
  - Firebase Admin SDK初期化ロジック（サービスアカウント、ADC対応）
  - Firestoreインスタンス取得とシングルトン管理
  - 認証エラーハンドリング（INVALID_CREDENTIALS, CONNECTION_TIMEOUT, PROJECT_NOT_FOUND, PERMISSION_DENIED）
  - Result<Firestore, AuthError>パターン実装
  - oclifフック統合（init hook）検討と実装
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.3 (P) ErrorHandler実装
  - Result型エラーのユーザーフレンドリーメッセージ変換
  - Firestore APIエラーコード解釈と日本語メッセージマッピング
  - エラー種類別メッセージフォーマット（User/System/Business Logic）
  - verbose=true時のスタックトレース表示
  - ヘルプコマンド提案機能
  - _Requirements: 1.3, 1.4, 2.4, 3.5, 4.4, 8.1, 8.4, 8.5, 10.5_

- [x] 2.4 (P) LoggingService実装
  - ログレベル別出力（error, warn, info, debug）
  - タイムスタンプとログレベルフォーマット
  - ログファイル出力機能
  - クレデンシャルマスキング実装
  - _Requirements: 8.2, 8.3_

- [x] 3. Domain Layer - Firestore操作実装
- [x] 3.1 FirestoreOps実装
  - ドキュメント取得（getDocument）とメタデータ抽出
  - コレクション一覧取得（listDocuments）
  - ドキュメント作成・更新（setDocument、マージ対応）
  - ドキュメント削除（deleteDocument）
  - Firestoreパスバリデーション（正規表現パターン実装）
  - Result<DocumentWithMeta, Error>パターン実装
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 4.1_

- [x] 3.2 QueryBuilder実装
  - where条件、orderBy、limitを組み合わせたクエリ構築
  - 複合クエリ（AND条件）サポート
  - クエリ実行とパフォーマンス測定（execution time）
  - カーソルベースページネーション（startAfter）
  - クエリバリデーション（演算子、フィールド組み合わせ検証）
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3.3 BatchProcessor実装
  - Firestoreバッチ書き込み（500件制限遵守）
  - コレクション再帰削除
  - エクスポート機能（JSON形式、サブコレクション対応）
  - インポート機能（バリデーション、進捗表示、べき等性確保）
  - 進捗ファイル（.firex-import-progress.json）管理
  - バッチコミット失敗時の部分成功対応
  - _Requirements: 4.2, 6.1, 6.2, 6.3, 6.5, 6.6_

- [x] 3.4 (P) ValidationService実装
  - Firestoreドキュメントデータ検証（undefined, function等除外）
  - インポートファイルスキーマ検証
  - Firestoreパスフォーマット検証
  - JSONバリデーションエラー詳細メッセージ生成
  - _Requirements: 3.5, 6.4_

- [x] 3.5 WatchService実装
  - onSnapshotによるドキュメント監視（watchDocument）
  - onSnapshotによるコレクション監視（watchCollection）
  - 変更タイプ検出（added/modified/removed）
  - 接続エラー時の自動再接続ロジック（最大3回）
  - Unsubscribe関数管理（Ctrl+C時のクリーンアップ）
  - 初期出力制御（showInitialパラメータ）
  - _Requirements: 2.5, 2.6, 5.9, 5.10, 5.11_

- [x] 4. Presentation Layer - 出力とファイルI/O
- [x] 4.1 (P) OutputFormatter実装
  - JSON/YAML/Table形式変換
  - メタデータ整形表示
  - カラーコード対応（オプション）
  - cli-table3、js-yaml統合
  - _Requirements: 2.3, 2.5_

- [x] 4.2 (P) FileSystemService実装
  - JSONファイル読み込み・書き込み
  - ファイル存在確認
  - ファイルパス正規化
  - Result<T, FileError>パターン実装
  - _Requirements: 3.3, 6.1, 6.2_

- [x] 4.3 (P) PromptService実装
  - Yes/No確認プロンプト表示
  - テキスト入力プロンプト
  - @inquirer/prompts統合
  - _Requirements: 4.3_

- [x] 5. Command Layer - 基本CRUD操作
- [x] 5.1 BaseCommandクラス実装
  - oclif Command基底クラス継承
  - 共通フラグ定義（verbose, project-id, credential-path）
  - 共通初期化処理（ConfigService、AuthService呼び出し）
  - エラーハンドリング共通ロジック
  - _Requirements: 1.1, 1.2, 1.3, 8.1_

- [x] 5.2 GetCommand実装
  - ドキュメント読み取りコマンド定義
  - ドキュメントパスバリデーション（偶数セグメントのみ）
  - formatフラグ処理（json, yaml, table）
  - watchフラグ処理（WatchService統合）
  - FirestoreOps呼び出しと結果出力
  - 存在しないドキュメントエラーメッセージ
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5.3 SetCommand実装
  - ドキュメント作成・上書きコマンド定義
  - JSON文字列パースとファイル読み込み対応（--from-file）
  - マージフラグ処理（--merge）
  - ValidationService呼び出しとバリデーションエラー表示
  - 書き込み成功確認メッセージ
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7_

- [x] 5.4 UpdateCommand実装
  - ドキュメント部分更新コマンド定義（set --mergeのエイリアス）
  - JSON文字列パースとファイル読み込み対応（--from-file）
  - ValidationService呼び出しとバリデーションエラー表示
  - 書き込み成功確認メッセージ
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5.5 DeleteCommand実装
  - ドキュメント/コレクション削除コマンド定義
  - 再帰削除フラグ処理（--recursive）
  - 削除確認プロンプト（--yesフラグなし時）
  - 削除件数表示
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.6 ListCommand実装
  - コレクション一覧取得/クエリ実行コマンド定義
  - コレクションパスバリデーション（奇数セグメントのみ）
  - whereフラグ複数受付とWhereCondition配列変換
  - order-byフラグ処理とソート順指定
  - limitフラグ処理（デフォルト100件、設定ファイルでカスタマイズ可能）
  - watchフラグ処理（WatchService統合）
  - watchとlimitの同時指定バリデーション（禁止）
  - クエリ実行時間測定と結果件数表示
  - 結果0件時のメッセージ表示
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

- [x] 6. Command Layer - バッチ操作とユーティリティ
- [x] 6.1 ExportCommand実装
  - コレクションエクスポートコマンド定義
  - outputフラグ処理
  - include-subcollectionsフラグ処理
  - 進捗表示
  - エクスポート完了メッセージ（件数表示）
  - _Requirements: 6.1, 6.5, 6.6_

- [x] 6.2 ImportCommand実装
  - JSONファイルインポートコマンド定義
  - batch-sizeフラグ処理
  - 進捗表示
  - インポート結果表示（成功/スキップ/失敗件数）
  - バリデーションエラー詳細表示（行番号付き）
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 6.3 (P) ConfigCommand実装
  - 設定表示コマンド定義（--show）
  - 設定保存コマンド（--set）
  - 現在有効な設定値表示
  - _Requirements: 9.3_

- [x] 6.4 (P) ExamplesCommand実装
  - 使用例表示コマンド定義
  - よくある使用例のリスト作成
  - _Requirements: 10.3_

- [x] 7. ヘルプとドキュメント
- [x] 7.1 (P) oclif組み込みヘルプシステム設定
  - 各コマンドのdescription、examples設定
  - フラグのdescription設定
  - --helpフラグ動作確認
  - --versionフラグ設定
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 8. テストとQA
- [x] 8.1 (P) ユニットテスト実装
  - AuthService、ConfigService、ValidationService、QueryBuilder、WatchServiceのユニットテスト
  - Firebase Admin SDKモック化（onSnapshotモック含む）
  - Result型パターンのテストケース
  - 境界値テスト（limit=0、ネストされたオブジェクト等）
  - WatchService再接続ロジックのテスト
  - _Requirements: 1.1, 1.2, 1.3, 2.5, 2.6, 3.5, 5.1, 5.2, 5.9, 5.10_

- [x] 8.2 統合テスト実装（Firestore Emulator使用）
  - 認証→ドキュメント読み取りフロー
  - 設定読み込み→認証フロー
  - バッチインポートフロー
  - Watch監視フロー（onSnapshot統合）
  - エラーハンドリングフロー
  - _Requirements: 1.1, 2.1, 2.5, 6.2, 8.1_
  - **Note**: Requires Firestore Emulator setup
  - **Implementation**: `src/integration/integration.test.ts`, `docker-compose.yml`, `firebase.json`

- [x] 8.3 E2Eテスト実装
  - oclif test frameworkとFirestore Emulator統合
  - getコマンドテスト（ドキュメント読み取り、--watchフラグ）
  - listコマンドテスト（コレクション一覧、クエリ、--watchフラグ）
  - set/updateコマンドテスト
  - バッチエクスポート/インポートコマンドテスト
  - エラーハンドリングと終了コード検証
  - _Requirements: 2.1, 2.5, 3.1, 3.3, 5.1, 5.9, 6.1, 6.2, 8.1_
  - **Note**: Requires Firestore Emulator and oclif test framework setup
  - **Implementation**: `src/e2e/e2e.test.ts`

- [x] 8.4 (P) パフォーマンステスト実装
  - バッチインポートテスト（5,000件、>500件/秒）
  - クエリパフォーマンステスト（複合クエリ、<2秒）
  - エクスポートテスト（サブコレクション含む、メモリ<1GB）
  - _Requirements: 5.1, 6.1, 6.2_
  - **Note**: Requires Firestore Emulator and large test datasets
  - **Implementation**: `src/performance/performance.test.ts`

- [x] 9. 最終統合とリリース準備
- [x] 9.1 エラーメッセージとロギングの最終調整
  - 全エラーメッセージの日本語化確認
  - クレデンシャルマスキング動作確認
  - ログファイル出力テスト
  - エラー終了コード（0/1/2）検証
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - **Implementation**: `src/services/error-handler.final.test.ts`

- [x] 9.2 README.mdとドキュメント作成
  - インストール手順（npx firex）
  - クイックスタートガイド
  - コマンドリファレンス
  - 設定ファイルサンプル（.firex.yaml）
  - トラブルシューティング
  - セキュリティ考慮事項（サービスアカウントキー保護）
  - _Requirements: 10.1, 10.2, 10.3_
  - **Implementation**: `README.md`

- [x] 9.3 npmパッケージ公開準備
  - package.json最終調整（version, description, keywords）
  - .npmignoreファイル設定
  - LICENSEファイル作成
  - npm publishドライラン実行
  - CI/CDパイプライン設定（GitHub Actions: ci.yml, release.yml, version-bump.yml）
  - CHANGELOG.md初期化とconventional-changelog設定
  - リリースブランチ戦略ドキュメント作成（CONTRIBUTING.md）
  - バージョニングとタグ付けスクリプト追加（package.jsonにscripts設定）
  - npmレジストリ公開テスト（--dry-run）
  - _Requirements: 1.1_
  - **Implementation**: `package.json`, `.npmignore`, `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/version-bump.yml`

- [x] 9.4 セキュリティとコンプライアンス最終確認
  - .gitignoreにサービスアカウントキーパターン追加
  - エクスポートファイルパーミッション設定（600）確認
  - ログファイル内クレデンシャル記録なし確認
  - 依存パッケージ脆弱性スキャン（npm audit）
  - _Requirements: 1.1, 6.1, 8.3_
  - **Implementation**: `.gitignore`, `src/security/security.test.ts`

- [x] 10. oclifフレームワーク統合（**CRITICAL - 完了**）
- [x] 10.1 package.json oclif設定追加
  - package.jsonに`oclif`セクション追加
  - `bin`: "firex"
  - `dirname`: "firex"
  - `commands`: "./dist/commands"
  - `topicSeparator`: " "
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - **Acceptance Criteria**:
    - [x] package.jsonに`oclif`セクションが存在する
    - [x] `oclif.commands`が`./dist/commands`を指している
  - **Implementation**: `package.json`

- [x] 10.2 CLIエントリーポイント実装（src/index.ts）
  - `@oclif/core`からexecuteをインポート
  - run()関数でexecute({ dir: import.meta.url })を呼び出し
  - 既存のconsole.logプレースホルダーを削除
  - _Requirements: 10.1, 10.2, 10.4_
  - **Acceptance Criteria**:
    - [x] src/index.tsで`@oclif/core`の`execute`を呼び出している
    - [x] `npx firex --help`でコマンド一覧が表示される
    - [x] `npx firex --version`でバージョンが表示される
  - **Implementation**: `src/index.ts`

- [x] 10.3 oclif統合動作検証
  - `npm run build`でビルド成功確認
  - `node bin/run.js --help`でヘルプ表示確認
  - `node bin/run.js get --help`で個別コマンドヘルプ確認
  - `node bin/run.js foo`（存在しないコマンド）でエラー表示確認
  - 全コマンド（get, set, update, delete, list, export, import, config, examples）の認識確認
  - _Requirements: 10.1, 10.2, 10.5_
  - **Acceptance Criteria**:
    - [x] すべてのコマンドが`--help`で表示される
    - [x] 各コマンドの`--help`が詳細情報を表示する
    - [x] 存在しないコマンドで適切なエラーメッセージが表示される
  - **Implementation**: E2Eテストまたは手動検証

## タスク実行ガイドライン

### 並列実行可能タスク

`(P)` マーカーが付与されたタスクは、以下の条件を満たすため並列実行可能です：

- データ依存なし（他タスクの出力を必要としない）
- ファイル/リソース競合なし
- 事前承認不要

### タスク依存関係

- **2.1（ConfigService）と2.2（AuthService）**: 2.2は2.1の出力（Config型）を使用するが、インターフェース定義は独立しており、実装は並列可能
- **8.2（統合テスト）と8.3（E2Eテスト）**: 8.2完了後に8.3実行推奨（統合動作確認後のエンドツーエンド検証）

### 推奨実装順序

1. **Phase 1**: 基盤構築（タスク1.1, 1.2）
2. **Phase 2**: Application Layer（タスク2.1, 2.2, 2.3, 2.4を並列実行可能）
3. **Phase 3**: Domain Layer（タスク3.1, 3.2, 3.3, 3.4, 3.5を並列実行可能）
4. **Phase 4**: Presentation Layer（タスク4.1, 4.2, 4.3を並列実行可能）
5. **Phase 5**: Command Layer - CRUD（タスク5.1完了後、5.2-5.6を並列実行可能）
6. **Phase 6**: Command Layer - Batch（タスク6.1, 6.2, 6.3, 6.4を並列実行可能）
7. **Phase 7**: ヘルプとドキュメント（タスク7.1）
8. **Phase 8**: テスト（タスク8.1並列実行可能、8.2→8.3順次、8.4並列実行可能）
9. **Phase 9**: 最終調整とリリース（タスク9.1-9.4順次実行）
10. **Phase 10**: **oclif統合（タスク10.1, 10.2, 10.3）** - CLIが動作するために必須

> **重要**: Phase 10（oclif統合）が完了していない場合、CLIコマンドは実行できません。Phase 5-6で実装したコマンドがあっても、oclif統合なしでは`firex --help`等が動作しません。

### 完了基準

各タスクは以下の基準を満たした時点で完了とします：

- コードがTypeScript型チェックを通過
- 対応する要件がすべて実装されている
- ユニットテスト（該当する場合）が通過
- コードレビュー完了（該当する場合）
- **動作検証**（該当する場合）が通過

### プロジェクト完了基準（リリース前チェックリスト）

プロジェクト全体のリリース前に、以下を確認する必要があります：

- [x] `npm run build` が成功する
- [x] `npm test` が全テスト通過する
- [x] `node bin/run.js --help` でコマンド一覧が表示される
- [x] `node bin/run.js --version` でバージョンが表示される
- [x] 各コマンド（get, set, list, delete, export, import, config, examples, update）が `--help` で説明を表示する
- [x] Firestore Emulatorに接続して基本操作（get, set, list）が動作する
