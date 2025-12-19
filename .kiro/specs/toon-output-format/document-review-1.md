# Specification Review Report #1

**Feature**: toon-output-format
**Review Date**: 2025-12-20
**Documents Reviewed**:
- spec.json
- requirements.md
- design.md
- tasks.md
- steering/product.md
- steering/tech.md
- steering/structure.md

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| Warning | 4 |
| Info | 3 |

全体的に仕様書の品質は良好ですが、外部依存パッケージの存在確認に関するCriticalな問題と、いくつかの改善推奨事項が見つかりました。

## 1. Document Consistency Analysis

### 1.1 Requirements ↔ Design Alignment

**適合状況**: ✅ 良好

| Requirement | Design Coverage | Status |
|-------------|-----------------|--------|
| Req 1: TOON出力形式のサポート | OutputFormatter, ToonEncoder | ✅ |
| Req 2: ドキュメント操作でのTOON出力 | Commands Layer, OutputFormatter | ✅ |
| Req 3: メタデータのTOON形式対応 | FormatOptions.includeMetadata | ✅ |
| Req 4: Watch機能でのTOON出力 | formatChange メソッド | ✅ |
| Req 5: コレクション一覧のTOON出力 | formatCollections メソッド | ✅ |
| Req 6: MCP経由でのTOON出力 | MCP Tools format パラメータ | ✅ |
| Req 7: エラーハンドリング | FormatError, ToonEncoder | ✅ |
| Req 8: 型定義の更新 | types.ts OutputFormat | ✅ |

**矛盾・ギャップ**: なし

Requirements Traceabilityテーブルが design.md に含まれており、全要件がDesignコンポーネントにマッピングされています。

### 1.2 Design ↔ Tasks Alignment

**適合状況**: ✅ 良好

| Design Component | Task Coverage | Status |
|-----------------|---------------|--------|
| ToonEncoder | Task 2.1 | ✅ |
| OutputFormatter拡張 | Task 2.2 | ✅ |
| BaseCommand拡張 | Task 3.1 | ✅ |
| MCP Tools拡張 | Task 5.1 | ✅ |
| types.ts拡張 | Task 1.1 | ✅ |
| i18n拡張 | Task 1.2 | ✅ |

**矛盾・ギャップ**: なし

tasks.md のRequirements Coverageテーブルが全要件をタスクにマッピングしています。

### 1.3 Design ↔ Tasks Completeness

**詳細分析**:

| Category | Design Definition | Task Coverage | Status |
|----------|-------------------|---------------|--------|
| **Services** | | | |
| ToonEncoder | design.md:141-186 | Task 2.1 | ✅ |
| OutputFormatter拡張 | design.md:187-231 | Task 2.2 | ✅ |
| **CLI Components** | | | |
| BaseCommand --toonフラグ | design.md:235-280 | Task 3.1 | ✅ |
| resolveFormat拡張 | design.md:267-279 | Task 3.1 | ✅ |
| **MCP Tools** | | | |
| firestore_get format | design.md:300-308 | Task 5.1 | ✅ |
| firestore_list format | design.md:300-308 | Task 5.1 | ✅ |
| firestore_set format | design.md:300-308 | Task 5.1 | ✅ |
| firestore_update format | design.md:300-308 | Task 5.1 | ✅ |
| firestore_delete format | design.md:300-308 | Task 5.1 | ✅ |
| firestore_export format | design.md:300-308 | Task 5.1 | ✅ |
| firestore_collections format | design.md:300-308 | Task 5.1 | ✅ |
| **Types/Models** | | | |
| OutputFormat型 | design.md:348-359 | Task 1.1 | ✅ |
| **i18n** | | | |
| flag.toon メッセージ | design.md:362-373 | Task 1.2 | ✅ |
| **Testing** | | | |
| ToonEncoder Unit Tests | design.md:430-433 | Task 6.1 | ✅ |
| OutputFormatter Unit Tests | design.md:433-437 | Task 6.2 | ✅ |
| BaseCommand Tests | design.md:437 | Task 6.3 | ✅ |
| Integration Tests | design.md:440-444 | Task 6.4 | ✅ |
| E2E Tests | design.md:447-450 | Task 6.5 | ✅ |

**結論**: Designで定義されたすべてのコンポーネントにTasksが対応しています。

### 1.4 Cross-Document Contradictions

**発見された矛盾**: なし

用語、数値、依存関係について一貫性が保たれています。

## 2. Gap Analysis

### 2.1 Technical Considerations

#### 2.1.1 [Critical] 外部依存パッケージの存在確認

**問題**: Design/Tasksで参照されている `@toon-format/toon` パッケージの実在性が未確認

**詳細**:
- design.md では `@toon-format/toon` (latest) を使用すると記載
- 参照URL: https://github.com/toon-format/toon
- npmパッケージ: `@toon-format/toon`

**現状**:
- package.json に該当パッケージは含まれていない
- TOONフォーマット自体が比較的新しい概念であり、公式パッケージの存在を事前に確認する必要がある

**推奨アクション**:
1. npm registry で `@toon-format/toon` の存在を確認
2. パッケージが存在しない場合、代替実装（自前のTOONエンコーダー）を検討
3. design.md に代替案を追記

#### 2.1.2 [Warning] NaN/Infinity値の処理

**問題**: design.md (181行目) で「NaN/Infinityはnullに変換される（TOON仕様）」と記載されているが、これがライブラリの動作なのか、アプリケーション側で処理すべきかが曖昧

**推奨アクション**:
- ToonEncoderの責務として明確化するか、またはライブラリの動作を前提とするか明記

#### 2.1.3 [Info] 循環参照オブジェクトの処理

**問題**: 循環参照を含むオブジェクトのTOON変換時のエラーハンドリングが未記載

**推奨アクション**:
- エラーハンドリング戦略に循環参照のケースを追加

### 2.2 Operational Considerations

#### 2.2.1 [Warning] パフォーマンスベンチマークの欠如

**問題**: design.md で「JSONと比較して40-60%のトークン削減」と記載されているが、具体的なベンチマーク計画がTasks未記載

**推奨アクション**:
- Task 6セクションにパフォーマンステストの追加を検討

#### 2.2.2 [Info] ドキュメント更新

**問題**: README.mdやCHANGELOG.mdへのTOON形式追加に関する記載がない

**推奨アクション**:
- リリース時のドキュメント更新タスクの検討（必須ではない）

## 3. Ambiguities and Unknowns

### 3.1 TOON形式の具体的な出力形式

**曖昧さ**: design.md の「TOON出力例」セクション（383-404行）に例示があるが、@toon-format/toonライブラリの実際の出力形式と一致するか不明

**影響**:
- 出力形式がライブラリ依存であるため、実際の出力はライブラリ実装に依存
- 例示と実際の出力が異なる可能性

**推奨アクション**:
- ライブラリの動作確認後、必要に応じてdesign.mdの例示を更新

### 3.2 MCPツールでのyaml/table形式サポート

**曖昧さ**: design.md (300-308行) でMCPツールのformatパラメータは `'json' | 'toon'` のみ

**疑問点**:
- CLIでは`json`, `yaml`, `table`, `toon`の4形式をサポート
- MCPでは`json`, `toon`の2形式のみ
- この設計判断の理由が明示されていない

**推奨アクション**:
- Non-Goalsセクションに「MCPでのyaml/tableサポート」を追加して意図を明確化
- または、MCPでも全形式をサポートするか検討

### 3.3 [Warning] --format と --toon フラグの排他性

**曖昧さ**: design.md (263行) で `exclusive: ['json', 'yaml', 'table']` と記載

**疑問点**:
- `--format toon --toon` のような重複指定時の動作が未定義
- 既存の `--json`, `--yaml`, `--table` との排他関係のみ定義

**推奨アクション**:
- `exclusive` に `'format'` を含めるか、重複時の優先順位を明記

## 4. Steering Alignment

### 4.1 Architecture Compatibility

**評価**: ✅ 適合

| Steering指針 | 本仕様の適合性 |
|-------------|---------------|
| Layer Architecture | Presentation層に閉じた変更、Domain層への影響なし ✅ |
| neverthrow Result型 | ToonEncoder, OutputFormatterで使用 ✅ |
| TypeScript strict mode | 型安全なOutputFormat拡張 ✅ |
| 既存パターン維持 | switch文による形式分岐を踏襲 ✅ |

### 4.2 Integration Concerns

**評価**: ⚠️ 軽微な懸念

#### 4.2.1 [Warning] 既存テストへの影響

**懸念**:
- OutputFormatの型変更により、既存のテストで型エラーが発生する可能性

**現状確認**:
- src/presentation/output-formatter.ts の既存テストが型変更に対応しているか確認が必要

**推奨アクション**:
- 型変更後の全テスト実行確認をTask 6に含める

### 4.3 Migration Requirements

**評価**: ✅ 問題なし

- 後方互換性: 既存のjson/yaml/table形式はそのまま動作
- データ移行: 不要
- 段階的ロールアウト: 不要（新機能追加のみ）

## 5. Recommendations

### Critical Issues (Must Fix)

| ID | Issue | Impact |
|----|-------|--------|
| C-1 | `@toon-format/toon` パッケージの実在確認 | 実装不可能のリスク |

**詳細**:
- 実装前にnpm registry で `npm view @toon-format/toon` を実行
- パッケージが存在しない場合、代替実装計画が必要

### Warnings (Should Address)

| ID | Issue | Impact |
|----|-------|--------|
| W-1 | NaN/Infinity処理の明確化 | 実装時の混乱 |
| W-2 | パフォーマンスベンチマーク計画の追加 | 効果測定不可 |
| W-3 | --format と --toon の排他性明確化 | エッジケースのバグ |
| W-4 | 既存テストへの型変更影響確認 | テスト失敗リスク |

### Suggestions (Nice to Have)

| ID | Issue | Impact |
|----|-------|--------|
| I-1 | 循環参照オブジェクトの処理追加 | 堅牢性向上 |
| I-2 | MCPでのyaml/tableサポート意図の明記 | ドキュメント品質 |
| I-3 | README更新タスクの追加 | ユーザビリティ |

## 6. Action Items

| Priority | Issue | Recommended Action | Affected Documents |
|----------|-------|-------------------|-------------------|
| Critical | C-1: パッケージ存在確認 | npm registry で確認、代替案検討 | design.md, tasks.md |
| High | W-1: NaN/Infinity処理 | ToonEncoderの責務として明確化 | design.md |
| High | W-3: フラグ排他性 | exclusive配列にformat追加を検討 | design.md |
| Medium | W-2: ベンチマーク | Task 6にパフォーマンステスト追加 | tasks.md |
| Medium | W-4: テスト影響 | 実装時に全テスト実行確認 | tasks.md |
| Low | I-1: 循環参照 | Error Handling セクション更新 | design.md |
| Low | I-2: MCP形式制限 | Non-Goals更新 | design.md |
| Low | I-3: README更新 | オプションタスク追加 | tasks.md |

---

_This review was generated by the document-review command._
