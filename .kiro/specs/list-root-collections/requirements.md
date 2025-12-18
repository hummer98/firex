# Requirements: list-root-collections

## Project Description

Firebase Admin SDKの`listCollections()`メソッドを活用して、Firestoreデータベースのルートレベルのコレクション一覧を取得・表示するコマンドを追加する。ドキュメント配下のサブコレクション一覧の取得もサポートする。

## Introduction

firex CLIツールにコレクション一覧表示機能を追加する。この機能により、ユーザーはFirestoreデータベース内のルートレベルコレクションおよびドキュメント配下のサブコレクションを探索・確認できるようになる。Firebase Admin SDKの`listCollections()`メソッドを活用し、既存のCLIコマンド群と一貫したユーザー体験を提供する。

## Requirements

### Requirement 1: ルートコレクション一覧表示

**Objective:** As a 開発者, I want Firestoreデータベースのルートレベルコレクション一覧を表示したい, so that データベース構造を把握し、操作対象のコレクションを特定できる

#### Acceptance Criteria

1. When ユーザーが引数なしで`firex collections`コマンドを実行する, the firex CLI shall ルートレベルの全コレクション名を一覧表示する
2. When コレクション一覧の取得が成功する, the firex CLI shall 取得したコレクション数を表示する
3. If ルートレベルにコレクションが存在しない, then the firex CLI shall コレクションが見つからない旨のメッセージを表示する

### Requirement 2: サブコレクション一覧表示

**Objective:** As a 開発者, I want 特定ドキュメント配下のサブコレクション一覧を表示したい, so that ネストされたデータ構造を探索できる

#### Acceptance Criteria

1. When ユーザーがドキュメントパス引数付きで`firex collections <documentPath>`コマンドを実行する, the firex CLI shall 指定ドキュメント配下のサブコレクション一覧を表示する
2. If 指定されたパスがドキュメントパスとして無効である（偶数セグメントでない）, then the firex CLI shall パスが無効である旨のエラーメッセージを表示する
3. If 指定されたドキュメントが存在しない, then the firex CLI shall ドキュメントが見つからない旨のエラーメッセージを表示する
4. If 指定ドキュメント配下にサブコレクションが存在しない, then the firex CLI shall サブコレクションが見つからない旨のメッセージを表示する

### Requirement 3: 出力フォーマット

**Objective:** As a 開発者, I want コレクション一覧を複数の出力形式で取得したい, so that スクリプトやパイプラインで活用できる

#### Acceptance Criteria

1. The firex CLI shall デフォルトでコレクション名をJSON形式（`{ "collections": [...], "count": N }`）で出力する
2. When `--json`フラグが指定される, the firex CLI shall コレクション名をJSON形式（`{ "collections": [...], "count": N }`）で出力する
3. When `--yaml`フラグが指定される, the firex CLI shall コレクション名をYAML形式で出力する
4. When `--table`フラグが指定される, the firex CLI shall コレクション名をテーブル形式で出力する
5. When `--quiet`フラグが指定される, the firex CLI shall コレクション名のみを出力し、補足メッセージを表示しない

### Requirement 4: エラーハンドリングと認証

**Objective:** As a 開発者, I want エラー発生時に適切なメッセージを受け取りたい, so that 問題を迅速に特定・解決できる

#### Acceptance Criteria

1. If Firebase認証に失敗する, then the firex CLI shall 認証エラーメッセージを表示して終了する
2. If Firestoreへのアクセス権限がない, then the firex CLI shall 権限エラーメッセージを表示して終了する
3. If ネットワークエラーが発生する, then the firex CLI shall 接続エラーメッセージを表示して終了する
4. The firex CLI shall 既存のBaseCommandクラスを継承し、認証・設定処理を再利用する

### Requirement 5: 国際化対応

**Objective:** As a 開発者, I want コマンドの説明やエラーメッセージが適切にローカライズされていてほしい, so that 使い慣れた言語で操作できる

#### Acceptance Criteria

1. The firex CLI shall コマンド説明文を既存のi18nシステムを使用してローカライズする
2. The firex CLI shall エラーメッセージを既存のi18nシステムを使用してローカライズする
3. The firex CLI shall ヘルプテキストを既存のi18nシステムを使用してローカライズする
