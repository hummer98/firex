# Response to Document Review #1

**Feature**: fieldvalue-support
**Review Date**: 2026-01-01
**Reply Date**: 2026-01-01

---

## Response Summary

| Severity | Issues | Fix Required | No Fix Needed | Needs Discussion |
| -------- | ------ | ------------ | ------------- | ---------------- |
| Critical | 0      | 0            | 0             | 0                |
| Warning  | 3      | 2            | 1             | 0                |
| Info     | 4      | 1            | 3             | 0                |

---

## Response to Warnings

### W1: 最大再帰深度の明確化

**Issue**: research.md で「深いネストでのスタックオーバーフローリスク」が言及されているが、design.md では「実用上問題なし」とのみ記載。最大再帰深度の制限を設計に明記することを推奨。

**Judgment**: **Fix Required** ✅

**Evidence**:
research.md で「Follow-up: 最大深度の制限検討」と明記されており、設計段階で具体的な制限値を定義すべき。実装時の混乱を避けるため。

**Action Items**:
- design.md の Performance & Scalability セクションに最大再帰深度（100レベル）を明記
- 制限超過時の動作（エラー返却）を定義

---

### W2: ドキュメント更新タスクの追加

**Issue**: 要件 7.1-7.3 でヘルプ/スキーマ/examples の更新が定義されているが、README.md や CHANGELOG.md の更新タスクが明示されていない。

**Judgment**: **No Fix Needed** ❌

**Evidence**:
firex プロジェクトでは README.md / CHANGELOG.md の更新は通常リリース時に行われ、機能実装タスクには含めない運用となっている。要件 7.1-7.3 で定義されているヘルプ・スキーマ・examples の更新で開発者ドキュメントとしては十分。リリースノート作成は別プロセス。

---

### W3: set（非 merge）での delete 使用時の動作明確化

**Issue**: set コマンドで merge オプションなしで delete を使用した場合のエラーハンドリングが不明確。

**Judgment**: **Fix Required** ✅

**Evidence**:
design.md では「delete: 追加パラメータ不可、update または merge モードでのみ有効」と記載されているが、set（非 merge）で使用した場合の具体的な動作が定義されていない。Firebase SDK の仕様上、set（非 merge）で delete を使用しても技術的にはエラーにならないが、意味のない操作となる。

**Action Items**:
- design.md に set（非 merge）での delete 使用時の動作を明記
- 警告またはエラーとして処理するかを定義

---

## Response to Info (Low Priority)

| #    | Issue     | Judgment      | Reason         |
| ---- | --------- | ------------- | -------------- |
| I1 | Task 7 番号体系不整合 | Fix Required ✅ | 他タスクとの一貫性のため 7.1 形式に修正 |
| I2 | $fieldValue 衝突警告未定義 | No Fix Needed ❌ | research.md で「v1 では警告のみ」の方針が明記済み。v1 では実装せず、将来対応として記録 |
| I3 | examples コマンド存在未確認 | No Fix Needed ❌ | `src/commands/examples.ts` として存在確認済み |
| I4 | arrayUnion + serverTimestamp 制限 | No Fix Needed ❌ | research.md の Risks セクションで「ドキュメントで制限事項として明記」と記載済み。設計外の文書化事項 |

---

## Files to Modify

| File   | Changes   |
| ------ | --------- |
| design.md | 最大再帰深度（100レベル）の明記、set（非merge）+ delete の動作定義 |
| tasks.md | Task 7 を 7.1 形式に修正 |

---

## Conclusion

3件の Warning のうち 2 件、4件の Info のうち 1 件を修正対象と判断。

- **W1**: 最大再帰深度 100 を design.md に追記
- **W2**: README/CHANGELOG は別プロセスのため修正不要
- **W3**: set（非merge）+ delete の動作を design.md に追記
- **I1**: Task 7 の番号体系を修正

修正適用後、実装可能な状態となる。
