# Bug Verification: timestamp-env-vars

## Verification Status
**PASSED**

## Test Results

### Reproduction Test
- [x] Bug no longer reproducible with original steps
- Steps tested:
  1. `TZ=America/New_York` 設定時に config.ts が TZ を読み込むことを確認
  2. `FIREX_TIMEZONE` と `TZ` 両方設定時に FIREX_TIMEZONE が優先されることを確認
  3. README に TZ 環境変数と優先順位が明記されていることを確認

### Regression Tests
- [x] Existing tests pass
- [x] No new failures introduced

### Manual Testing
- [x] Fix verified in development environment
- [x] Edge cases tested
  - TZ のみ設定: TZ が使用される
  - FIREX_TIMEZONE のみ設定: FIREX_TIMEZONE が使用される
  - 両方設定: FIREX_TIMEZONE が優先される
  - どちらも未設定: システム検出にフォールバック

## Test Evidence

### Unit Tests (config.test.ts)
```
✓ should map TZ to output.timezone when FIREX_TIMEZONE is not set (3ms)
✓ should prioritize FIREX_TIMEZONE over TZ (2ms)
```

### Full Test Suite
```
Test Files  54 passed (54)
Tests       748 passed (748)
Duration    4.17s
```

### README Updates Verified
- README.md: TZ 環境変数ドキュメント追加、優先順位明記
- README-jp.md: 同上（日本語版）

## Side Effects Check
- [x] No unintended side effects observed
- [x] Related features still work correctly
  - 既存の FIREX_TIMEZONE の動作は変更なし
  - timestamp-formatting の他の機能（dateFormat, color, rawOutput）に影響なし

## Sign-off
- Verified by: Claude
- Date: 2025-12-22
- Environment: Dev

## Notes
- `relative` フォーマットは将来の機能として切り出し（READMEから削除済み）
- LANG/LC_TIME 対応は別issueとして検討
- 破壊的変更なし（relative/unix は元々未実装だったため）
