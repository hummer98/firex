# Implementation Plan

## Task Overview

本機能はfirex CLIの出力フォーマットにTOON形式を追加する。ToonEncoderラッパーの作成、OutputFormatterの拡張、CLIフラグの追加、MCPツールの対応を行う。

## Tasks

- [x] 1. 基盤の整備
- [x] 1.1 (P) 依存パッケージのインストールと型定義の更新
  - @toon-format/toonパッケージをプロジェクトに追加
  - OutputFormat型に'toon'を追加して型安全性を確保
  - 無効な形式文字列が指定された場合のエラーハンドリングを既存パターンで維持
  - _Requirements: 8.1, 8.2_

- [x] 1.2 (P) i18n対応のメッセージ追加
  - TOONフラグ用の説明文を日本語・英語で追加
  - 'flag.toon'キーをMessages interfaceに追加
  - _Requirements: 1.1_

- [x] 2. TOON変換機能の実装
- [x] 2.1 ToonEncoderラッパーの作成
  - @toon-format/toonのencode関数をラップするサービスクラスを作成
  - neverthrowのResult型でエラーを返却する設計
  - NaN/Infinity値のnull変換はライブラリ側で処理
  - 変換失敗時に適切なFormatErrorを返す
  - _Requirements: 1.1, 7.1, 7.2_

- [x] 2.2 OutputFormatterへのTOON形式追加
  - formatDocumentメソッドにtoonケースを追加し単一ドキュメントをTOON形式で出力
  - formatDocumentsメソッドにtoonケースを追加し複数ドキュメントをTOON形式で出力
  - formatChangeメソッドにtoonケースを追加し変更イベントをTOON形式で出力
  - formatCollectionsメソッドにtoonケースを追加しコレクション一覧をTOON形式で出力
  - メタデータ付き出力でID、パス、作成日時、更新日時を含める
  - 2.1のToonEncoderに依存
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.2, 5.1, 5.2, 7.1, 7.2_

- [x] 3. CLIコマンドの拡張
- [x] 3.1 BaseCommandへのTOONフラグ追加
  - baseFlagsに--toonブールフラグを追加
  - formatフラグのoptions配列に'toon'を追加
  - resolveFormatメソッドで--toonフラグを'toon'形式に解決
  - 2.2の完了後に統合テスト可能
  - _Requirements: 1.1, 8.1_

- [x] 3.2 各ドキュメント操作コマンドでのTOON出力確認
  - getコマンドで--format toonを指定して単一ドキュメントをTOON形式で出力
  - listコマンドで--toonフラグを指定して複数ドキュメントをTOON形式で出力
  - setコマンドで操作結果をTOON形式で出力
  - updateコマンドで操作結果をTOON形式で出力
  - deleteコマンドで操作結果をTOON形式で出力
  - exportコマンドでエクスポートデータをTOON形式で出力
  - collectionsコマンドでコレクション一覧をTOON形式で出力
  - --quietオプションとTOON形式の組み合わせでコレクション名のみの配列を出力
  - 3.1の完了後に動作確認
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2_

- [x] 4. リアルタイム監視機能の対応
- [x] 4.1 Watch機能でのTOON出力対応
  - --watchフラグとTOON形式を同時に指定した場合の出力処理
  - 変更タイプ（added/modified/removed）をTOON形式の出力に含める
  - 2.2で追加したformatChangeメソッドを使用
  - _Requirements: 4.1, 4.2_

- [x] 5. MCP統合
- [x] 5.1 MCPツールへのformatパラメータ追加
  - firestore_getツールにformat: 'json' | 'toon'パラメータを追加
  - firestore_listツールにformatパラメータを追加
  - firestore_setツールにformatパラメータを追加
  - firestore_updateツールにformatパラメータを追加
  - firestore_deleteツールにformatパラメータを追加
  - firestore_exportツールにformatパラメータを追加
  - firestore_collectionsツールにformatパラメータを追加
  - デフォルトはjsonで既存動作を維持
  - OutputFormatterを使用してTOON形式変換を行う
  - 2.2の完了後に実装可能
  - _Requirements: 6.1, 6.2_

- [x] 6. テストとバリデーション
- [x] 6.1 (P) ToonEncoderのユニットテスト
  - 各種データ型（オブジェクト、配列、プリミティブ、null）のエンコードテスト
  - NaN/Infinityのnull変換確認テスト
  - エラーケースのテスト
  - 2.1の完了後に実装
  - _Requirements: 1.1, 7.1, 7.2_

- [x] 6.2 (P) OutputFormatterのユニットテスト
  - toon形式での単一ドキュメント出力テスト
  - toon形式での複数ドキュメント出力テスト（tabular形式確認）
  - toon形式での変更イベント出力テスト
  - toon形式でのコレクション一覧出力テスト
  - メタデータ付き出力のテスト
  - 2.2の完了後に実装
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 4.2, 5.1, 5.2_

- [x] 6.3 BaseCommand.resolveFormatのユニットテスト
  - --toonフラグの解決テスト
  - --format toonの解決テスト
  - 既存フラグとの排他性テスト
  - 3.1の完了後に実装
  - _Requirements: 1.1, 8.1_

- [x] 6.4 インテグレーションテスト
  - get command + --format toonでの単一ドキュメント取得テスト
  - list command + --toonでの複数ドキュメント取得テスト
  - MCP firestore_get + format: toonでのMCP経由テスト
  - watch mode + --format toonでのリアルタイム監視テスト
  - 全機能実装後に実施
  - _Requirements: 2.1, 2.2, 4.1, 6.1_

- [x] 6.5 E2Eテスト
  - firex get users/doc1 --format toonのCLI実行テスト
  - firex list users --toon --limit 10のCLI実行テスト
  - firex collections --format toonのCLI実行テスト
  - 全機能実装後に実施
  - _Requirements: 2.1, 2.2, 5.1_

- [x] 6.6 パフォーマンステスト（サイズ比較）
  - JSON vs TOON のサイズ比較テスト（単一ドキュメント）
  - JSON vs TOON のサイズ比較テスト（複数ドキュメント - 均一構造）
  - トークン削減率の確認（目標: 30-60%削減）
  - テスト結果をコンソール出力で確認
  - 2.2の完了後に実施
  - _Requirements: 1.1（トークン効率検証）_

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1, 1.2, 1.3 | 2.1, 2.2, 6.1, 6.2 |
| 2.1-2.6 | 3.2, 6.4, 6.5 |
| 3.1, 3.2 | 2.2, 6.2 |
| 4.1, 4.2 | 4.1, 6.4 |
| 5.1, 5.2 | 2.2, 3.2, 6.2, 6.5 |
| 6.1, 6.2 | 5.1, 6.4 |
| 7.1, 7.2 | 2.1, 2.2, 6.1 |
| 8.1, 8.2 | 1.1, 3.1, 6.3 |
