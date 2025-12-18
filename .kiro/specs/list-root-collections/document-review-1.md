# Specification Review Report #1

**Feature**: list-root-collections
**Review Date**: 2025-12-18
**Documents Reviewed**:
- spec.json
- requirements.md
- design.md
- tasks.md
- .kiro/steering/ (no steering documents found)

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| Warning | 4 |
| Info | 3 |

全体的に仕様は整合性が取れており、既存のコードベースパターンに沿った設計となっています。ただし、要件とDesignの間でデフォルト出力形式に矛盾があり、また既存コードベースとの細部の整合性に注意が必要です。

## 1. Document Consistency Analysis

### 1.1 Requirements ↔ Design Alignment

**[CRITICAL] デフォルト出力形式の矛盾**

| Document | 記述 |
|----------|------|
| Requirements 3.1 | 「デフォルトでコレクション名を**JSON形式**で出力する」 |
| Design (OutputFormatter Notes) | 「プレーンテキスト: 改行区切りでコレクション名を出力」を**デフォルト**として記載 |
| Design (Data Models) | `PlainOutput`を「プレーンテキスト（デフォルト）」と記載 |

**影響**: 実装者がどちらの形式をデフォルトとすべきか判断できない。

**既存コードベースの実態**: 既存の`get`/`list`コマンドでは`--format`未指定時は`json`がデフォルト（`resolveFormat()`メソッドで実装）。Requirements 3.1が既存パターンと一致。

**推奨**: Design文書を修正し、Requirements 3.1に合わせてJSONをデフォルトとする。

---

**[OK] 要件カバレッジ**

| Requirement ID | Design Coverage | Status |
|----------------|-----------------|--------|
| 1.1 ルートコレクション一覧 | CollectionsCommand, listRootCollections() | ✅ |
| 1.2 取得件数表示 | formatOutput() | ✅ |
| 1.3 未検出時メッセージ | i18n msg.noCollectionsFound | ✅ |
| 2.1 サブコレクション一覧 | listSubcollections() | ✅ |
| 2.2 無効パスエラー | isDocumentPath(), INVALID_PATH | ✅ |
| 2.3 ドキュメント未検出エラー | getDocument(), NOT_FOUND | ✅ |
| 2.4 サブコレクション未検出 | i18n msg.noSubcollectionsFound | ✅ |
| 3.1-3.5 出力フォーマット | OutputFormatter, flags | ✅ |
| 4.1-4.4 エラーハンドリング | ErrorHandler, BaseCommand | ✅ |
| 5.1-5.3 i18n | i18n System | ✅ |

### 1.2 Design ↔ Tasks Alignment

**[OK] タスクカバレッジ**

すべてのDesignコンポーネントが適切にTasksに分解されています。

| Design Component | Task Coverage | Status |
|------------------|---------------|--------|
| i18n拡張 | Task 1.1 | ✅ |
| FirestoreOps拡張 | Task 2.1, 2.2 | ✅ |
| OutputFormatter拡張 | Task 3.1 | ✅ |
| CollectionsCommand | Task 4.1-4.4 | ✅ |
| エラーハンドリング | Task 5.1 | ✅ |
| テスト | Task 6.1-6.4 | ✅ |
| 統合 | Task 7.1-7.2 | ✅ |

### 1.3 Design ↔ Tasks Completeness

| Category | Design Definition | Task Coverage | Status |
|----------|-------------------|---------------|--------|
| UI Components | N/A (CLI) | N/A | ✅ |
| Services (FirestoreOps) | listRootCollections, listSubcollections | Task 2.1, 2.2 | ✅ |
| Services (OutputFormatter) | formatCollections | Task 3.1 | ✅ |
| Types/Models | FirestoreOpsError | Task 2.1, 2.2 | ✅ |
| i18n Messages | 6 new message keys | Task 1.1 | ✅ |
| Command | CollectionsCommand | Task 4.1-4.4 | ✅ |

### 1.4 Cross-Document Contradictions

**[WARNING] Requirements 3.1 と 3.2 の冗長性**

- Requirements 3.1: 「デフォルトでJSON形式で出力する」
- Requirements 3.2: 「`--json`フラグが指定されるとJSON形式で出力する」

これらは同一の動作を記述しており、`--json`フラグはデフォルト動作を明示的に指定するだけの意味になります。仕様として問題はありませんが、実装者に混乱を与える可能性があります。

## 2. Gap Analysis

### 2.1 Technical Considerations

**[WARNING] ドキュメント存在確認の実装方針が不明確**

Requirements 2.3: 「指定されたドキュメントが存在しない場合、エラーメッセージを表示する」

Design (FirestoreOps Interface):
- `listSubcollections()`の説明に「ドキュメント存在確認」が言及されている
- しかし、Firebase Admin SDKの`docRef.listCollections()`は**ドキュメントが存在しなくてもサブコレクションを返す**

**技術的詳細**: Firestoreではドキュメントが存在しなくても、そのパス配下にサブコレクションを作成できます。`listCollections()`はドキュメントの存在有無に関係なくサブコレクションを返します。

**推奨**:
1. 明示的に`docRef.get()`で存在確認を行う（Requirements準拠）
2. または、Requirements 2.3を「ドキュメントパスが無効な場合」に限定する（技術制約準拠）

---

**[INFO] パフォーマンスに関する記述**

Design (Non-Goals): 「再帰的なコレクション構造の完全探索（階層が深い場合のパフォーマンス考慮）」
Design (Implementation Notes): 「`listCollections()`は全参照をメモリにロードするため、大量コレクション時のメモリ使用量に注意」

これらは適切に記載されていますが、具体的な制限（例: 最大コレクション数の警告）は定義されていません。現時点では問題ありませんが、将来的な改善ポイントとして記録します。

---

**[OK] テスト戦略**

Unit Tests、Integration Tests、E2E Testsの3レベルが定義されており、適切なカバレッジです。

### 2.2 Operational Considerations

**[INFO] ヘルプテキストのテスト**

Requirements 5.3: 「ヘルプテキストをi18nシステムを使用してローカライズする」
Tasks 6.3: i18nメッセージのテストは「存在確認」のみ

ヘルプテキスト（`--help`出力）の実際の表示内容テストは明示的に記載されていませんが、Task 7.1で「ヘルプテキストの表示確認」が含まれているため、カバーされています。

## 3. Ambiguities and Unknowns

**[WARNING] 出力構造の詳細が未定義**

Requirements 3.1: 「JSON形式（`{ "collections": [...], "count": N }`）で出力する」

しかし、Design (Data Models) では:
```typescript
// JSON出力
type JsonOutput = string[]; // コレクション名の配列
```

配列形式（`[...]`）とオブジェクト形式（`{ collections: [...], count: N }`）で矛盾があります。

**影響**: `--quiet`との組み合わせでの動作も不明確。

**推奨**: Requirementsの形式（`{ collections: [...], count: N }`）を採用し、`--quiet`時は`collections`配列のみ出力するなど、明確な仕様を定義する。

---

**[INFO] エラー時の終了コード**

Design (Error Strategy): 「User Errors (Exit Code 1)」「System Errors (Exit Code 2)」

既存のErrorHandler実装と一致しており、問題ありません。

## 4. Steering Alignment

### 4.1 Architecture Compatibility

**Steeringドキュメント不在**

`.kiro/steering/`ディレクトリにsteeringドキュメントが存在しません。ただし、既存コードベースの分析から以下を確認しました：

| 観点 | 既存コードベースパターン | Design準拠 |
|------|------------------------|------------|
| レイヤー構造 | Commands → Domain → Services | ✅ 準拠 |
| Result型 | neverthrow使用 | ✅ 準拠 |
| BaseCommand継承 | 全コマンドで継承 | ✅ 準拠 |
| OutputFormatter | 共通フォーマッター使用 | ✅ 準拠 |
| i18n | t()関数使用 | ✅ 準拠 |
| エラーハンドリング | ErrorHandler使用 | ✅ 準拠 |

### 4.2 Integration Concerns

**[WARNING] OutputFormatter拡張の影響範囲**

Design: 「OutputFormatter (拡張) - formatCollections()メソッドを追加」

しかし、既存のOutputFormatterは`formatDocument()`、`formatDocuments()`、`formatChange()`メソッドを持ち、すべて**ドキュメントデータ**を対象としています。

`formatCollections()`はコレクション**名のリスト**（文字列配列）をフォーマットするため、新しいパターンとなります。既存メソッドと一貫性のある設計が必要です。

**推奨**: 既存のOutputFormatterに追加するか、CollectionsCommand内でローカルにフォーマット処理を行うか、実装時に検討する。

### 4.3 Migration Requirements

特になし。新規コマンドの追加であり、既存機能への影響はありません。

## 5. Recommendations

### Critical Issues (Must Fix)

1. **デフォルト出力形式の矛盾を解消する**
   - Design文書の「プレーンテキスト（デフォルト）」記述を「JSON（デフォルト）」に修正
   - または、Requirementsを見直してプレーンテキストをデフォルトにする
   - **推奨**: 既存コマンド（get, list）と一貫性を持たせ、JSONをデフォルトとする

### Warnings (Should Address)

1. **JSON出力構造の明確化**
   - Design (Data Models) を修正し、`{ collections: [...], count: N }`形式を明記
   - `--quiet`時の出力仕様も明記

2. **ドキュメント存在確認の方針決定**
   - Requirements 2.3の実現方法をDesignで明確化
   - `docRef.get().exists`による明示的確認を推奨

3. **Requirements 3.1/3.2 の整理**
   - 3.1を「デフォルト出力形式はJSONである」に修正
   - 3.2を「`--json`フラグでJSONを明示的に指定できる（デフォルトと同じ）」に修正
   - または3.2を削除し、他のフォーマット（yaml, table）のみ記載

4. **OutputFormatter拡張の設計確認**
   - 実装時に既存パターンとの整合性を確認

### Suggestions (Nice to Have)

1. **将来の拡張性として再帰的コレクション探索の検討**
   - `--recursive`フラグの追加など（Non-Goalsとして明記済みなので現時点では不要）

2. **大量コレクション時の警告閾値の定義**
   - 例: 1000件以上でパフォーマンス警告を表示

3. **Steeringドキュメントの作成**
   - プロジェクトのアーキテクチャ方針を明文化

## 6. Action Items

| Priority | Issue | Recommended Action | Affected Documents |
|----------|-------|--------------------|--------------------|
| Critical | デフォルト出力形式の矛盾 | Design文書のプレーンテキスト記述をJSON形式に修正 | design.md (行150-151, 395, 411-412) |
| Warning | JSON出力構造の矛盾 | Design Data ModelsをRequirementsの形式（`{ collections, count }`）に合わせる | design.md (行411-412) |
| Warning | ドキュメント存在確認方針 | Designに`docRef.get().exists`による確認を明記 | design.md (行291-298) |
| Warning | Requirements 3.1/3.2 冗長性 | 3.1を「デフォルト形式の定義」、3.2を「明示的指定」として整理 | requirements.md (行40-41) |
| Warning | OutputFormatter拡張設計 | 実装時に既存パターンとの一貫性を確認 | design.md (行367-398), tasks.md (Task 3.1) |
| Info | Steering未作成 | `/kiro:steering`でsteeringドキュメント作成を検討 | N/A |

---

_This review was generated by the document-review command._
