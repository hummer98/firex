# Bug Fix: timestamp-env-vars

## Summary
TZ環境変数のサポートを追加し、README/README-jpを実装に合わせて更新。標準的なUNIX環境変数（TZ）を尊重し、優先順位を明確に文書化。

## Changes Made

### Files Modified
| File | Change Description |
|------|-------------------|
| `src/services/config.ts` | TZ環境変数のフォールバック追加 |
| `src/services/config.test.ts` | TZ優先順位のテスト追加（2件） |
| `README.md` | TZ環境変数ドキュメント追加、優先順位明記、timestamp-format修正 |
| `README-jp.md` | 同上（日本語版） |

### Code Changes

#### src/services/config.ts
```diff
- if (process.env.FIREX_TIMEZONE) {
-   output.timezone = process.env.FIREX_TIMEZONE;
- }
+ // Timezone priority: FIREX_TIMEZONE > TZ
+ if (process.env.FIREX_TIMEZONE) {
+   output.timezone = process.env.FIREX_TIMEZONE;
+ } else if (process.env.TZ) {
+   output.timezone = process.env.TZ;
+ }
```

#### src/services/config.test.ts
```diff
+ it('should map TZ to output.timezone when FIREX_TIMEZONE is not set', async () => {
+   process.env.TZ = 'America/New_York';
+   const result = await configService.loadConfig({ searchFrom: tmpDir });
+   expect(result.isOk()).toBe(true);
+   if (result.isOk()) {
+     expect(result.value.output?.timezone).toBe('America/New_York');
+   }
+ });
+
+ it('should prioritize FIREX_TIMEZONE over TZ', async () => {
+   process.env.FIREX_TIMEZONE = 'Asia/Tokyo';
+   process.env.TZ = 'America/New_York';
+   const result = await configService.loadConfig({ searchFrom: tmpDir });
+   expect(result.isOk()).toBe(true);
+   if (result.isOk()) {
+     expect(result.value.output?.timezone).toBe('Asia/Tokyo');
+   }
+ });
```

#### README.md / README-jp.md
```diff
- | --timestamp-format | Timestamp format (unix, iso, relative, none) |
+ | --timestamp-format | Timestamp format (iso, none) |

+ | TZ | Standard UNIX timezone (used when FIREX_TIMEZONE is not set) |

+ **Timezone Priority**: CLI option > FIREX_TIMEZONE > TZ > System detection
```

## Implementation Notes
- TZ環境変数は`FIREX_TIMEZONE`より低い優先順位で参照される
- `relative`フォーマットは未実装のためREADMEから削除（将来の機能追加として検討）
- LANG/LC_TIME対応は別issueとして切り出し（本修正のスコープ外）
- 既存のテスト748件すべてパス

## Breaking Changes
- [x] No breaking changes

`relative`と`unix`フォーマットオプションの削除はドキュメント修正のみであり、これらは元々未実装だったため実質的な破壊的変更なし。

## Rollback Plan
1. `git revert <commit-hash>` で変更を取り消し
2. TZ環境変数対応のみを取り消す場合は config.ts の該当行を削除

## Related Commits
- 修正コミットはこのバグ修正完了後に作成予定

## Test Results
```
✓ 748 tests passed
```
