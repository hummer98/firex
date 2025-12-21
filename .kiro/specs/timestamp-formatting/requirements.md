# Requirements: timestamp-formatting

## Project Description

Firestore Timestamp型フィールドを人間が読みやすい日時形式（ISO 8601 + タイムゾーン）で出力する機能を追加する。システムのロケール・タイムゾーンを自動検出し、設定ファイル・環境変数・CLIオプションで上書き可能にする。date-fns v4 + @date-fns/tz を採用し、抽象化レイヤーで将来の差し替えに対応する。デフォルトフォーマットは yyyy-MM-dd'T'HH:mm:ssXXX（例: 2024-01-15T14:30:00+09:00）。新規オプションとして --raw-output（全整形オフ）、--no-color（色無効化）、--no-date-format（日付整形オフ）、--timezone、--date-format を追加。設定ファイルに output.dateFormat, output.timezone, output.color, output.rawOutput を追加。環境変数 FIREX_DATE_FORMAT, FIREX_TIMEZONE, FIREX_NO_COLOR, FIREX_RAW_OUTPUT をサポート。無効なタイムゾーン指定時は警告を出力しUTCにフォールバック。

## Introduction

本要件は、firex CLIにおけるFirestore Timestamp型フィールドの出力フォーマット機能を定義する。開発者がFirestoreデータを確認する際、Timestampオブジェクトの内部表現（seconds/nanoseconds）ではなく、人間が読みやすいISO 8601形式で日時を表示することで、開発効率とデータの可読性を向上させる。

## Requirements

### Requirement 1: Timestamp型の日時フォーマット変換

**Objective:** 開発者として、Firestore Timestamp型フィールドを人間が読みやすい日時形式で確認したい。これにより、データの内容を即座に理解でき、デバッグ作業が効率化される。

#### Acceptance Criteria

1. When Firestoreドキュメントを取得してTimestamp型フィールドが含まれている場合, the firex CLI shall Timestamp型フィールドをISO 8601形式（yyyy-MM-dd'T'HH:mm:ssXXX）で出力する
2. When Timestampフィールドを変換する場合, the firex CLI shall タイムゾーンオフセット付きの形式（例: 2024-01-15T14:30:00+09:00）で出力する
3. When ネストされたオブジェクト内にTimestamp型フィールドが存在する場合, the firex CLI shall 再帰的にすべてのTimestamp型フィールドを変換して出力する
4. When 配列内にTimestamp型フィールドが存在する場合, the firex CLI shall 配列内のすべてのTimestamp型を変換して出力する
5. The firex CLI shall date-fns および date-fns-tz ライブラリを使用してTimestamp変換を実装する
6. The firex CLI shall 将来のライブラリ差し替えに備えた抽象化レイヤー（DateFormatter インターフェース）を提供する

### Requirement 2: タイムゾーンの自動検出と設定

**Objective:** 開発者として、自分の環境に合ったタイムゾーンで日時を表示したい。これにより、ローカル時間での確認が容易になる。

#### Acceptance Criteria

1. When タイムゾーンが明示的に指定されていない場合, the firex CLI shall システムのタイムゾーンを自動検出して使用する
2. When --timezone オプションが指定された場合, the firex CLI shall 指定されたタイムゾーンを使用して日時を変換する
3. When 環境変数 FIREX_TIMEZONE が設定されている場合, the firex CLI shall その値をタイムゾーンとして使用する
4. When 設定ファイルに output.timezone が設定されている場合, the firex CLI shall その値をタイムゾーンとして使用する
5. The firex CLI shall タイムゾーン設定の優先順位を CLIオプション > 環境変数 > 設定ファイル > システム自動検出 の順で適用する
6. If 無効なタイムゾーン識別子が指定された場合, the firex CLI shall 警告メッセージを標準エラー出力に表示し、UTCにフォールバックする

### Requirement 3: 日付フォーマットのカスタマイズ

**Objective:** 開発者として、出力される日時のフォーマットをカスタマイズしたい。これにより、チームの規約やツール連携に合わせた形式で出力できる。

#### Acceptance Criteria

1. When --date-format オプションが指定された場合, the firex CLI shall 指定されたフォーマットパターンで日時を出力する
2. When 環境変数 FIREX_DATE_FORMAT が設定されている場合, the firex CLI shall その値をフォーマットパターンとして使用する
3. When 設定ファイルに output.dateFormat が設定されている場合, the firex CLI shall その値をフォーマットパターンとして使用する
4. The firex CLI shall フォーマット設定の優先順位を CLIオプション > 環境変数 > 設定ファイル > デフォルト（yyyy-MM-dd'T'HH:mm:ssXXX）の順で適用する
5. The firex CLI shall date-fns のフォーマットトークン（yyyy, MM, dd, HH, mm, ss, XXX 等）をサポートする
6. If 無効なフォーマットパターンが指定された場合, the firex CLI shall エラーメッセージを表示し、デフォルトフォーマットにフォールバックする

### Requirement 4: 出力制御オプション

**Objective:** 開発者として、出力形式を細かく制御したい。これにより、スクリプト連携やパイプライン処理に適した出力が得られる。

#### Acceptance Criteria

1. When --raw-output オプションが指定された場合, the firex CLI shall すべての整形処理（日付フォーマット、色付け等）を無効化し、元のデータ構造をそのまま出力する
2. When --no-color オプションが指定された場合, the firex CLI shall ANSIカラーコードを出力に含めない
3. When --no-date-format オプションが指定された場合, the firex CLI shall Timestamp型の日付フォーマット変換のみを無効化し、元のTimestamp構造（seconds/nanoseconds）で出力する
4. When 環境変数 FIREX_RAW_OUTPUT が "true" または "1" に設定されている場合, the firex CLI shall --raw-output と同等の動作をする
5. When 環境変数 FIREX_NO_COLOR が "true" または "1" に設定されている場合, the firex CLI shall --no-color と同等の動作をする
6. When 環境変数 NO_COLOR が設定されている場合（値は問わない）, the firex CLI shall --no-color と同等の動作をする
7. The firex CLI shall 出力制御オプションの優先順位を CLIオプション > 環境変数 > 設定ファイル > デフォルト（整形有効）の順で適用する

### Requirement 5: 設定ファイルとの統合

**Objective:** 開発者として、出力設定を設定ファイルで永続化したい。これにより、毎回オプションを指定する手間が省ける。

#### Acceptance Criteria

1. The firex CLI shall 設定ファイル（.firex.yaml / .firex.json）に output セクションを追加する
2. The firex CLI shall output.dateFormat 設定項目をサポートする
3. The firex CLI shall output.timezone 設定項目をサポートする
4. The firex CLI shall output.color 設定項目（boolean）をサポートする
5. The firex CLI shall output.rawOutput 設定項目（boolean）をサポートする
6. When 設定ファイルが存在しない場合, the firex CLI shall デフォルト値を使用する
7. When 設定ファイルに output セクションがない場合, the firex CLI shall 各項目のデフォルト値を使用する

### Requirement 6: MCP サーバーでのTimestamp変換

**Objective:** AIアシスタント（Claude等）として、Firestoreデータを人間が読みやすい形式で取得したい。これにより、ユーザーへの回答時にデータを適切に表示できる。

#### Acceptance Criteria

1. When MCP経由でドキュメントを取得した場合, the firex MCP Server shall CLIと同じTimestamp変換ロジックを適用する
2. When MCPツールにtimezone パラメータが指定された場合, the firex MCP Server shall 指定されたタイムゾーンで日時を変換する
3. When MCPツールにdateFormat パラメータが指定された場合, the firex MCP Server shall 指定されたフォーマットで日時を出力する
4. When MCPツールにrawOutput パラメータが true で指定された場合, the firex MCP Server shall 整形処理を無効化して元のデータ構造を返す
5. The firex MCP Server shall 環境変数および設定ファイルの設定をデフォルト値として使用する

### Requirement 7: 出力フォーマットとの互換性

**Objective:** 開発者として、既存の出力フォーマット（JSON/YAML/Table）でもTimestamp変換を利用したい。これにより、好みの出力形式を維持しながら日時の可読性を向上できる。

#### Acceptance Criteria

1. When JSON出力形式が選択されている場合, the firex CLI shall Timestamp型を変換した文字列値をJSON内に出力する
2. When YAML出力形式が選択されている場合, the firex CLI shall Timestamp型を変換した文字列値をYAML内に出力する
3. When Table出力形式が選択されている場合, the firex CLI shall Timestamp型を変換した文字列値をテーブルセル内に出力する
4. While --raw-output が有効な場合, the firex CLI shall すべての出力形式でTimestamp変換を無効化する
5. While --no-date-format が有効な場合, the firex CLI shall すべての出力形式でTimestamp変換のみを無効化する

**Status**: Generated

**Next Step**: この要件をレビューし、追加・修正が必要な場合はお知らせください。問題なければ `/kiro:spec-design timestamp-formatting` で設計フェーズに進んでください。
