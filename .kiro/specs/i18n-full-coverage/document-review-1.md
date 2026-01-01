# Specification Review Report #1

**Feature**: i18n-full-coverage
**Review Date**: 2026-01-01
**Documents Reviewed**:
- `.kiro/specs/i18n-full-coverage/spec.json`
- `.kiro/specs/i18n-full-coverage/requirements.md`
- `.kiro/specs/i18n-full-coverage/design.md`
- `.kiro/specs/i18n-full-coverage/tasks.md`
- `.kiro/specs/i18n-full-coverage/research.md`
- `.kiro/steering/product.md`
- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| Warning | 4 |
| Info | 3 |

**Overall Assessment**: 仕様は概ね適切に設計されているが、1つのCritical issue（設計とコード間の整合性問題）と複数のWarningが存在する。実装前に対処が必要。

## 1. Document Consistency Analysis

### 1.1 Requirements <-> Design Alignment

**Alignment Status**: 良好

全ての要件（Requirement 1-7）がDesign documentに適切にマッピングされている。Requirements Traceabilityテーブルで明確な対応関係が定義されている。

| Requirement | Design Coverage | Status |
|-------------|-----------------|--------|
| 1.1-1.6 (エラーハンドラー) | ErrorHandler component, err.handler.*キー | ✅ |
| 2.1-2.6 (診断サービス) | DoctorService, DoctorCommand, doctor.*キー | ✅ |
| 3.1-3.5 (i18nモジュール) | i18n Module, Messages interface拡張 | ✅ |
| 4.1-4.3 (ヘルプ提案) | ErrorHandler, err.handler.help.*キー | ✅ |
| 5.1-5.4 (後方互換性) | 既存t()関数維持 | ✅ |
| 6.1-6.4 (チェッカー) | 各Checker component | ✅ |
| 7.1-7.4 (品質保証) | Testing Strategy section | ✅ |

### 1.2 Design <-> Tasks Alignment

**Alignment Status**: 良好

Designで定義された全コンポーネントに対応するTasksが存在する。

| Design Component | Tasks Coverage | Status |
|------------------|----------------|--------|
| i18n Module拡張 | Task 1.1, 1.2, 1.3 | ✅ |
| ErrorHandler | Task 2 | ✅ |
| DoctorService | Task 3.1 | ✅ |
| DoctorCommand | Task 3.2 | ✅ |
| EnvironmentChecker | Task 4.1 | ✅ |
| FirebaseChecker | Task 4.2 | ✅ |
| ConfigChecker | Task 4.3 | ✅ |
| BuildChecker | Task 4.4 | ✅ |
| Tests | Task 5.1-5.5 | ✅ |

### 1.3 Design <-> Tasks Completeness

**Alignment Status**: ほぼ完全

| Category | Design Definition | Task Coverage | Status |
|----------|-------------------|---------------|--------|
| UI Components | N/A（CLI、UI定義なし） | N/A | ✅ |
| Services | ErrorHandler, DoctorService | Task 2, 3.1 | ✅ |
| Types/Models | Messages interface拡張 | Task 1.1-1.3 | ✅ |
| Commands | DoctorCommand | Task 3.2 | ✅ |
| Domain | 4 Checkers | Task 4.1-4.4 | ✅ |

### 1.4 Cross-Document Contradictions

**[CRITICAL] メッセージキー命名規則の不整合**

| Issue ID | Documents | Contradiction |
|----------|-----------|---------------|
| C-1 | design.md vs 既存コード | design.mdでは`err.handler.*`の新規キー構造を提案しているが、既存のi18n.tsでは`err.*`のフラットな構造を使用。例: 既存`err.authFailed` vs 提案`err.handler.auth.invalid`。命名規則の一貫性について明確な移行方針がない |

**[WARNING] DoctorService内のハードコードメッセージ言語**

| Issue ID | Documents | Contradiction |
|----------|-----------|---------------|
| W-1 | design.md vs 既存コード | design.mdでは進捗メッセージに`doctor.progress.*`キーを定義しているが、既存doctor-service.tsでは日本語メッセージ（「設定ファイルが見つかりました」等）と英語メッセージ（"Starting diagnostics..."）が混在。一貫性のある言語選択が必要 |

**[WARNING] メッセージ数の不一致**

| Issue ID | Documents | Contradiction |
|----------|-----------|---------------|
| W-2 | requirements.md vs design.md vs research.md | requirements.mdでは「約70〜80個の未対応メッセージ」、design.mdでは「約95個の新規メッセージキー」、research.mdでは「合計約95個の新規メッセージキー」と記載。正確な数の確定が必要 |

## 2. Gap Analysis

### 2.1 Technical Considerations

**[WARNING] 動的パラメータの処理方針**

- **Gap**: design.mdでは「動的な値（パス、エラーメッセージ）は文字列連結で組み込み」と記載されているが、具体的な実装パターンが明示されていない
- **Risk**: 文字列連結では日本語と英語で語順が異なる場合に問題が発生する可能性がある
- **Recommendation**: 代表的なケースの実装例をdesign.mdに追加する

**[INFO] エラーメッセージのコンテキスト情報**

- **Gap**: 現在のerror-handler.tsでは動的な値（`error.message`, `error.projectId`等）が直接連結されている。これらはt()関数のスコープ外
- **Impact**: 現状維持で問題ないが、将来的なプレースホルダー導入時に考慮が必要

**テスト戦略の詳細**

- **Coverage**: テスト戦略はdesign.mdで定義されており、Unit/Integration/E2Eの各レベルをカバー
- **Gap**: なし

### 2.2 Operational Considerations

**[INFO] 翻訳品質の検証プロセス**

- **Gap**: 翻訳の品質保証プロセス（ネイティブチェック等）が明示されていない
- **Risk**: 低（開発者向けツールであり、翻訳品質は自己検証で十分）
- **Recommendation**: research.mdで「PRレビューでの確認、ネイティブチェック推奨」と記載済み

**デプロイメント手順**

- **Gap**: なし（既存のリリースプロセスに準拠）

**ロールバック戦略**

- **Gap**: なし（i18n.ts拡張のみでロールバックは容易）

**モニタリング/ロギング**

- **Gap**: なし（既存のloggingServiceパターンを維持）

## 3. Ambiguities and Unknowns

**[INFO] 「約95個」の正確な内訳**

- design.mdのMessages interface定義では約80個のキーが明示的に定義されているが、「約95個」との乖離がある
- **Recommendation**: 実装時に正確なキー数を確定し、ドキュメントを更新

**既存テストへの影響範囲**

- research.mdで「既存のテストがメッセージ文字列をハードコードしている可能性」と言及されているが、具体的な影響範囲が不明
- **Recommendation**: 実装開始前に既存テストの調査を実施

## 4. Steering Alignment

### 4.1 Architecture Compatibility

**Status**: 完全準拠

- **tech.md準拠**: TypeScript 5.x strict mode、ESM modules、neverthrow Result type
- **structure.md準拠**: Shared層でのi18n管理、Commands/Services/Domain層からの参照パターン
- **product.md準拠**: 日英2言語サポート、開発者・DevOpsエンジニア・AIアシスタント向け

### 4.2 Integration Concerns

**[WARNING] 既存キーとの命名規則の一貫性**

- 既存キー: `err.authFailed`, `err.invalidPath`（フラット構造）
- 新規キー: `err.handler.auth.invalid`, `err.handler.config.fileNotFound`（階層構造）
- **Concern**: 同じ`err.*`名前空間内で異なる命名規則が混在する
- **Recommendation**:
  1. 新規キーを`err.handler.*`として分離するか
  2. 既存キーも将来的に階層化するかの方針を明確化

### 4.3 Migration Requirements

**データ移行**

- 不要（コードのみの変更）

**段階的ロールアウト**

- 不要（機能フラグなしで一括リリース可能）

**後方互換性**

- requirements.md Requirement 5で明確に定義済み
- 既存のt()関数呼び出しパターンを維持

## 5. Recommendations

### Critical Issues (Must Fix)

| ID | Issue | Recommendation |
|----|-------|----------------|
| C-1 | 既存キー命名規則と新規キー命名規則の不整合 | design.mdに「既存キーはフラット構造を維持し、新規エラーハンドラー用キーは`err.handler.*`名前空間を使用する」等の明確な方針を追記 |

### Warnings (Should Address)

| ID | Issue | Recommendation |
|----|-------|----------------|
| W-1 | DoctorService内の混在言語メッセージ | 既存の英語メッセージ（"Starting diagnostics..."）もi18nキー化するか、日本語メッセージを英語に統一してからi18n化するかを決定 |
| W-2 | メッセージ数の不一致（70-80 vs 95） | design.mdのMessages interface定義を正として、requirements.mdの記述を「約95個」に更新 |
| W-3 | 動的パラメータの処理パターン | design.mdに代表的な実装例を追加（例: `t('err.handler.config.fileNotFound') + ': ' + path`） |
| W-4 | 既存テストの影響範囲 | Task 5開始前に既存テストファイルの調査を実施 |

### Suggestions (Nice to Have)

| ID | Suggestion |
|----|------------|
| S-1 | research.mdで言及されている「将来的なファイル分離」の閾値（例: 300キー以上で検討）を明記 |
| S-2 | E2Eテスト（Task 5.5）でLC_ALL/LANGの優先順位テストを追加 |

## 6. Action Items

| Priority | Issue | Recommended Action | Affected Documents |
|----------|-------|--------------------|--------------------|
| Critical | C-1 | 命名規則の方針を明確化 | design.md |
| High | W-1 | 既存メッセージ言語の統一方針を決定 | design.md, tasks.md |
| High | W-2 | メッセージ数の記述を統一 | requirements.md |
| Medium | W-3 | 動的パラメータの実装例を追加 | design.md |
| Medium | W-4 | 既存テスト調査をタスクに追加 | tasks.md |
| Low | S-1, S-2 | 将来の改善事項として記録 | research.md |

---

_This review was generated by the document-review command._
