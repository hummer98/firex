# Research & Design Decisions: fieldvalue-support

## Summary
- **Feature**: fieldvalue-support
- **Discovery Scope**: Extension (既存システムの拡張)
- **Key Findings**:
  - firebase-admin SDK の FieldValue は 5 つの主要操作をサポート: serverTimestamp, increment, arrayUnion, arrayRemove, delete
  - 既存の ValidationService パターンを拡張して FieldValue 変換を実装可能
  - CLI/MCP 両方で共通の変換層を設けることで一貫した動作を保証

## Research Log

### Firebase Admin SDK FieldValue API
- **Context**: FieldValue の正確な API シグネチャと使用制約を確認
- **Sources Consulted**:
  - [Google Cloud Node.js Firestore FieldValue Reference](https://cloud.google.com/nodejs/docs/reference/firestore/latest/firestore/fieldvalue)
  - [Firebase Admin SDK GitHub](https://github.com/firebase/firebase-admin-node)
- **Findings**:
  - `FieldValue.serverTimestamp()`: 引数なし、サーバータイムスタンプを生成
  - `FieldValue.increment(n: number)`: 数値引数必須、整数・浮動小数点両対応
  - `FieldValue.arrayUnion(...elements: unknown[])`: 可変長引数、要素を配列に追加
  - `FieldValue.arrayRemove(...elements: unknown[])`: 可変長引数、要素を配列から削除
  - `FieldValue.delete()`: 引数なし、フィールド削除用センチネル
- **Implications**:
  - increment には数値バリデーションが必要
  - arrayUnion/arrayRemove には配列バリデーションが必要
  - delete は update() または set({merge:true}) でのみ有効

### 既存コードベース分析
- **Context**: 拡張ポイントと既存パターンの特定
- **Findings**:
  - `ValidationService`: 既存のバリデーションパターンを拡張可能
  - `FirestoreOps.setDocument()`: データ変換を挿入する適切なポイント
  - `i18n.ts`: エラーメッセージの多言語対応パターンが確立済み
  - MCP tools: set/update とも `data` パラメータを `Record<string, unknown>` として受け取る
- **Implications**:
  - 新規 FieldValueTransformer を domain 層に追加
  - 既存の ValidationService との統合が必要
  - i18n にエラーメッセージを追加

### 構文設計の根拠
- **Context**: `$fieldValue` 構文の採用理由
- **Findings**:
  - `$` プレフィックスにより通常のフィールド名と明確に区別
  - JSON スキーマでの検証が容易
  - AI (Claude) が補完・生成しやすい明示的なパターン
  - Firebase SDK の概念モデルと一致
- **Implications**:
  - 将来的に他の特殊操作（GeoPoint等）の追加も同じパターンで可能

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Transformer Pattern | データ変換専用サービス | 単一責任、テスト容易、再利用可能 | 変換層の追加によるオーバーヘッド | 採用 |
| Inline Transformation | 各コマンド内で変換 | 実装が単純 | コード重複、保守性低下 | 却下 |
| Decorator Pattern | FirestoreOps をラップ | 透過的な変換 | 複雑性増加、デバッグ困難 | 却下 |

## Design Decisions

### Decision: Transformer Pattern の採用
- **Context**: FieldValue 構文をどの層で変換するか
- **Alternatives Considered**:
  1. 各コマンド/ツール内でインライン変換
  2. FirestoreOps のデコレーター
  3. 専用の Transformer サービス
- **Selected Approach**: Domain 層に FieldValueTransformer サービスを新設
- **Rationale**:
  - 単一責任の原則に従う
  - CLI と MCP で共有可能
  - 単体テストが容易
  - 既存コードへの影響を最小化
- **Trade-offs**:
  - 新規ファイルの追加
  - 呼び出し側での変換呼び出しが必要
- **Follow-up**: 変換処理のパフォーマンス検証

### Decision: 再帰的変換の実装
- **Context**: ネストされたオブジェクト内の `$fieldValue` 処理
- **Selected Approach**: 深さ優先探索による再帰的変換
- **Rationale**:
  - 任意の深さのネストをサポート
  - 配列内オブジェクトも処理可能
- **Trade-offs**:
  - 深いネストでのスタックオーバーフローリスク（実用上問題なし）
- **Follow-up**: 最大深度の制限検討

### Decision: エラーメッセージにフィールドパスを含める
- **Context**: ユーザーがエラー箇所を特定しやすくする
- **Selected Approach**: JSONPath 形式でフィールドパスをエラーメッセージに含める
- **Rationale**:
  - 複雑なネスト構造でもエラー位置が明確
  - デバッグ効率の向上
- **Trade-offs**: エラーメッセージが若干長くなる

## Risks & Mitigations
- **Risk 1**: arrayUnion に serverTimestamp を含めると値が欠落する（Firebase SDK の既知の制限）
  - **Mitigation**: ドキュメントで制限事項として明記、将来的にバリデーションで警告
- **Risk 2**: 不正な FieldValue 構文によるランタイムエラー
  - **Mitigation**: 変換前の厳格なバリデーション
- **Risk 3**: 既存の `$fieldValue` という名前のフィールドとの衝突
  - **Mitigation**: エスケープ機構の将来的な検討（v1 では警告のみ）

## References
- [Firebase Admin SDK Node.js FieldValue](https://cloud.google.com/nodejs/docs/reference/firestore/latest/firestore/fieldvalue) - API リファレンス
- [Firestore FieldValue arrayUnion limitation (GitHub Issue #336)](https://github.com/firebase/firebase-admin-node/issues/336) - serverTimestamp との組み合わせ制限
- [Firebase JavaScript SDK FieldValue](https://firebase.google.com/docs/reference/js/v8/firebase.firestore.FieldValue) - JavaScript SDK リファレンス
