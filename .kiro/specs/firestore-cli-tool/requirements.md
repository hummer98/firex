# Requirements: firestore-cli-tool

## プロジェクト概要

firexは、Firebase Firestoreデータベースに対してコマンドラインから操作を行うためのCLIツールです。開発者がFirestoreのドキュメントやコレクションの読み取り、書き込み、削除、クエリ実行などを効率的に行えるようにすることを目的としています。

### 技術要件

- **実装言語:** TypeScript
- **実行方法:** `npx firex [command]` で直接実行可能
- **パッケージ管理:** npm/pnpm を使用
- **配布形式:** npmパッケージとして公開

## Requirements

### Requirement 1: 認証と接続管理

**目的:** 開発者として、Firestoreに安全に接続できるようにしたい。これにより、認証済みの操作が可能になる。

#### 受け入れ基準

1. When ユーザーがサービスアカウントキーファイルのパスを指定した場合, the CLI Tool shall Firestoreへの認証済み接続を確立する
2. When ユーザーがプロジェクトIDを指定した場合, the CLI Tool shall 指定されたFirestoreプロジェクトに接続する
3. If 認証情報が無効または見つからない場合, then the CLI Tool shall エラーメッセージを表示して処理を中断する
4. If 接続がタイムアウトした場合, then the CLI Tool shall リトライ可能なエラーメッセージを表示する
5. The CLI Tool shall 環境変数からの認証情報の読み込みをサポートする
6. When 環境変数FIRESTORE_EMULATOR_HOSTが設定されている場合, the CLI Tool shall Firestore Emulatorに接続する

### Requirement 2: ドキュメント読み取り操作

**目的:** 開発者として、Firestoreのドキュメントを簡単に読み取りたい。これにより、データの確認とデバッグが効率的に行える。

#### 受け入れ基準

1. When ユーザーが`get`コマンドでドキュメントパス(コレクション/ドキュメントID)を指定した場合, the CLI Tool shall 該当するドキュメントのデータを取得して表示する
2. When ユーザーが出力フォーマット(JSON, YAML, Table)を指定した場合, the CLI Tool shall 指定されたフォーマットでデータを表示する
3. If 指定されたドキュメントが存在しない場合, then the CLI Tool shall 「ドキュメントが見つかりません」というメッセージを表示する
4. The CLI Tool shall 取得したドキュメントのメタデータ(作成日時、更新日時)を表示する
5. When ユーザーが`--watch`フラグを指定した場合, the CLI Tool shall 初期データを表示した後、onSnapshotを使用してドキュメントの変更を監視し続ける（初期表示の有無は設定ファイルまたは`--show-initial`フラグで制御可能）
6. When `--watch`モードで変更が検出された場合, the CLI Tool shall 変更されたドキュメントを指定フォーマットで出力し、変更タイプ(added/modified/removed)を表示する

### Requirement 3: ドキュメント書き込み操作

**目的:** 開発者として、CLIからFirestoreにデータを書き込みたい。これにより、テストデータの投入や手動データ修正が可能になる。

#### 受け入れ基準

1. When ユーザーが`set`コマンドでドキュメントパスとJSONデータを指定した場合, the CLI Tool shall 新規ドキュメントを作成するまたは既存ドキュメントを上書きする
2. When ユーザーが`set`コマンドで`--merge`フラグを指定した場合, the CLI Tool shall 既存データを保持しながら指定フィールドのみを更新する
3. When ユーザーが`update`コマンドを実行した場合, the CLI Tool shall `set --merge`と同様の動作(部分更新)を実行する
4. When ユーザーがJSONファイルからのデータ読み込みを指定した場合, the CLI Tool shall ファイルからデータを読み込んで書き込む
5. If JSONデータの形式が不正な場合, then the CLI Tool shall バリデーションエラーを表示して処理を中断する
6. If 書き込み権限がない場合, then the CLI Tool shall 権限エラーを表示する
7. The CLI Tool shall 書き込み成功時に確認メッセージとドキュメントパスを表示する

### Requirement 4: ドキュメント削除操作

**目的:** 開発者として、不要なドキュメントやコレクションを削除したい。これにより、データの整理とクリーンアップが可能になる。

#### 受け入れ基準

1. When ユーザーがドキュメントパスを指定して削除を実行した場合, the CLI Tool shall 該当するドキュメントを削除する
2. When ユーザーがコレクション全体の削除を指定した場合, the CLI Tool shall コレクション内の全ドキュメントを再帰的に削除する
3. When ユーザーが削除確認フラグを指定していない場合, the CLI Tool shall 削除前に確認プロンプトを表示する
4. If 削除対象のドキュメントが存在しない場合, then the CLI Tool shall 警告メッセージを表示する
5. The CLI Tool shall 削除されたドキュメント数を表示する

### Requirement 5: コレクション一覧とクエリ実行機能

**目的:** 開発者として、Firestoreのコレクション内のドキュメント一覧を取得したい、また条件付きクエリを実行したい。これにより、特定の条件に合致するデータを効率的に検索できる。

#### 受け入れ基準

1. When ユーザーが`list`コマンドでコレクションパスを指定した場合, the CLI Tool shall コレクション内のドキュメント一覧を取得して表示する
2. When ユーザーがフィルター条件を指定した場合, the CLI Tool shall 条件に合致するドキュメントのみを取得して表示する
3. When ユーザーがソート順を指定した場合, the CLI Tool shall 指定されたフィールドで結果をソートする
4. When ユーザーが取得件数制限を指定した場合, the CLI Tool shall 指定された件数までの結果を返す
5. When ユーザーが複合クエリ条件(AND, OR)を指定した場合, the CLI Tool shall 複数条件を組み合わせたクエリを実行する
6. If クエリ結果が0件の場合, then the CLI Tool shall 「一致するドキュメントがありません」と表示する
7. The CLI Tool shall クエリ実行時間と取得件数を表示する
8. The CLI Tool shall `list`コマンドのデフォルト取得件数を100件とし、設定ファイルでカスタマイズ可能にする
9. When ユーザーが`--watch`フラグを指定した場合, the CLI Tool shall 初期データを表示した後、onSnapshotを使用してコレクションの変更を監視し続ける（初期表示の有無は設定ファイルまたは`--show-initial`フラグで制御可能）
10. When `--watch`モードで変更が検出された場合, the CLI Tool shall 変更されたドキュメントのみを指定フォーマットで出力し、変更タイプ(added/modified/removed)を表示する
11. If ユーザーが`--watch`と`--limit`を同時に指定した場合, then the CLI Tool shall エラーメッセージを表示して処理を中断する(意味がないため)

### Requirement 6: バッチ操作とインポート/エクスポート

**目的:** 開発者として、複数のドキュメントを一括処理したい。これにより、データ移行やバックアップが効率的に行える。

#### 受け入れ基準

1. When ユーザーがエクスポートコマンドを実行した場合, the CLI Tool shall 指定されたコレクションの全データをJSONファイルにエクスポートする
2. When ユーザーがインポートコマンドを実行した場合, the CLI Tool shall JSONファイルからデータを読み込んで一括書き込みを実行する
3. When ユーザーがバッチサイズを指定した場合, the CLI Tool shall 指定されたサイズごとにバッチ処理を実行する
4. The CLI Tool shall デフォルトバッチサイズを500件とする
5. If インポートファイルの形式が不正な場合, then the CLI Tool shall エラー行番号と詳細を表示する
6. The CLI Tool shall バッチ処理の進捗状況(処理済み件数/総件数)を表示する
7. The CLI Tool shall エクスポート時にサブコレクションを含めるオプションを提供する

### Requirement 7: エラーハンドリングとロギング

**目的:** 開発者として、問題発生時に詳細な情報を取得したい。これにより、トラブルシューティングが効率的に行える。

#### 受け入れ基準

1. If 任意の操作でエラーが発生した場合, then the CLI Tool shall エラーの種類と原因を明確に表示する
2. When ユーザーが詳細モード(verbose)を有効にした場合, the CLI Tool shall デバッグ情報とスタックトレースを表示する
3. When ユーザーがログファイル出力を指定した場合, the CLI Tool shall 全操作履歴をファイルに記録する
4. If Firestore APIがエラーを返した場合, then the CLI Tool shall APIエラーコードとメッセージを表示する
5. The CLI Tool shall ネットワークエラー時に再試行可能であることを示す

### Requirement 8: 設定管理

**目的:** 開発者として、頻繁に使用する設定を保存したい。これにより、毎回の設定入力が不要になる。

#### 受き入れ基準

1. When ユーザーが設定ファイルを作成した場合, the CLI Tool shall デフォルトプロジェクトIDと認証情報パスを保存する
2. When ユーザーがプロファイルを指定した場合, the CLI Tool shall 該当するプロファイルの設定を読み込む
3. When ユーザーが設定の表示コマンドを実行した場合, the CLI Tool shall 現在有効な設定値を表示する
4. The CLI Tool shall ホームディレクトリの設定ファイル（.firex.yaml, .firex.yml, .firex.json, package.json）を自動的に検索・読み込む
5. The CLI Tool shall コマンドライン引数が設定ファイルの値を上書きできるようにする
6. The CLI Tool shall `list`コマンドのデフォルト取得件数を設定ファイルで指定可能にする
7. The CLI Tool shall `--watch`モードの初期出力の有無を設定ファイルで指定可能にする

### Requirement 9: ヘルプとドキュメント

**目的:** 開発者として、CLIツールの使い方を簡単に理解したい。これにより、学習コストを削減できる。

#### 受け入れ基準

1. When ユーザーが--helpフラグを指定した場合, the CLI Tool shall 利用可能なコマンドとオプションの一覧を表示する
2. When ユーザーが特定のコマンドに対して--helpを指定した場合, the CLI Tool shall そのコマンドの詳細な使用方法を表示する
3. When ユーザーがexamplesコマンドを実行した場合, the CLI Tool shall よくある使用例を表示する
4. The CLI Tool shall バージョン情報を表示するオプションを提供する
5. The CLI Tool shall エラーメッセージに関連するヘルプコマンドの提案を含める

### Requirement 10: CLIフレームワーク統合

**目的:** 開発者として、`npx firex`コマンドで即座にCLIツールを実行したい。これにより、インストールなしで利用を開始できる。

#### 受け入れ基準

1. When ユーザーが`npx firex`を実行した場合, the CLI Tool shall oclifフレームワークを通じてコマンドルーターを起動する
2. When ユーザーが`firex <command>`を実行した場合, the CLI Tool shall 対応するコマンドハンドラーにルーティングする
3. The CLI Tool shall package.jsonにoclif設定セクションを含み、コマンドディレクトリとビルド出力パスを正しく指定する
4. The CLI Tool shall src/index.tsでoclif executeを呼び出し、CLIエントリーポイントとして機能する
5. When 存在しないコマンドが指定された場合, the CLI Tool shall 「コマンドが見つかりません」エラーと利用可能なコマンド一覧を表示する
6. The CLI Tool shall bin/run.jsからdist/index.jsを正しくインポートし、CLIを起動する
