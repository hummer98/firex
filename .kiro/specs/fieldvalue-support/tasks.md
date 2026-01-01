# Implementation Plan

## Task 1: FieldValue 変換の基盤実装

- [x] 1.1 FieldValue 型定義とスキーマの実装
  - 5種類の FieldValue 操作タイプ（serverTimestamp, increment, arrayUnion, arrayRemove, delete）を定義
  - Zod スキーマで $fieldValue 構文の検証ロジックを実装
  - 各操作タイプに必要なパラメータ（operand, elements）の型定義
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 FieldValueTransformer サービスの実装
  - $fieldValue オブジェクトを検出する判定ロジックの実装
  - 各 FieldValue タイプから対応する FieldValue センチネルへの変換
  - ネストされたオブジェクト・配列の再帰的な変換処理
  - 通常のデータはそのまま保持し、$fieldValue のみを変換
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.3 FieldValueTransformer のユニットテスト
  - 各 FieldValue タイプの正常変換テスト
  - ネストされたオブジェクト内の $fieldValue 変換テスト
  - 配列内のオブジェクトに含まれる $fieldValue の変換テスト
  - 通常データが変換されないことの確認テスト
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

## Task 2: エラーハンドリングと i18n 対応

- [x] 2.1 (P) FieldValue 変換エラーの実装
  - 不正な FieldValue タイプに対するエラー生成
  - increment の operand が数値でない場合のエラー生成
  - arrayUnion/arrayRemove の elements が配列でない場合のエラー生成
  - $fieldValue オブジェクト形式不正時のエラー生成
  - エラーメッセージにフィールドパスを含める実装
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.2 (P) i18n エラーメッセージの追加
  - 日本語エラーメッセージの追加（err.fieldValue.invalidType 等）
  - 英語エラーメッセージの追加
  - フィールドパス表示用のメッセージテンプレート
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.3 エラーハンドリングのユニットテスト
  - 各エラーパターンの発生と正しいエラー型の確認
  - フィールドパスが正しく含まれることの確認
  - i18n 切り替えによるメッセージ言語の確認
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Task 3: CLI set コマンドの拡張

- [x] 3.1 set コマンドへの FieldValue 変換統合
  - バリデーション後、Firestore 書き込み前に FieldValueTransformer を呼び出し
  - 変換エラー時の適切なエラーハンドリング
  - --from-file オプションでのファイル読み込み時にも FieldValue を処理
  - --merge オプションとの組み合わせ対応
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.2 set コマンドのヘルプ更新
  - --help 出力に FieldValue 構文の使用例を追加
  - 各 FieldValue タイプの簡潔な説明を含める
  - _Requirements: 7.1_

- [x] 3.3 set コマンドの統合テスト
  - serverTimestamp を含むドキュメント作成テスト
  - increment を含むドキュメント作成テスト
  - --from-file での FieldValue 処理テスト
  - --merge と FieldValue の組み合わせテスト
  - _Requirements: 2.1, 2.2, 2.3_

## Task 4: CLI update コマンドの拡張

- [x] 4.1 (P) update コマンドへの FieldValue 変換統合
  - set コマンドと同様のパターンで FieldValueTransformer を統合
  - delete 操作によるフィールド削除の対応
  - --from-file オプションでのファイル読み込み時にも FieldValue を処理
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.2 (P) update コマンドのヘルプ更新
  - --help 出力に FieldValue 構文の使用例を追加
  - delete 操作の説明を含める
  - _Requirements: 7.1_

- [x] 4.3 update コマンドの統合テスト
  - increment による既存フィールドの増減テスト
  - arrayUnion による配列要素追加テスト
  - arrayRemove による配列要素削除テスト
  - delete によるフィールド削除テスト
  - --from-file での FieldValue 処理テスト
  - _Requirements: 3.1, 3.2, 3.3_

## Task 5: MCP firestore_set ツールの拡張

- [x] 5.1 (P) firestore_set ツールへの FieldValue 変換統合
  - data パラメータに対して FieldValueTransformer を適用
  - merge オプションとの組み合わせ対応
  - 変換エラー時の MCP エラーレスポンス生成
  - _Requirements: 4.1, 4.2_

- [x] 5.2 (P) firestore_set ツールのスキーマ説明更新
  - ツール説明に $fieldValue 構文の使用方法を追加
  - 各 FieldValue タイプの例を含める
  - _Requirements: 7.2_

- [x] 5.3 firestore_set ツールの統合テスト
  - serverTimestamp を使用したドキュメント作成テスト
  - merge=true と FieldValue の組み合わせテスト
  - _Requirements: 4.1, 4.2_

## Task 6: MCP firestore_update ツールの拡張

- [x] 6.1 (P) firestore_update ツールへの FieldValue 変換統合
  - data パラメータに対して FieldValueTransformer を適用
  - 変換エラー時の MCP エラーレスポンス生成
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.2 (P) firestore_update ツールのスキーマ説明更新
  - ツール説明に $fieldValue 構文の使用方法を追加
  - increment と arrayUnion の例を含める
  - _Requirements: 7.2_

- [x] 6.3 firestore_update ツールの統合テスト
  - increment によるカウンター増減テスト
  - arrayUnion による配列要素追加テスト
  - delete によるフィールド削除テスト
  - _Requirements: 5.1, 5.2, 5.3_

## Task 7: examples コマンドの更新

- [x] 7.1 (P) examples コマンドへの FieldValue 使用例追加
  - serverTimestamp の設定例を追加
  - increment によるカウンター操作例を追加
  - arrayUnion/arrayRemove による配列操作例を追加
  - delete によるフィールド削除例を追加
  - _Requirements: 7.3_

## Task 8: E2E テストと最終検証

- [x] 8.1 CLI E2E テスト
  - Firestore エミュレータを使用した set + serverTimestamp テスト
  - update + increment によるカウンター増減の検証
  - update + arrayUnion/arrayRemove による配列操作の検証
  - update + delete によるフィールド削除の検証
  - 複数の FieldValue を同時に使用する複合操作テスト
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 8.2 MCP E2E テスト
  - firestore_set での FieldValue 操作テスト
  - firestore_update での FieldValue 操作テスト
  - 複合操作とエラーケースのテスト
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_
