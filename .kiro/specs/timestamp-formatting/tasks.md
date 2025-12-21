# Implementation Plan

## Task 1: 依存ライブラリの追加とセットアップ

- [x] 1. date-fnsおよびタイムゾーン対応ライブラリをプロジェクトに追加する
  - date-fns v4 と @date-fns/tz をpackage.jsonに追加
  - 依存関係をインストールしビルドが通ることを確認
  - _Requirements: 1.5_

## Task 2: タイムゾーン検出・検証サービスの実装

- [x] 2.1 (P) システムタイムゾーン自動検出機能を実装する
  - Intl.DateTimeFormat APIを使用してシステムのIANAタイムゾーン名を取得
  - 取得失敗時はUTCをデフォルトとして返却
  - _Requirements: 2.1_

- [x] 2.2 (P) タイムゾーン識別子の検証機能を実装する
  - IANAタイムゾーン識別子の妥当性をIntl APIで検証
  - 無効なタイムゾーン指定時は警告メッセージを標準エラー出力に表示しUTCにフォールバック
  - neverthrow Result型でエラーを返却
  - _Requirements: 2.6_

## Task 3: 日時フォーマッターの実装

- [x] 3.1 日時フォーマット処理の抽象化インターフェースを定義する
  - Timestamp型からフォーマット済み文字列への変換を抽象化
  - フォーマットオプション（パターン、タイムゾーン）を受け取る設計
  - 将来のライブラリ差し替えに備えたStrategy Patternの適用
  - _Requirements: 1.6_

- [x] 3.2 date-fnsを使用した日時フォーマッター実装を作成する
  - Task 3.1のインターフェースを実装
  - date-fns v4のTZDateクラスを使用してタイムゾーン対応フォーマットを実現
  - デフォルトパターンはyyyy-MM-dd'T'HH:mm:ssXXX（ISO 8601形式）
  - タイムゾーンオフセット付き形式（例: 2024-01-15T14:30:00+09:00）で出力
  - date-fnsのフォーマットトークン（yyyy, MM, dd, HH, mm, ss, XXX等）をサポート
  - _Requirements: 1.1, 1.2, 3.5_

- [x] 3.3 フォーマットパターンとタイムゾーンの検証機能を実装する
  - 無効なフォーマットパターン指定時は警告出力後デフォルトパターンにフォールバック
  - タイムゾーン検証はTask 2で実装したTimezoneServiceを利用
  - _Requirements: 3.6_

## Task 4: Timestamp型の再帰的変換処理の実装

- [x] 4.1 Timestamp型の検出ロジックを実装する
  - _seconds と _nanoseconds プロパティの存在でFirestore Timestamp型を判定
  - toDate()メソッドの有無も考慮した柔軟な検出
  - _Requirements: 1.1_

- [x] 4.2 ネストオブジェクトと配列の再帰的変換処理を実装する
  - データ構造を再帰的に走査しすべてのTimestamp型フィールドを変換
  - ネストされたオブジェクト内のTimestamp型を正しく変換
  - 配列内のTimestamp型もすべて変換
  - 元データ構造を変更しない非破壊処理（新しいオブジェクトを返却）
  - Firestoreの最大ネストレベル（20）まで対応
  - _Requirements: 1.3, 1.4_

## Task 5: 設定ファイルへの出力設定項目追加

- [x] 5.1 (P) 設定ファイルスキーマにoutputセクションを追加する
  - .firex.yaml / .firex.json にoutputセクションの型定義を追加
  - output.dateFormat（日時フォーマットパターン）の設定項目
  - output.timezone（タイムゾーン）の設定項目
  - output.color（色付け有効/無効）の設定項目
  - output.rawOutput（全整形処理の無効化）の設定項目
  - zodスキーマによる設定値の検証
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.2 (P) 設定ファイルが存在しない場合やoutputセクションがない場合のデフォルト値処理を実装する
  - 設定ファイルが存在しない場合はデフォルト値を使用
  - outputセクションがない場合も各項目のデフォルト値を使用
  - デフォルト: dateFormat=yyyy-MM-dd'T'HH:mm:ssXXX, timezone=system, color=true, rawOutput=false
  - _Requirements: 5.6, 5.7_

## Task 6: 環境変数サポートの実装

- [x] 6. 出力設定に関する環境変数の読み込み機能を実装する
  - FIREX_TIMEZONE 環境変数によるタイムゾーン設定
  - FIREX_DATE_FORMAT 環境変数によるフォーマットパターン設定
  - FIREX_RAW_OUTPUT 環境変数（"true"または"1"で有効化）
  - FIREX_NO_COLOR 環境変数（"true"または"1"で有効化）
  - NO_COLOR 環境変数（値の有無のみで判定）
  - _Requirements: 2.3, 3.2, 4.4, 4.5, 4.6_

## Task 7: CLIオプションの追加

- [x] 7. BaseCommandに新規CLIフラグを追加する
  - --timezone オプション（IANAタイムゾーン指定）
  - --date-format オプション（日時フォーマットパターン指定）
  - --raw-output オプション（全整形処理を無効化）
  - --no-color オプション（ANSIカラーコード無効化）
  - --no-date-format オプション（日付フォーマット変換のみ無効化）
  - oclifのFlags定義に追加
  - _Requirements: 2.2, 3.1, 4.1, 4.2, 4.3_

## Task 8: 出力オプション優先順位解決の実装

- [x] 8. CLIオプション・環境変数・設定ファイル・デフォルト値の優先順位に従ってオプションを解決する機能を実装する
  - 優先順位: CLIオプション > 環境変数 > 設定ファイル > システム自動検出/デフォルト
  - タイムゾーン設定の優先順位解決
  - 日時フォーマット設定の優先順位解決
  - 出力制御オプション（rawOutput, color, noDateFormat）の優先順位解決
  - TimezoneServiceとの連携によるタイムゾーン解決
  - _Requirements: 2.4, 2.5, 3.3, 3.4, 4.7_

## Task 9: OutputFormatterへの統合

> **Note**: OutputFormatter自体への統合は完了。CLIコマンドからの呼び出し時の統合は Task 14 で対応。

- [x] 9.1 OutputFormatterにTimestamp変換処理を統合する
  - formatDocument/formatDocumentsの変換前にTimestamp処理を挿入
  - rawOutput有効時はTimestamp変換処理をスキップ
  - noDateFormat有効時はTimestamp変換のみ無効化し他の整形は維持
  - _Requirements: 4.1, 4.3, 7.4, 7.5_

- [x] 9.2 各出力形式（JSON/YAML/Table/Toon）でのTimestamp変換を確認する
  - JSON出力形式でTimestamp型を変換した文字列値を出力
  - YAML出力形式でTimestamp型を変換した文字列値を出力
  - Table出力形式でTimestamp型を変換した文字列値をセル内に出力
  - _Requirements: 7.1, 7.2, 7.3_

## Task 10: MCPツールへのフォーマットパラメータ追加

- [x] 10.1 MCPツールスキーマにフォーマットパラメータを追加する
  - timezone パラメータ（IANAタイムゾーン指定）
  - dateFormat パラメータ（フォーマットパターン指定）
  - rawOutput パラメータ（整形処理無効化）
  - get, list等の既存ツールにパラメータを追加
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 10.2 MCP経由のドキュメント取得でTimestamp変換を適用する
  - CLIと同じTimestamp変換ロジックをMCPツールに適用
  - 環境変数および設定ファイルの設定をデフォルト値として使用
  - MCPツールパラメータで設定を上書き可能にする
  - _Requirements: 6.1, 6.5_

## Task 11: ユニットテストの実装

- [x] 11.1 (P) 日時フォーマッターのユニットテストを実装する
  - 各種フォーマットパターンでの変換テスト
  - 有効/無効なタイムゾーン検証テスト
  - 無効なパターン指定時のフォールバック動作テスト
  - _Requirements: 1.1, 1.2, 2.6, 3.5, 3.6_

- [x] 11.2 (P) Timestamp変換処理のユニットテストを実装する
  - Timestamp型検出の境界ケーステスト
  - ネスト・配列・複合構造の変換テスト
  - noDateFormat有効時のスキップ動作テスト
  - _Requirements: 1.3, 1.4_

- [x] 11.3 (P) 出力オプション解決のユニットテストを実装する
  - CLIオプション優先テスト
  - 環境変数優先テスト
  - 設定ファイル優先テスト
  - デフォルト値フォールバックテスト
  - _Requirements: 2.5, 3.4, 4.7_

## Task 12: 統合テストの実装

- [x] 12.1 CLIコマンドでのTimestamp変換統合テストを実装する
  - firex get コマンドでのTimestamp表示テスト
  - --timezone オプションによる変換テスト
  - --raw-output での元データ出力テスト
  - --no-date-format でのTimestamp変換スキップテスト
  - _Requirements: 1.1, 2.2, 4.1, 4.3_

- [x] 12.2 設定ファイルと環境変数の統合テストを実装する
  - .firex.yaml の output 設定読み込みテスト
  - 環境変数（FIREX_TIMEZONE等）適用テスト
  - NO_COLOR環境変数の動作テスト
  - _Requirements: 2.3, 2.4, 3.2, 3.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 12.3 MCP経由のTimestamp変換統合テストを実装する
  - MCPツールでのTimestamp変換テスト
  - MCPパラメータによる設定上書きテスト
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Task 13: E2Eテストの実装

- [x] 13.1 全出力形式でのTimestamp表示E2Eテストを実装する
  - JSON形式でのTimestamp表示確認
  - YAML形式でのTimestamp表示確認
  - Table形式でのTimestamp表示確認
  - 各形式でのrawOutput動作確認
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Task 14: CLIコマンドへのタイムスタンプオプション統合

- [x] 14.1 get.ts に OutputOptionsResolver を統合する
  - TimezoneService と OutputOptionsResolver を import
  - run() で flags からタイムスタンプオプションを解決
  - fetchDocument() に timestampOptions パラメータを追加
  - outputFormatter.formatDocument() に timestampOptions を渡す
  - _Requirements: 2.2, 3.1, 4.1, 4.3, 7.1, 7.4, 7.5_

- [x] 14.2 list.ts に OutputOptionsResolver を統合する
  - TimezoneService と OutputOptionsResolver を import
  - run() で flags からタイムスタンプオプションを解決
  - queryCollection() に timestampOptions パラメータを追加
  - outputFormatter.formatDocuments() に timestampOptions を渡す
  - _Requirements: 2.2, 3.1, 4.1, 4.3, 7.1, 7.4, 7.5_

- [x] 14.3 CLI統合の動作確認テストを追加する
  - get コマンドでの --timezone オプション動作確認
  - list コマンドでの --date-format オプション動作確認
  - --raw-output と --no-date-format の動作確認
  - _Requirements: 2.2, 3.1, 4.1, 4.3_
