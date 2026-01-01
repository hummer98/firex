# Requirements: fieldvalue-support

## Project Description

firex の set/update コマンドおよび MCP ツールで Firestore FieldValue（serverTimestamp, increment, arrayUnion, arrayRemove, delete）を JSON 内で $fieldValue オブジェクト形式で指定できる機能を追加する

## Introduction

本機能は、firex CLI および MCP ツールにおいて、Firestore の特殊な FieldValue オペレーション（serverTimestamp、increment、arrayUnion、arrayRemove、delete）を JSON データ内で宣言的に指定できるようにする。ユーザーは `$fieldValue` という特殊キーを持つオブジェクトを使用して、これらの操作をドキュメント書き込み時に適用できる。

## Requirements

### Requirement 1: FieldValue 構文解析

**Objective:** 開発者として、JSON データ内で `$fieldValue` オブジェクト形式を使用して Firestore FieldValue を指定したい。これにより、CLI や MCP から特殊なフィールド操作を実行できる。

#### Acceptance Criteria

1. When JSON データに `{"$fieldValue": "serverTimestamp"}` が含まれる場合, firex shall そのフィールドを `FieldValue.serverTimestamp()` に変換する
2. When JSON データに `{"$fieldValue": "increment", "operand": <number>}` が含まれる場合, firex shall そのフィールドを `FieldValue.increment(operand)` に変換する
3. When JSON データに `{"$fieldValue": "arrayUnion", "elements": [<values>]}` が含まれる場合, firex shall そのフィールドを `FieldValue.arrayUnion(...elements)` に変換する
4. When JSON データに `{"$fieldValue": "arrayRemove", "elements": [<values>]}` が含まれる場合, firex shall そのフィールドを `FieldValue.arrayRemove(...elements)` に変換する
5. When JSON データに `{"$fieldValue": "delete"}` が含まれる場合, firex shall そのフィールドを `FieldValue.delete()` に変換する
6. The firex shall ネストされたオブジェクト内の `$fieldValue` 指定も再帰的に処理する

### Requirement 2: CLI set コマンド対応

**Objective:** 開発者として、`firex set` コマンドで FieldValue 構文を使用したい。これにより、CLI からサーバータイムスタンプやインクリメント操作を実行できる。

#### Acceptance Criteria

1. When `firex set` コマンドで `$fieldValue` を含む JSON を指定した場合, firex shall FieldValue を適用してドキュメントを作成・更新する
2. When `firex set --from-file` で `$fieldValue` を含むファイルを指定した場合, firex shall ファイル内の FieldValue 構文を処理する
3. When `firex set --merge` で `$fieldValue` を使用した場合, firex shall 既存ドキュメントとマージしつつ FieldValue を適用する

### Requirement 3: CLI update コマンド対応

**Objective:** 開発者として、`firex update` コマンドで FieldValue 構文を使用したい。これにより、既存ドキュメントの部分更新で FieldValue を活用できる。

#### Acceptance Criteria

1. When `firex update` コマンドで `$fieldValue` を含む JSON を指定した場合, firex shall FieldValue を適用して既存ドキュメントを更新する
2. When `firex update --from-file` で `$fieldValue` を含むファイルを指定した場合, firex shall ファイル内の FieldValue 構文を処理する
3. When `firex update` で `{"$fieldValue": "delete"}` を指定した場合, firex shall 該当フィールドを削除する

### Requirement 4: MCP firestore_set ツール対応

**Objective:** AI アシスタントとして、MCP firestore_set ツールで FieldValue を使用したい。これにより、Claude などの AI から高度なドキュメント操作を実行できる。

#### Acceptance Criteria

1. When MCP firestore_set ツールの data パラメータに `$fieldValue` オブジェクトが含まれる場合, firex shall FieldValue を適用してドキュメントを作成・更新する
2. When MCP firestore_set で merge=true と `$fieldValue` を組み合わせた場合, firex shall 既存データとマージしつつ FieldValue を適用する

### Requirement 5: MCP firestore_update ツール対応

**Objective:** AI アシスタントとして、MCP firestore_update ツールで FieldValue を使用したい。これにより、フィールドのインクリメントや配列操作を AI から実行できる。

#### Acceptance Criteria

1. When MCP firestore_update ツールの data パラメータに `$fieldValue` オブジェクトが含まれる場合, firex shall FieldValue を適用してドキュメントを更新する
2. When MCP firestore_update で `{"$fieldValue": "increment", "operand": 1}` を指定した場合, firex shall 該当フィールドの値をインクリメントする
3. When MCP firestore_update で `{"$fieldValue": "arrayUnion", "elements": [...]}` を指定した場合, firex shall 配列に要素を追加する

### Requirement 6: バリデーションとエラーハンドリング

**Objective:** 開発者として、不正な FieldValue 構文に対して明確なエラーメッセージを受け取りたい。これにより、問題の特定と修正が容易になる。

#### Acceptance Criteria

1. If `$fieldValue` に未知の操作タイプが指定された場合, firex shall 無効な FieldValue タイプであることを示すエラーメッセージを表示する
2. If `increment` 操作で `operand` が数値でない場合, firex shall operand は数値である必要があることを示すエラーを表示する
3. If `arrayUnion` または `arrayRemove` で `elements` が配列でない場合, firex shall elements は配列である必要があることを示すエラーを表示する
4. If `$fieldValue` オブジェクトの形式が不正な場合, firex shall 期待される形式を示すエラーメッセージを表示する
5. The firex shall エラーメッセージに問題のあるフィールドパスを含める

### Requirement 7: ドキュメントと使用例

**Objective:** 開発者として、FieldValue 構文の使用方法を理解したい。これにより、機能を効果的に活用できる。

#### Acceptance Criteria

1. The firex shall `firex set --help` および `firex update --help` で FieldValue 構文の使用例を表示する
2. The firex shall MCP ツールのスキーマ定義に FieldValue 構文の説明を含める
3. When `firex examples` コマンドを実行した場合, firex shall FieldValue の使用例を含める

**Status**: Generated

**Next Step**: 要件をレビューし、問題なければ承認してください。その後 `/kiro:spec-design fieldvalue-support` でデザインドキュメントを生成できます。
