# Requirements: doctor-command

## Project Description

firex doctor コマンドの実装。環境の基本要件（Node.js、Firebase CLI、認証状態）、Firebase プロジェクト設定（.firebaserc、Firestore有効化、アクセス権限）、firex設定ファイルのバリデーション（JSON構文、スキーマ、コレクションパス）、ビルド状態をチェックし、問題を診断・報告する機能。MCP関連のチェックは対象外。

## Introduction

`firex doctor` コマンドは、firex CLI の実行環境と設定の健全性を診断するためのコマンドです。開発者が firex を使用する前に、必要な前提条件が満たされているかを確認し、問題がある場合は具体的な診断結果と修正方法を提示します。

## Requirements

### Requirement 1: 環境基本要件チェック

**Objective:** 開発者として、Node.js、Firebase CLI、認証状態などの基本的な環境要件を確認したい。これにより、firex の実行に必要な前提条件が満たされているかを把握できる。

#### Acceptance Criteria

1. When `firex doctor` コマンドが実行される, the doctor command shall Node.js のバージョンを検出し、最小要件（18.0.0以上）を満たしているか検証する
2. When `firex doctor` コマンドが実行される, the doctor command shall Firebase CLI のインストール状態とバージョンを検出する
3. When Firebase CLI がインストールされていない, the doctor command shall 警告メッセージとインストール手順を表示する
4. When `firex doctor` コマンドが実行される, the doctor command shall Firebase 認証状態（gcloud ADC またはサービスアカウント）を確認する
5. If 有効な認証情報が見つからない, then the doctor command shall 認証方法の選択肢と設定手順を表示する

### Requirement 2: Firebase プロジェクト設定チェック

**Objective:** 開発者として、Firebase プロジェクトの設定状態を確認したい。これにより、Firestore へのアクセスに必要な設定が正しく行われているかを把握できる。

#### Acceptance Criteria

1. When `firex doctor` コマンドが実行される, the doctor command shall カレントディレクトリまたは親ディレクトリに `.firebaserc` ファイルが存在するか確認する
2. When `.firebaserc` ファイルが存在する, the doctor command shall デフォルトプロジェクト ID を読み取り表示する
3. If `.firebaserc` ファイルが存在しない, then the doctor command shall Firebase プロジェクトの初期化が必要である旨を警告する
4. When 有効なプロジェクト ID が特定される, the doctor command shall Firestore API が有効化されているか確認する
5. If Firestore API が有効化されていない, then the doctor command shall API 有効化の手順を表示する
6. When 認証情報が有効な場合, the doctor command shall Firestore データベースへのアクセス権限をテストする
7. If アクセス権限が不足している, then the doctor command shall 必要な権限と設定方法を表示する

### Requirement 3: firex 設定ファイルバリデーション

**Objective:** 開発者として、firex の設定ファイルが正しく構成されているか確認したい。これにより、設定ミスによる実行時エラーを事前に防止できる。

#### Acceptance Criteria

1. When `firex doctor` コマンドが実行される, the doctor command shall `.firex.yaml` または `.firex.json` 設定ファイルの存在を確認する
2. When 設定ファイルが存在する, the doctor command shall ファイルの構文（YAML/JSON）が有効か検証する
3. If 設定ファイルに構文エラーがある, then the doctor command shall エラーの位置と内容を具体的に表示する
4. When 設定ファイルの構文が有効な場合, the doctor command shall スキーマに対してバリデーションを実行する
5. If 設定値がスキーマに違反している, then the doctor command shall 違反している項目と期待される値の形式を表示する
6. When 設定ファイルにコレクションパスが含まれる場合, the doctor command shall パスの形式が有効か検証する
7. If 設定ファイルが存在しない, then the doctor command shall デフォルト設定で動作する旨を情報として表示する

### Requirement 4: ビルド状態チェック

**Objective:** 開発者として、firex のビルド状態を確認したい。これにより、開発版を使用している場合に最新のビルドが反映されているかを把握できる。

#### Acceptance Criteria

1. When `firex doctor` コマンドが実行される, the doctor command shall `dist/` ディレクトリの存在とビルドファイルの有無を確認する
2. When ビルドファイルが存在する, the doctor command shall ソースファイルとビルドファイルのタイムスタンプを比較する
3. If ソースファイルがビルドファイルより新しい, then the doctor command shall リビルドが必要である旨を警告する
4. When npm パッケージとしてインストールされている場合, the doctor command shall ビルドチェックをスキップする

### Requirement 5: 診断結果の表示

**Objective:** 開発者として、診断結果を分かりやすい形式で確認したい。これにより、問題の有無と対処方法を素早く把握できる。

#### Acceptance Criteria

1. The doctor command shall 各チェック項目の結果をステータスアイコン（成功/警告/エラー）付きで表示する
2. The doctor command shall 全てのチェックが完了した後にサマリーを表示する
3. When 全てのチェックが成功した場合, the doctor command shall 「環境は正常です」というメッセージを表示する
4. When 警告またはエラーが存在する場合, the doctor command shall 問題の数と重要度を表示する
5. The doctor command shall エラーは終了コード 1、警告のみは終了コード 0 で終了する
6. When `--json` フラグが指定された場合, the doctor command shall 診断結果を JSON 形式で出力する
7. When `--verbose` フラグが指定された場合, the doctor command shall 各チェックの詳細な実行ログを表示する

### Requirement 6: エミュレータ環境対応

**Objective:** 開発者として、Firestore エミュレータを使用している場合でも診断を実行したい。これにより、ローカル開発環境でも適切なチェックを受けられる。

#### Acceptance Criteria

1. When `FIRESTORE_EMULATOR_HOST` 環境変数が設定されている, the doctor command shall エミュレータモードで動作していることを検出する
2. While エミュレータモードで動作している場合, the doctor command shall 本番認証チェックをスキップする
3. When エミュレータモードが検出された場合, the doctor command shall エミュレータへの接続テストを実行する
4. If エミュレータに接続できない, then the doctor command shall エミュレータの起動状態を確認するよう促す
