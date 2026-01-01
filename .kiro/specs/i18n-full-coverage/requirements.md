# Requirements: i18n-full-coverage

## Project Description

firex CLIの全てのユーザー向けメッセージ（エラー、情報、警告、診断結果）を多言語化（日本語/英語）する。既存のi18nシステム（src/shared/i18n.ts）を拡張し、約95個の未対応メッセージをt()関数経由で取得するように修正する。対象はerror-handler.ts、doctor-service.ts、doctor.ts、および各コマンドファイル内のハードコードされた文字列。

## Introduction

本仕様は、firex CLIにおける多言語対応（i18n）の完全カバレッジを実現するための要件を定義する。現在、コマンド説明やフラグ説明は`t()`関数で多言語化されているが、エラーメッセージ、診断結果、ランタイムメッセージの一部にハードコードされた日本語文字列が残存している。本機能では、これらすべてのユーザー向けメッセージを`t()`関数経由で取得するように統一し、ユーザーのロケール設定（環境変数）に応じて日本語/英語を自動切替できるようにする。

## Requirements

### Requirement 1: エラーハンドラーの多言語化

**Objective:** 開発者として、エラーメッセージを自分の言語で確認したい。これにより、問題の診断と解決が迅速になる。

#### Acceptance Criteria

1. When 認証エラーが発生した場合, the firex CLI shall ユーザーのロケール設定に応じた言語でエラーメッセージを表示する
2. When 設定ファイルエラーが発生した場合, the firex CLI shall ロケールに応じた「設定ファイルが見つかりません」「解析エラー」「設定値が不正」のメッセージを表示する
3. When Firestore APIエラーが発生した場合, the firex CLI shall NOT_FOUND, PERMISSION_DENIED, RESOURCE_EXHAUSTED等のエラーコードに対応するローカライズメッセージを表示する
4. When バリデーションエラーが発生した場合, the firex CLI shall フィールド名と共にローカライズされたエラーメッセージを表示する
5. When --verbose フラグが有効な場合, the firex CLI shall スタックトレースのラベル（「スタックトレース」）もローカライズして表示する
6. The firex CLI shall ヘルプ提案メッセージ（「ヘルプを表示:」等）をローカライズして表示する

### Requirement 2: 診断サービス（doctor）の多言語化

**Objective:** 開発者として、環境診断結果を自分の言語で確認したい。これにより、セットアップ問題を迅速に特定できる。

#### Acceptance Criteria

1. When doctor コマンドを実行した場合, the firex CLI shall 診断進捗メッセージ（「Starting diagnostics...」「Checking Node.js version...」等）をロケールに応じた言語で表示する
2. When 診断チェックが成功した場合, the firex CLI shall 成功メッセージをローカライズして表示する
3. When 診断チェックが失敗した場合, the firex CLI shall 「チェックに失敗しました」のメッセージをローカライズして表示する
4. When 設定ファイルが見つかった場合, the firex CLI shall 「設定ファイルが見つかりました」「ファイルパス:」等のメッセージをローカライズして表示する
5. When --json フラグの説明を表示する場合, the firex CLI shall 「診断結果を JSON 形式で出力する」をローカライズして表示する
6. When 診断実行に失敗した場合, the firex CLI shall 「診断の実行に失敗しました」「診断結果のフォーマットに失敗しました」のエラーメッセージをローカライズして表示する

### Requirement 3: i18nモジュールの拡張

**Objective:** 開発者として、新しいメッセージキーを追加しやすい構造にしたい。これにより、将来の多言語化作業が効率化される。

#### Acceptance Criteria

1. The i18n module shall エラーハンドラー用のメッセージキー（err.auth.*, err.config.*, err.firestore.*, err.validation.*）を提供する
2. The i18n module shall 診断サービス用のメッセージキー（doctor.progress.*, doctor.result.*, doctor.error.*）を提供する
3. The i18n module shall 全てのメッセージキーに対して日本語と英語の翻訳を提供する
4. The i18n module shall Messages インターフェースを拡張し、新しいキーの型安全性を保証する
5. When 未定義のメッセージキーが使用された場合, the TypeScript compiler shall コンパイルエラーを報告する

### Requirement 4: ヘルプ提案メッセージの多言語化

**Objective:** 開発者として、エラー発生時のヘルプ提案を自分の言語で確認したい。これにより、次のアクションが明確になる。

#### Acceptance Criteria

1. When エラーが発生してヘルプ提案が表示される場合, the firex CLI shall 「ヘルプを表示: firex --help」のメッセージをローカライズして表示する
2. When 設定関連のエラーが発生した場合, the firex CLI shall 「設定のヘルプを表示: firex config --help」をローカライズして表示する
3. When コマンド固有のエラーが発生した場合, the firex CLI shall 該当コマンドのヘルプ案内をローカライズして表示する

### Requirement 5: 後方互換性の維持

**Objective:** 既存ユーザーとして、この変更によって既存の動作が壊れないことを確認したい。これにより、安心してアップデートできる。

#### Acceptance Criteria

1. The firex CLI shall 既存の t() 関数の呼び出しパターンとの互換性を維持する
2. The firex CLI shall 既存のメッセージキーと翻訳を変更なく保持する
3. While ロケール環境変数が設定されていない場合, the firex CLI shall デフォルトで英語（en）を使用する
4. While ロケールが日本語（ja）に設定されている場合, the firex CLI shall 既存の日本語メッセージと同等の内容を表示する

### Requirement 6: 診断チェッカーモジュールの多言語化

**Objective:** 開発者として、各種チェッカーの診断メッセージを自分の言語で確認したい。これにより、問題の原因を正確に把握できる。

#### Acceptance Criteria

1. When 環境チェック（EnvironmentChecker）を実行した場合, the firex CLI shall Node.jsバージョン、Firebase CLI、認証状態の診断メッセージをローカライズして表示する
2. When Firebaseチェック（FirebaseChecker）を実行した場合, the firex CLI shall プロジェクトID、エミュレータ接続、Firestore APIの診断メッセージをローカライズして表示する
3. When 設定チェック（ConfigChecker）を実行した場合, the firex CLI shall 設定ファイル検出、構文検証、スキーマ検証の診断メッセージをローカライズして表示する
4. When ビルドチェック（BuildChecker）を実行した場合, the firex CLI shall ビルド状態の診断メッセージをローカライズして表示する

### Requirement 7: メッセージ品質の保証

**Objective:** 品質保証担当として、全てのメッセージが適切にローカライズされていることを検証したい。これにより、ユーザー体験の一貫性が保たれる。

#### Acceptance Criteria

1. The i18n module shall 日本語と英語で同数のメッセージキーを持つ
2. The i18n module shall 各メッセージキーに対して空でない翻訳文字列を提供する
3. When テストスイートを実行した場合, the test suite shall 全てのメッセージキーが両言語で定義されていることを検証する
4. When テストスイートを実行した場合, the test suite shall ロケール切替後に正しい言語のメッセージが返されることを検証する

**Status**: Generated

**Next Step**: Review and approve requirements, then run `/kiro:spec-design i18n-full-coverage` to generate design document.
