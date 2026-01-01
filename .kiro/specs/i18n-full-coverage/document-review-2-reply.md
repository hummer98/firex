# Response to Document Review #2

**Feature**: i18n-full-coverage
**Review Date**: 2026-01-01
**Reply Date**: 2026-01-01

---

## Response Summary

| Severity | Issues | Fix Required | No Fix Needed | Needs Discussion |
| -------- | ------ | ------------ | ------------- | ---------------- |
| Critical | 0      | 0            | 0             | 0                |
| Warning  | 2      | 0            | 2             | 0                |
| Info     | 4      | 0            | 4             | 0                |

---

## Response to Warnings

### W-1: 既存コードのハードコードメッセージの言語混在

**Issue**: doctor-service.ts に英語（"Starting diagnostics..."）と日本語（「設定ファイルが見つかりました」）が混在している

**Judgment**: **No Fix Needed** ❌

**Evidence**:
既存コードを確認した結果、確かに言語混在が存在する：

```typescript
// doctor-service.ts:72-74 - 英語の進捗メッセージ
if (options.verbose) {
  console.log('Starting diagnostics...');
  console.log(`Emulator mode: ${emulatorMode}`);
}

// doctor-service.ts:276 - 日本語のエラーメッセージ
return createCheckResult('error', category, `チェックに失敗しました: ${message}`);
```

しかし、この問題はReview #2でも正しく認識されている通り、**tasks.md Task 3.1で対応予定**である。

- Task 3.1: 「DoctorServiceの進捗・エラーメッセージをi18n化する」
- 実装時にこれらのハードコードメッセージはすべてt()関数呼び出しに置換される

**結論**: 仕様書(spec)の修正は不要。これは実装フェーズで解決される問題。

---

### W-2: 実際のメッセージキー数の検証

**Issue**: design.mdのMessages interfaceで定義されているキー数と「約95個」の見積もりの整合性

**Judgment**: **No Fix Needed** ❌

**Evidence**:
Review #2のカウント結果を検証：
- err.handler.*: 約30キー
- doctor.progress.*: 約15キー
- doctor.error.*: 約3キー
- doctor.check.*: 約50キー
- flag.doctor.json: 1キー
- 合計: 約99キー

requirements.md line 5では「約95個」と記載されており、「約」という表現で5%程度の誤差は許容範囲内。

また、現在の i18n.ts は約410行・120キーであり、拡張後に約220キー（約800-900行）となる見込みで、research.mdで言及されている将来的なファイル分離閾値（300キー）を下回っている。

**結論**: 見積もりは妥当であり、仕様書の修正は不要。実装時に最終的なキー数が確定する。

---

## Response to Info (Low Priority)

| #    | Issue                              | Judgment      | Reason                                                  |
| ---- | ---------------------------------- | ------------- | ------------------------------------------------------- |
| I-1  | 動的パラメータの実装パターン       | No Fix Needed | Review #1で対応済み。design.md line 373-383に実装例追加 |
| I-2  | 既存テストへの影響範囲             | No Fix Needed | tasks.md Task 5.2-5.3でテスト更新を計画済み             |
| I-3  | i18n.tsファイルサイズの増大        | No Fix Needed | 許容範囲内（220キー < 300キー閾値）                     |
| I-4  | 英語メッセージの翻訳品質           | No Fix Needed | 開発者向けCLIのため必須ではない。PR時レビュー推奨       |

---

## Files to Modify

| File   | Changes   |
| ------ | --------- |
| なし   | 修正不要  |

---

## Conclusion

Review #2で指摘されたすべての項目を検証した結果、**仕様書の修正は不要**と判断した。

- W-1（言語混在）: 実装フェーズのTask 3.1で対応予定
- W-2（メッセージキー数）: 「約95個」は妥当な見積もり（実際は約99キー）
- Info項目: すべて既にtasks.mdで対応計画済み、または許容範囲内

仕様書は実装準備完了の状態にある。

**推奨アクション**: `/kiro:spec-impl i18n-full-coverage` で実装を開始可能
