# Requirements: toon-output-format

## Project Description

outputのタイプにTOON（Token-Oriented Object Notation）を追加する。TOONはLLM向けに最適化されたコンパクトで人間可読なJSON互換フォーマットで、JSONと比較して約40-60%のトークン削減が可能。

## Introduction

本機能はfirex CLIツールの出力フォーマットオプションにTOON形式を追加する。TOONはLLM（大規模言語モデル）との連携において、トークン消費を大幅に削減しながら人間可読性を維持するJSON互換フォーマットである。既存のJSON、YAML、table形式と並列して利用可能にし、特にMCP経由でのAIアシスタント連携において効率的なデータ転送を実現する。

## Requirements

### Requirement 1: TOON出力形式のサポート

**Objective:** As a 開発者, I want firexの出力形式としてTOONを選択できること, so that LLMとの連携時にトークン消費を削減できる

#### Acceptance Criteria
1. When ユーザーが `--format toon` フラグを指定してコマンドを実行した場合, the OutputFormatter shall ドキュメントデータをTOON形式で出力する
2. When ユーザーがTOON形式を指定した場合, the OutputFormatter shall JSON互換の有効なデータを出力する
3. The OutputFormatter shall TOON形式出力においてJSONと比較して意味的に等価なデータを維持する

### Requirement 2: ドキュメント操作でのTOON出力

**Objective:** As a 開発者, I want 全てのドキュメント操作コマンドでTOON形式を使用できること, so that 一貫した出力形式を選択できる

#### Acceptance Criteria
1. When `get` コマンドでTOON形式を指定した場合, the GetCommand shall 単一ドキュメントをTOON形式で出力する
2. When `list` コマンドでTOON形式を指定した場合, the ListCommand shall 複数ドキュメントをTOON形式で出力する
3. When `set` コマンドでTOON形式を指定した場合, the SetCommand shall 操作結果をTOON形式で出力する
4. When `update` コマンドでTOON形式を指定した場合, the UpdateCommand shall 操作結果をTOON形式で出力する
5. When `delete` コマンドでTOON形式を指定した場合, the DeleteCommand shall 操作結果をTOON形式で出力する
6. When `export` コマンドでTOON形式を指定した場合, the ExportCommand shall エクスポートデータをTOON形式で出力する

### Requirement 3: メタデータのTOON形式対応

**Objective:** As a 開発者, I want メタデータ付き出力でもTOON形式を使用できること, so that ドキュメントの完全な情報をコンパクトに取得できる

#### Acceptance Criteria
1. When `--include-metadata` オプションとTOON形式を同時に指定した場合, the OutputFormatter shall メタデータを含むドキュメントをTOON形式で出力する
2. When メタデータ付きTOON出力を行う場合, the OutputFormatter shall ID、パス、作成日時、更新日時を含める

### Requirement 4: Watch機能でのTOON出力

**Objective:** As a 開発者, I want リアルタイム監視機能でTOON形式を使用できること, so that ストリーミングデータもコンパクトに受信できる

#### Acceptance Criteria
1. When `--watch` フラグとTOON形式を同時に指定した場合, the WatchService shall 変更イベントをTOON形式で出力する
2. When ドキュメント変更が発生した場合, the OutputFormatter shall 変更タイプ（added/modified/removed）をTOON形式の出力に含める

### Requirement 5: コレクション一覧のTOON出力

**Objective:** As a 開発者, I want コレクション一覧表示でTOON形式を使用できること, so that コレクション構造をコンパクトに取得できる

#### Acceptance Criteria
1. When `collections` コマンドでTOON形式を指定した場合, the CollectionsCommand shall コレクション一覧をTOON形式で出力する
2. When `--quiet` オプションとTOON形式を同時に指定した場合, the OutputFormatter shall コレクション名のみの配列をTOON形式で出力する

### Requirement 6: MCP経由でのTOON出力

**Objective:** As a AIアシスタント, I want MCP経由の操作でTOON形式を指定できること, so that トークン効率の良いレスポンスを受け取れる

#### Acceptance Criteria
1. When MCPツール呼び出しでTOON形式を指定した場合, the MCP Server shall TOON形式でレスポンスを返す
2. When TOON形式を指定しない場合, the MCP Server shall 既存のデフォルト形式（JSON）でレスポンスを返す

### Requirement 7: エラーハンドリング

**Objective:** As a 開発者, I want TOON出力時のエラーが適切に処理されること, so that 問題発生時に原因を特定できる

#### Acceptance Criteria
1. If TOON形式への変換中にエラーが発生した場合, the OutputFormatter shall FORMAT_ERRORタイプのエラーを返す
2. If 無効なデータ構造がTOON変換に渡された場合, the OutputFormatter shall 適切なエラーメッセージを含むResultを返す

### Requirement 8: 型定義の更新

**Objective:** As a 開発者, I want OutputFormat型にTOONが含まれること, so that 型安全なコードを書ける

#### Acceptance Criteria
1. The OutputFormat型 shall 'toon' を有効な値として含む
2. When 'toon' 以外の無効な形式文字列が指定された場合, the OutputFormatter shall 「サポートされていない出力形式です」エラーを返す

**Status**: Generated

**Next Step**: 要件内容を確認し、承認する場合は `/kiro:spec-design toon-output-format` を実行してデザインフェーズに進んでください。
