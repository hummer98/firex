# 仕様検討記録

## 基本情報
- **作成日**: 2026-01-01
- **機能名**: fieldvalue-support

## 初期要求
updateやset時にFieldValueを指定する機能はありますか？

## 質疑応答

### Q1. スコープについて
**質問**:
- 1-1. どの FieldValue をサポートしますか？（全て / 一部のみ）
- 1-2. CLI と MCP の両方でサポートしますか？

**回答**:
- 1-1: 全て
- 1-2: はい（両方）

### Q2. 構文について
**質問**:
- 2-1. JSON 内でどのように FieldValue を表現しますか？
- 2-2. `increment` の引数はどう指定しますか？

**回答**:
- 2-1: `$fieldValue` オブジェクト形式（AI Coding Agent が間違えにくい設計を採用）
- 2-2: 同様に `$fieldValue` オブジェクト形式

### Q3. 優先度について
**質問**:
- 3-1. 特に重要な FieldValue はどれですか？（最初に実装すべきもの）

**回答**:
- 3-1: serverTimestamp

## 調査・検討結果

### 現状分析
- 現在の firex には FieldValue をサポートする機能がない
- set/update コマンドは JSON 文字列またはファイルからデータを受け取り、そのまま Firestore に書き込む
- 既存の i18n 機構（ja/en）があり、Locale で日英切替可能

### 構文設計
推奨構文として `$fieldValue` オブジェクト形式を採用：

```json
// serverTimestamp
{"createdAt": {"$fieldValue": "serverTimestamp"}}

// increment
{"count": {"$fieldValue": "increment", "operand": 5}}

// arrayUnion
{"tags": {"$fieldValue": "arrayUnion", "elements": ["new", "tags"]}}

// arrayRemove
{"tags": {"$fieldValue": "arrayRemove", "elements": ["old"]}}

// delete
{"obsoleteField": {"$fieldValue": "delete"}}
```

### 設計理由
1. `$fieldValue` キーで明確に識別 - 通常のデータと衝突しない
2. 操作タイプが文字列で明示 - AI が補完しやすい
3. パラメータ名が自己説明的 - `operand`, `elements` で用途が明確
4. Firebase SDK の概念と一致 - `FieldValue.xxx()` のパターンを反映
5. JSON スキーマで検証可能 - 型チェックが容易

## 決定事項
- 対象 FieldValue: 全て（serverTimestamp, increment, arrayUnion, arrayRemove, delete）
- 対象コマンド: CLI（set, update）および MCP（set, update）
- 構文: `$fieldValue` オブジェクト形式
- エラーメッセージ: 既存 i18n を使用（Locale で日英切替）
- ドキュメント: examples コマンドに使用例を追加

## 備考
- 既存の i18n 機構を活用してエラーメッセージを多言語対応
- ネストしたオブジェクト内での FieldValue 指定もサポート予定
