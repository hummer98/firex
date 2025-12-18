# Implementation Plan

## Tasks

- [x] 1. i18nメッセージの追加
- [x] 1.1 (P) コレクションコマンド用のローカライズメッセージを追加
  - コマンド説明メッセージ（日本語・英語）を定義
  - 引数説明メッセージ（documentPathOptional）を追加
  - 成功時メッセージ（collectionsFound, noCollectionsFound, noSubcollectionsFound）を追加
  - エラーメッセージ（documentNotFoundForSubcollections）を追加
  - 既存のi18nシステムパターンに準拠
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. FirestoreOpsドメイン層の拡張
- [x] 2.1 ルートコレクション一覧取得メソッドを実装
  - listRootCollections()メソッドをFirestoreOpsに追加
  - Firebase Admin SDKのdb.listCollections() APIをラップ
  - CollectionReferenceからidプロパティでコレクション名を抽出
  - Result型による型安全なエラーハンドリングを実装
  - _Requirements: 1.1_

- [x] 2.2 サブコレクション一覧取得メソッドを実装
  - listSubcollections(documentPath)メソッドを追加
  - ドキュメントパスの形式検証（偶数セグメント）を実装
  - ドキュメント存在確認を実装
  - docRef.listCollections() APIによるサブコレクション取得
  - 無効パス、ドキュメント未検出のエラー型を定義
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. OutputFormatterプレゼンテーション層の拡張
- [x] 3.1 (P) コレクション名一覧の出力フォーマット機能を実装
  - formatCollections()メソッドを追加
  - JSON出力（`{ collections: [...], count: N }`形式）をデフォルトとして実装
  - プレーンテキスト出力（改行区切り）を実装
  - YAML出力（配列形式）を実装
  - テーブル出力（単一カラム）を実装
  - `--quiet`時は配列のみ（countなし）を出力
  - 空配列の場合の出力ハンドリング
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. CollectionsCommandの実装
- [x] 4.1 コマンド基盤を構築
  - BaseCommandを継承したCollectionsCommandクラスを作成
  - oclifコマンド設定（description, examples）をi18nを使用して定義
  - オプショナルなdocumentPath引数を定義
  - 出力フォーマットフラグ（--json, --yaml, --table）をBaseCommandから継承
  - --quietフラグを追加定義
  - _Requirements: 4.4, 3.5_

- [x] 4.2 ルートコレクション取得ロジックを実装
  - 引数なし実行時のルートコレクション取得処理
  - FirestoreOps.listRootCollections()の呼び出し
  - コレクション件数の表示（quietモード以外）
  - コレクション未検出時のメッセージ表示
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4.3 サブコレクション取得ロジックを実装
  - ドキュメントパス引数あり実行時のサブコレクション取得処理
  - FirestoreOps.listSubcollections()の呼び出し
  - 無効パスエラーのハンドリングとメッセージ表示
  - ドキュメント未検出エラーのハンドリングとメッセージ表示
  - サブコレクション未検出時のメッセージ表示
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4.4 出力フォーマット処理を実装
  - フラグに応じたOutputFormatterの呼び出し
  - quietモード時の補足メッセージ抑制
  - 各出力形式（プレーン/JSON/YAML/テーブル）の出力
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. エラーハンドリングの統合
- [x] 5.1 認証・権限・ネットワークエラーのハンドリングを実装
  - BaseCommandの認証フローを活用
  - Firebase認証エラーの適切なメッセージ表示
  - Firestoreアクセス権限エラーのハンドリング
  - ネットワーク接続エラーのハンドリング
  - 既存のErrorHandlerパターンに準拠
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. テストの実装
- [x] 6.1 (P) FirestoreOpsのユニットテストを実装
  - listRootCollections()の正常系テスト（コレクションあり/なし）
  - listRootCollections()の異常系テスト（Firestoreエラー）
  - listSubcollections()の正常系テスト（サブコレクションあり/なし）
  - listSubcollections()の異常系テスト（無効パス、ドキュメント未検出）
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 6.2 (P) OutputFormatterのユニットテストを実装
  - formatCollections()のプレーンテキスト出力テスト
  - formatCollections()のJSON出力テスト
  - formatCollections()のYAML出力テスト
  - formatCollections()のテーブル出力テスト
  - 空配列の出力テスト
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6.3 (P) i18nメッセージのテストを実装
  - 日本語メッセージの存在確認
  - 英語メッセージの存在確認
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.4 CollectionsCommandのユニットテストを実装
  - コマンド設定の検証
  - ルートコレクション取得のモックテスト
  - サブコレクション取得のモックテスト
  - 各出力フォーマットの動作検証
  - quietフラグの動作検証
  - エラーハンドリングの検証
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [x] 7. コマンド登録と統合
- [x] 7.1 collectionsコマンドをCLIに登録
  - oclifコマンドディレクトリにcollections.tsを配置
  - コマンドが正しく認識されることを確認
  - ヘルプテキストの表示確認
  - _Requirements: 5.3_

- [x] 7.2 統合テストの実装
  - 認証からルートコレクション取得までのフロー検証
  - サブコレクション取得フローの検証
  - 各フォーマットオプションでの出力検証
  - エラーシナリオの検証
  - _Requirements: 1.1, 2.1, 4.1, 4.2, 4.3_
