# Research & Design Decisions: i18n-full-coverage

---
**Purpose**: 既存のi18nシステム拡張における調査結果と設計判断の記録

**Usage**:
- Discovery phaseでの調査結果をログ
- design.mdに含めるには詳細すぎる設計判断のトレードオフを記録
- 将来の監査や再利用のための参照とエビデンスを提供
---

## Summary
- **Feature**: `i18n-full-coverage`
- **Discovery Scope**: Extension（既存i18nシステムの拡張）
- **Key Findings**:
  - 既存のi18nモジュールは約100個のメッセージキーを持ち、型安全なt()関数を提供
  - 約70-80個の未対応メッセージがerror-handler.ts、doctor-service.ts、チェッカーモジュールに分散
  - 既存パターン（Messages interface + t()関数）を踏襲することで最小限の変更で拡張可能

## Research Log

### 既存i18nモジュールの分析

- **Context**: 既存のi18nシステムの構造と拡張ポイントを特定するための調査
- **Sources Consulted**:
  - `/Users/yamamoto/git/firex/src/shared/i18n.ts`
  - TypeScript Handbook (Template Literal Types)
- **Findings**:
  - `Messages` interfaceで全キーを型定義（約100キー）
  - `jaMessages`と`enMessages`の2つのオブジェクトで翻訳を保持
  - `t(key: keyof Messages): string`で型安全なアクセスを提供
  - ロケール検出は環境変数（LANG, LC_ALL, LC_MESSAGES）から自動検出
  - デフォルトは英語（en）
- **Implications**:
  - 新しいメッセージキーをMessages interfaceに追加するだけで型安全性が保証される
  - 既存のt()関数をそのまま利用可能
  - 階層的なキー命名規則（`err.auth.*`, `doctor.progress.*`）を踏襲

### ハードコードメッセージの分布調査

- **Context**: 多言語化が必要なメッセージの位置と数を特定
- **Sources Consulted**:
  - `/Users/yamamoto/git/firex/src/services/error-handler.ts`
  - `/Users/yamamoto/git/firex/src/services/doctor-service.ts`
  - `/Users/yamamoto/git/firex/src/commands/doctor.ts`
  - `/Users/yamamoto/git/firex/src/domain/doctor/*.ts`
- **Findings**:
  | ファイル | メッセージ数 | カテゴリ |
  |---------|------------|---------|
  | error-handler.ts | 約25個 | 認証、設定、Firestore、バリデーション |
  | doctor-service.ts | 約10個 | 進捗、エラー結果 |
  | doctor.ts | 約5個 | フラグ説明、エラーメッセージ |
  | environment-checker.ts | 約15個 | Node.js、Firebase CLI、認証チェック |
  | firebase-checker.ts | 約20個 | プロジェクト、エミュレータ、API |
  | config-checker.ts | 約12個 | 設定ファイル、構文、スキーマ |
  | build-checker.ts | 約8個 | ビルド状態 |
- **Implications**:
  - 合計約95個の新規メッセージキーが必要
  - 既存の約100キーと合わせて約200キーに増加
  - Messages interfaceの肥大化に注意が必要

### メッセージキー命名規則の設計

- **Context**: 新規メッセージキーの命名規則を既存パターンと整合させる
- **Sources Consulted**: 既存のi18n.tsのキー命名パターン
- **Findings**:
  - 既存パターン: `{prefix}.{category}.{action/item}`
  - 例: `cmd.get.description`, `err.authFailed`, `msg.documentCreated`
- **Implications**: 以下の命名規則を採用
  ```
  err.handler.auth.*      - 認証エラー
  err.handler.config.*    - 設定エラー
  err.handler.firestore.* - Firestoreエラー
  err.handler.validation.*- バリデーションエラー
  err.handler.help.*      - ヘルプ提案
  doctor.progress.*       - 診断進捗
  doctor.result.*         - 診断結果
  doctor.error.*          - 診断エラー
  doctor.check.*          - 各チェッカーのメッセージ
  ```

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単一Messages interface拡張 | 既存のMessages interfaceに全キーを追加 | シンプル、型安全、既存パターン踏襲 | interfaceが大きくなる | 採用 |
| カテゴリ別interface分割 | ErrorMessages, DoctorMessages等に分割 | 関心の分離 | t()関数の変更が必要、破壊的変更 | 却下 |
| 外部翻訳ファイル | JSON/YAMLファイルで翻訳を管理 | 翻訳者フレンドリー | ビルド設定変更、型安全性低下 | 却下 |

## Design Decisions

### Decision: 単一Messages interfaceの継続使用

- **Context**: 約100個の新規キーを追加する方法の選択
- **Alternatives Considered**:
  1. 単一interface拡張 - 既存パターンを維持
  2. カテゴリ別interface分割 - 関心の分離
  3. 外部ファイル化 - 翻訳管理の容易さ
- **Selected Approach**: 単一interface拡張
- **Rationale**:
  - 既存のコードベースとの一貫性維持
  - 破壊的変更なしで実装可能
  - TypeScriptコンパイラによる完全な型チェック
- **Trade-offs**:
  - (+) 後方互換性100%維持
  - (+) 実装工数最小
  - (-) i18n.tsファイルサイズ増大（約800行→約1200行）
- **Follow-up**: ファイルサイズが問題になった場合、将来的にメッセージ定義を別ファイルに分離検討

### Decision: プレースホルダー対応の見送り

- **Context**: 動的な値を含むメッセージの処理方法
- **Alternatives Considered**:
  1. テンプレートリテラル関数の導入
  2. 単純な文字列連結（現状維持）
- **Selected Approach**: 単純な文字列連結（現状維持）
- **Rationale**:
  - 既存コードが文字列連結パターンを使用
  - 導入コストと複雑性のバランス
  - 70-80個のメッセージの大半は静的テキスト
- **Trade-offs**:
  - (+) 実装シンプル
  - (-) 一部のメッセージで語順の問題が発生する可能性（日本語/英語で語順が異なる場合）
- **Follow-up**: 語順問題が顕在化した場合、該当メッセージのみテンプレート化を検討

### Decision: テスト戦略

- **Context**: 全メッセージキーの検証方法
- **Selected Approach**:
  - 両言語で同数のキーが存在することを検証
  - 各キーが空でないことを検証
  - ロケール切替後の正しいメッセージ取得を検証
- **Rationale**:
  - TypeScriptの型システムが未定義キーを防止
  - ランタイムテストで空文字列を検出
- **Trade-offs**:
  - (+) 型安全性とランタイム検証の組み合わせ
  - (-) 翻訳内容の正確性は人間のレビューに依存

## Risks & Mitigations

- **ファイルサイズ増大** - i18n.tsが約400行増加 → 将来的なファイル分割を検討、現時点では許容
- **翻訳品質** - 自動生成された翻訳の品質 → PRレビューでの確認、ネイティブチェック推奨
- **既存テストへの影響** - メッセージ文字列をハードコードしているテスト → テスト更新を実装タスクに含める
- **パフォーマンス** - メッセージオブジェクトのサイズ増加 → 遅延読み込みは不要（起動時の一度のみ）

## References

- [TypeScript Handbook - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) - keyof演算子とインターフェース拡張
- [i18next](https://www.i18next.com/) - 参考：より高度なi18nライブラリ（本プロジェクトでは過剰）
- firex既存コード - `src/shared/i18n.ts` - 既存パターンの参照元
