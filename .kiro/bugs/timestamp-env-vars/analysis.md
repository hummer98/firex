# Bug Analysis: timestamp-env-vars

## Summary
timestamp-formatting機能が標準UNIX環境変数（TZ、LANG/LC_TIME）を尊重せず、READMEに記載された`relative`フォーマットも未実装。

## Root Cause

### 問題1: TZ環境変数の無視
**Location**: `src/services/config.ts:291-296` および `src/services/output-options-resolver.ts:57-59`

`loadOutputFromEnv()`で`FIREX_TIMEZONE`のみを参照し、標準の`TZ`環境変数を無視している。
`OutputOptionsResolver`はconfig経由のタイムゾーンがなければシステム検出にフォールバックするが、`TZ`を直接参照しない。

```typescript
// 現在のコード (config.ts:294-296)
if (process.env.FIREX_TIMEZONE) {
  output.timezone = process.env.FIREX_TIMEZONE;
}
// TZ環境変数は参照されていない
```

### 問題2: LANG/LC_TIME環境変数の無視
**Location**: `src/presentation/date-formatter.ts:93`

date-fnsの`format()`呼び出しでロケールオプションを渡していない。既存の`src/shared/i18n.ts`で`LANG`環境変数を読んでいるが、日時フォーマットには使用されていない。

```typescript
// 現在のコード (date-formatter.ts:93)
const formatted = format(tzDate, options.pattern);
// ロケールが渡されていない
```

### 問題3: relativeフォーマットの未実装
**Location**: 該当コードなし

READMEには`--timestamp-format relative`の記載があるが、date-fnsの`formatDistanceToNow`や`formatRelative`を使用した実装が存在しない。

## Impact Assessment
- **Severity**: Medium
- **Scope**: タイムスタンプ表示機能の全ユーザー
- **Risk**: READMEとの乖離によるユーザー混乱、UNIX慣習からの逸脱

## Related Code
| ファイル | 行 | 問題 |
|---------|-----|------|
| `src/services/config.ts` | 291-296 | TZ未参照 |
| `src/services/output-options-resolver.ts` | 57-59 | TZフォールバックなし |
| `src/presentation/date-formatter.ts` | 93 | ロケール未使用 |
| `README.md` / `README-jp.md` | 複数箇所 | relative記載あり |

## Proposed Solution

### Option 1: 最小修正（TZ対応のみ）
- `config.ts`で`TZ`環境変数を`FIREX_TIMEZONE`より低い優先度で参照
- **優先順位**: CLI > FIREX_TIMEZONE > TZ > システム検出
- **Pros**: 変更範囲が小さい、UNIX慣習に準拠
- **Cons**: relative/ロケール問題は未解決

### Option 2: 完全対応（TZ + LOCALE + relative）
- TZ環境変数対応
- LANG/LC_TIMEによるロケール検出とdate-fnsロケール連携
- `relative`フォーマット実装（`formatDistanceToNow`使用）
- **Pros**: 完全なUNIX準拠、README通りの機能
- **Cons**: 実装工数大、date-fns localeパッケージ追加

### Option 3: TZ対応 + README修正
- TZ環境変数対応
- READMEから`relative`と`unix`を削除（実装に合わせる）
- **Pros**: 現実的な工数、一貫性確保
- **Cons**: 機能削減

### Recommended Approach
**Option 1 + READMEの暫定修正**を推奨。

1. `TZ`環境変数対応を実装
2. READMEの`relative`例にコメント追加（将来対応予定）
3. `relative`とロケール対応は別issueとして切り出し

## Dependencies
- `src/services/config.ts` - TZ読み込み追加
- `src/services/output-options-resolver.ts` - 優先順位変更なし（config経由で解決）
- `README.md` / `README-jp.md` - 修正または注記追加

## Testing Strategy
1. `TZ=Asia/Tokyo firex get ...` でタイムゾーン反映確認
2. `FIREX_TIMEZONE`と`TZ`の優先順位テスト
3. 既存テストの回帰確認
