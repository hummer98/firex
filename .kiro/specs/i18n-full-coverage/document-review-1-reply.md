# Response to Document Review #1

**Feature**: i18n-full-coverage
**Review Date**: 2026-01-01
**Reply Date**: 2026-01-01

---

## Response Summary

| Severity | Issues | Fix Required | No Fix Needed | Needs Discussion |
| -------- | ------ | ------------ | ------------- | ---------------- |
| Critical | 1      | 0            | 1             | 0                |
| Warning  | 4      | 2            | 2             | 0                |
| Info     | 3      | 0            | 3             | 0                |

---

## Response to Critical Issues

### C-1: 既存キー命名規則と新規キー命名規則の不整合

**Issue**: design.mdでは`err.handler.*`の新規キー構造を提案しているが、既存のi18n.tsでは`err.*`のフラットな構造を使用。例: 既存`err.authFailed` vs 提案`err.handler.auth.invalid`。命名規則の一貫性について明確な移行方針がない。

**Judgment**: **No Fix Needed** ❌

**Evidence**:
既存のi18n.ts（src/shared/i18n.ts:73-78）を確認:
```typescript
// Error messages
'err.documentNotFound': string;
'err.invalidPath': string;
'err.invalidJson': string;
'err.authFailed': string;
'err.permissionDenied': string;
```

research.md（line 69-80）で設計判断が明確に記録されている:
```
err.handler.auth.*      - 認証エラー（ErrorHandler用）
err.handler.config.*    - 設定エラー（ErrorHandler用）
...
```

これは**意図的な名前空間分離**である：
1. 既存の`err.*`キー（`err.authFailed`等）は一般的なエラーメッセージで、既存コマンドから直接使用
2. 新規の`err.handler.*`キーはErrorHandler専用の詳細なエラーメッセージ

設計意図:
- 既存キーを変更せず後方互換性を維持（Requirement 5.1, 5.2）
- 新規ErrorHandler用キーは別名前空間で管理し、衝突を回避
- 将来的に既存キーを廃止する場合も段階的移行が可能

**Action Items**: なし（設計は適切）

---

## Response to Warnings

### W-1: DoctorService内の混在言語メッセージ

**Issue**: design.mdでは進捗メッセージに`doctor.progress.*`キーを定義しているが、既存doctor-service.tsでは日本語メッセージと英語メッセージが混在。一貫性のある言語選択が必要。

**Judgment**: **No Fix Needed** ❌

**Evidence**:
doctor-service.ts（src/services/doctor-service.ts）を確認:
- Line 73-74: `'Starting diagnostics...'`, `'Emulator mode:'`（英語）
- Line 160: `'設定ファイルが見つかりました'`（日本語）
- Line 276: `'チェックに失敗しました:'`（日本語）

これは**レビューが指摘している問題そのもの**であり、design.mdでは`doctor.progress.*`キー（line 197-211）でこれらすべてをi18n化する設計になっている。tasks.mdのTask 3.1でこれらのメッセージをt()関数に置換することが明記されている。

レビューの指摘は「設計段階で統一方針が必要」という内容だが、design.mdのMessages interfaceにすでに統一された`doctor.progress.*`キーが定義されており、implementation phaseで解決される。追加のspec修正は不要。

**Action Items**: なし（実装タスクで対応済み）

---

### W-2: メッセージ数の不一致（70-80 vs 95）

**Issue**: requirements.mdでは「約70〜80個の未対応メッセージ」、design.mdでは「約95個の新規メッセージキー」、research.mdでは「合計約95個の新規メッセージキー」と記載。正確な数の確定が必要。

**Judgment**: **Fix Required** ✅

**Evidence**:
- requirements.md line 5: `約70〜80個の未対応メッセージ`
- design.md line 9: `約95個の新規メッセージキー`
- research.md line 58: `合計約95個の新規メッセージキーが必要`

research.mdのファイル別調査（line 47-57）では合計約95個と算出されており、これが正確な数値。requirements.mdの「70〜80個」は初期見積もりであり、design.md/research.mdの「約95個」に更新すべき。

**Action Items**:
- requirements.mdのline 5の「約70〜80個」を「約95個」に更新

---

### W-3: 動的パラメータの処理パターン

**Issue**: design.mdでは「動的な値（パス、エラーメッセージ）は文字列連結で組み込み」と記載されているが、具体的な実装パターンが明示されていない。

**Judgment**: **Fix Required** ✅

**Evidence**:
design.md（line 347）では以下のみ記載:
```
- 動的な値（パス、エラーメッセージ）は文字列連結で組み込み
```

research.md（line 121-124）でプレースホルダー対応見送りの決定が記録されているが、具体的な実装例がない。

既存のerror-handler.ts（src/services/error-handler.ts:62）の例:
```typescript
return `設定ファイルが見つかりません: ${error.path}`;
```

i18n化後の実装例を明示することで、実装者の迷いを減らせる。

**Action Items**:
- design.mdのErrorHandler section（Implementation Notes）に実装例を追加

---

### W-4: 既存テストの影響範囲

**Issue**: research.mdで「既存のテストがメッセージ文字列をハードコードしている可能性」と言及されているが、具体的な影響範囲が不明。Task 5開始前に既存テストファイルの調査を実施。

**Judgment**: **No Fix Needed** ❌

**Evidence**:
research.md（line 144）で既にリスクとして記録:
```
既存テストへの影響 - メッセージ文字列をハードコードしているテスト → テスト更新を実装タスクに含める
```

tasks.md Task 5.1-5.4で既存テストの互換性検証が含まれている。また、TypeScriptの型システムにより、コンパイル時にメッセージキーの不整合が検出される。

実装phaseで必要に応じてテストを更新すればよく、spec段階での詳細調査は過剰。

**Action Items**: なし（実装時に対応）

---

## Response to Info (Low Priority)

| #    | Issue     | Judgment      | Reason         |
| ---- | --------- | ------------- | -------------- |
| I-1 | 「約95個」の正確な内訳 | No Fix Needed | 実装時に正確なキー数を確定する方針で問題なし。design.mdのMessages interface定義（line 145-315）に約80個のキーが明示されており、残りはチェッカー詳細メッセージ |
| I-2 | 既存テストへの影響範囲 | No Fix Needed | W-4と同様、実装phaseで対応 |
| I-3 | 翻訳品質の検証プロセス | No Fix Needed | research.md line 143で「PRレビューでの確認、ネイティブチェック推奨」と記載済み |

---

## Files to Modify

| File   | Changes   |
| ------ | --------- |
| requirements.md | Line 5: 「約70〜80個」→「約95個」に更新 |
| design.md | ErrorHandler Implementation Notes: 動的パラメータの実装例を追加 |

---

## Conclusion

レビューで指摘された7つの issue のうち:
- **Critical 1件**: 設計意図を確認し、No Fix Needed と判断
- **Warning 2件**: Fix Required として修正を実施
- **Warning 2件 + Info 3件**: No Fix Needed（実装phaseで対応/既に対応済み）

**修正対象**:
1. requirements.md: メッセージ数の記述を統一
2. design.md: 動的パラメータの実装例を追加

修正適用後、specは実装準備完了となる。
