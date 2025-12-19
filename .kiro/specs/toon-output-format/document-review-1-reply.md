# Response to Document Review #1

**Feature**: toon-output-format
**Review Date**: 2025-12-20
**Reply Date**: 2025-12-20

---

## Response Summary

| Severity | Issues | Fix Required | No Fix Needed | Needs Discussion |
| -------- | ------ | ------------ | ------------- | ---------------- |
| Critical | 1      | 0            | 1             | 0                |
| Warning  | 4      | 2            | 2             | 0                |
| Info     | 3      | 0            | 3             | 0                |

---

## Response to Critical Issues

### C-1: `@toon-format/toon` パッケージの実在確認

**Issue**: Design/Tasksで参照されている `@toon-format/toon` パッケージの実在性が未確認

**Judgment**: **No Fix Needed** ❌

**Evidence**:

npm registry および Web検索により確認済み。パッケージは実在し、活発にメンテナンスされている:

- **npm package**: https://www.npmjs.com/package/@toon-format/toon
- **最新バージョン**: 2.0.1 (2025年12月16日公開)
- **GitHub**: https://github.com/toon-format/toon
- **他プロジェクトでの使用実績**: 55件以上

パッケージのインストールは `npm install @toon-format/toon` で可能。TypeScript SDKとして公式提供されており、`encode(data)` および `decode(toonString)` APIを提供している。

**Action Items**: なし（パッケージは存在するため、設計通りに実装可能）

---

## Response to Warnings

### W-1: NaN/Infinity処理の明確化

**Issue**: design.md (181行目) で「NaN/Infinityはnullに変換される（TOON仕様）」と記載されているが、これがライブラリの動作なのか、アプリケーション側で処理すべきかが曖昧

**Judgment**: **No Fix Needed** ❌

**Evidence**:

@toon-format/toon ライブラリはJSON.stringifyの挙動に準拠しており、NaN/Infinityは自動的にnullに変換される。これはJavaScriptのJSON.stringify標準動作であり、TOON仕様もこれに従う。

design.md (181行目) の記載:
```
Invariants: NaN/Infinityはnullに変換される（TOON仕様）
```

この記載は「ライブラリ側で処理される」ことを「（TOON仕様）」として明示している。ToonEncoderラッパーが追加で処理する必要はなく、ライブラリに委譲すれば良い。

tasks.md (25-26行目) でも「NaN/Infinity値のnull変換はライブラリ側で処理」と明記されている。

**Action Items**: なし（設計文書で既に明確）

---

### W-2: パフォーマンスベンチマーク計画の追加

**Issue**: design.md で「JSONと比較して40-60%のトークン削減」と記載されているが、具体的なベンチマーク計画がTasks未記載

**Judgment**: **Fix Required** ✅

**Evidence**:

design.md (457-460行目) でパフォーマンスに関する記載があるが、tasks.md にはベンチマークテストの具体的なタスクが含まれていない。

TOONの主要なメリットであるトークン削減効果を検証するテストは、機能の価値を示すために重要。

**Action Items**:

- tasks.md の Task 6 セクションに簡易ベンチマークテストを追加
- JSON vs TOON のサイズ比較テスト（単一ドキュメント、複数ドキュメント）
- テスト結果をログ出力するオプションの検討（必須ではない）

---

### W-3: --format と --toon フラグの排他性

**Issue**: `--format toon --toon` のような重複指定時の動作が未定義

**Judgment**: **Fix Required** ✅

**Evidence**:

現在の base-command.ts (46-66行目) を確認:

```typescript
format: Flags.string({
  char: 'f',
  description: t('flag.format'),
  options: ['json', 'yaml', 'table'],
  default: 'json',
}),
json: Flags.boolean({
  description: t('flag.json'),
  default: false,
  exclusive: ['yaml', 'table'],
}),
```

既存の `--json`, `--yaml`, `--table` フラグは互いに排他だが、`--format` との排他関係は定義されていない。

design.md (263行目) の設計:
```typescript
toon: Flags.boolean({
  description: t('flag.toon'),
  default: false,
  exclusive: ['json', 'yaml', 'table'],
}),
```

`--toon` は他のブールフラグと排他だが、`--format` との関係が未定義。

ただし、`resolveFormat` メソッド (209-219行目) の優先順位ロジック:
```typescript
if (flags.json) return 'json';
if (flags.yaml) return 'yaml';
if (flags.table) return 'table';
return (flags.format || 'json') as OutputFormat;
```

このロジックにより、ブールフラグが優先される。`--toon` を追加する場合:
```typescript
if (flags.toon) return 'toon';
```

これにより `--format toon --toon` の場合は `--toon` が優先される（一貫した動作）。

**Action Items**:

- design.md の Implementation Notes に優先順位を明記:
  - ブールフラグ (`--json`, `--yaml`, `--table`, `--toon`) > `--format`
- 重複時の動作は既存パターンに従い「ブールフラグ優先」で一貫

---

### W-4: 既存テストへの型変更影響確認

**Issue**: OutputFormatの型変更により、既存のテストで型エラーが発生する可能性

**Judgment**: **No Fix Needed** ❌

**Evidence**:

現在の types.ts (11行目):
```typescript
export type OutputFormat = 'json' | 'yaml' | 'table';
```

この型にユニオンメンバー `'toon'` を追加する変更は「拡張」であり、既存コードとの後方互換性がある:

1. 既存コードが `OutputFormat` を受け取る箇所は引き続き `'json' | 'yaml' | 'table'` を受け入れる
2. switch文の default ケースが `'toon'` をキャッチする（エラーハンドリング）
3. 型の「縮小」ではないため、既存テストでコンパイルエラーは発生しない

output-formatter.ts を確認すると、各メソッドの switch 文には default ケースが存在し、未知の形式に対して `FORMAT_ERROR` を返す設計になっている。

**Action Items**: なし（後方互換性のある型拡張のため、既存テストへの影響なし）

---

## Response to Info (Low Priority)

| #    | Issue                           | Judgment      | Reason                                                                                   |
| ---- | ------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| I-1  | 循環参照オブジェクトの処理      | No Fix Needed | Firestoreドキュメントは循環参照を含まない（Firestoreの制約）。実務上発生しないケース      |
| I-2  | MCPでのyaml/table形式サポート意図 | No Fix Needed | MCPはAIアシスタント向けであり、yaml/tableは人間可読目的。json/toonの2形式で十分         |
| I-3  | README更新タスクの追加          | No Fix Needed | ドキュメント更新はリリース時の標準作業。specレベルでのタスク管理対象外                    |

---

## Files to Modify

| File       | Changes                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------- |
| design.md  | W-3: Implementation Notes に `--format` と `--toon` 重複時の優先順位を追記                       |
| tasks.md   | W-2: Task 6 に簡易パフォーマンステスト（JSON vs TOON サイズ比較）を追加                          |

---

## Conclusion

レビューで指摘された8件の問題のうち、実際に対応が必要なのは2件（W-2, W-3）のみ:

1. **Critical (C-1)**: パッケージ実在確認 → **No Fix Needed** - npm で存在確認済み
2. **Warning (W-1)**: NaN/Infinity処理 → **No Fix Needed** - 設計文書で明確
3. **Warning (W-2)**: ベンチマーク → **Fix Required** - tasks.md に追加
4. **Warning (W-3)**: フラグ排他性 → **Fix Required** - design.md に優先順位追記
5. **Warning (W-4)**: テスト影響 → **No Fix Needed** - 後方互換性あり
6. **Info (I-1〜I-3)**: 全て **No Fix Needed** - 実務上不要またはスコープ外

仕様は全体的に良好であり、軽微な追記のみで実装フェーズに進むことができる。

**次のステップ**:
- `--fix` フラグで修正を適用後、`/kiro:spec-impl toon-output-format` で実装を開始
