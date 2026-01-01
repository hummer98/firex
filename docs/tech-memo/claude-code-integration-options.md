# Claude Code 統合オプション調査レポート

## 概要

firexをClaude Codeと統合する方法として、現在のMCPサーバー以外の選択肢（Skills、Plugins/Extensions）について調査した結果をまとめる。

## 調査日

2025年12月26日

---

## 1. Claude Code Skills

### 1.1 Skillsとは

Agent Skillsは、Claude Codeの機能を拡張するモジュール式の仕組み。`SKILL.md`ファイルを含むディレクトリで構成され、指示、スクリプト、リソースを整理して提供できる。

**特徴:**
- **Model-invoked**: ユーザーが明示的に呼び出すのではなく、Claudeがコンテキストに基づいて自動的に使用を判断
- **Progressive Disclosure**: 必要な情報を段階的に開示する設計原則
- Claude.ai、Claude Code CLI、APIの3つの環境で動作

### 1.2 Skillの作成方法

#### ファイル構造

```
skill-name/
├── SKILL.md (必須)
├── reference.md (任意)
├── examples.md (任意)
├── scripts/
│   └── helper.py (任意)
└── templates/
    └── template.txt (任意)
```

#### SKILL.mdの形式

```yaml
---
name: skill-name
description: スキルの説明（何をするか、いつ使うか）
allowed-tools: Read, Grep, Glob  # 任意: 使用可能なツールを制限
---

# Skill Name

## Instructions
Claudeへの指示を記述

## Examples
使用例を記述
```

#### 配置場所

| スコープ | パス | 用途 |
|---------|------|------|
| Personal | `~/.claude/skills/` | 個人用（全プロジェクト共通） |
| Project | `.claude/skills/` | チーム共有（git管理） |
| Plugin | `plugin-name/skills/` | プラグイン経由で配布 |

### 1.3 Skillでのスクリプト実行

Skillsは`scripts/`ディレクトリにスクリプトを含めることができ、Claudeがそれを実行できる。

#### スクリプト付きSkillの例

```
firex-skill/
├── SKILL.md
├── scripts/
│   ├── query.sh
│   └── export.py
└── examples/
    └── queries.md
```

**SKILL.md:**

```yaml
---
name: firex-firestore
description: Firestoreデータの操作。コレクションのクエリ、ドキュメントの取得・更新時に使用。
allowed-tools: Bash, Read, Write
---

# firex Firestore Operations

## クエリ実行

```bash
npx @hummer98/firex list users --limit 10
```

## ドキュメント取得

```bash
npx @hummer98/firex get users/user123
```

## エクスポート

```bash
npx @hummer98/firex export users --format json > users.json
```
```

### 1.4 firexをSkillとして提供する可能性

#### 結論: **技術的には可能だが、MCPの方が適切**

**Skill + スクリプト方式:**

| 観点 | 評価 |
|------|------|
| 技術的実現性 | ◎ 可能（Bash経由でfirex CLI実行） |
| セットアップ | ◎ ファイル配置のみ（npm installは別途必要） |
| ツール認識 | △ Claudeが指示を読んで判断 |
| エラーハンドリング | △ CLIの出力をパース |
| 型安全性 | × なし |

**MCP方式との比較:**

| 観点 | Skill + Script | MCP |
|------|----------------|-----|
| ツール定義 | 暗黙的（指示ベース） | 明示的（JSON Schema） |
| パラメータ検証 | なし | Zodスキーマで検証 |
| エラー通知 | CLI出力のパース | 構造化エラー |
| 自動補完 | なし | ツール定義から可能 |
| 依存関係 | npm install必要 | npm install必要 |

**Skillが適するケース:**
- MCPツールの使い方ガイド
- ワークフローの標準化
- ベストプラクティスの共有
- 軽量な統合（MCPサーバー起動が不要）

**MCPが適するケース:**
- 頻繁なツール呼び出し
- 型安全性が重要
- エラーハンドリングの信頼性
- IDE統合での自動補完

#### 代替案: MCPと組み合わせたSkill

firexのMCPサーバーは維持しつつ、使い方ガイドとしてSkillを追加提供する選択肢:

```yaml
---
name: firex-guide
description: Firestoreデータの操作ガイド。Firestoreのクエリ、データ操作時に使用。
---

# firex Usage Guide

## クエリの書き方
...

## ベストプラクティス
...
```

#### Skill単体での提供

MCPなしでSkill + スクリプトのみで提供する場合:

```yaml
---
name: firex-firestore
description: Firestoreデータベース操作。クエリ、CRUD、エクスポート/インポート時に使用。
allowed-tools: Bash, Read, Write
---

# firex Firestore CLI

firex CLIを使用してFirestoreを操作する。

## 前提条件

```bash
npm install -g @hummer98/firex
```

## 操作例

### コレクション一覧
```bash
firex collections
```

### ドキュメント取得
```bash
firex get users/user123
```

### クエリ実行
```bash
firex list users --where "status == active" --limit 10
```

### データエクスポート
```bash
firex export users --format json
```
```

**この方式のメリット:**
- MCPサーバーの起動が不要
- 設定ファイル（.mcp.json）が不要
- シンプルな統合

**この方式のデメリット:**
- ツールとして明示的に認識されない
- Claudeの判断に依存（指示を読むかどうか）
- エラーハンドリングが難しい

**参考リンク:**
- [Agent Skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [How to create custom Skills | Claude Help Center](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)
- [Introducing Agent Skills | Claude](https://claude.com/blog/skills)

---

## 2. Claude Code Plugins (Extensions)

### 2.1 Pluginsとは

**重要: 「Extensions」という正式機能は存在しない。** 正しくは「Plugins」。

Pluginsは、Claude Codeの拡張機能をパッケージ化・配布するための仕組み。以下の4つの拡張ポイントをバンドルできる:

1. **Slash Commands** - カスタムショートカット
2. **Subagents** - 専門的な開発タスク用エージェント
3. **MCP Servers** - ツールとデータソースへの接続
4. **Hooks** - ワークフローの特定ポイントでのカスタマイズ

### 2.2 Pluginの作成方法

#### ファイル構造

```
my-plugin/
├── .claude-plugin/
│   ├── plugin.json (必須)
│   └── marketplace.json (マーケットプレイス用)
├── commands/
│   └── my-command.md
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── agents/
│   └── my-agent.md
└── hooks/
    └── pre-commit.sh
```

#### plugin.jsonの形式

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "namespace": "my-plugin",
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"]
      }
    }
  }
}
```

### 2.3 配布方法

1. **直接インストール**
   ```
   /plugin install github:user/repo
   ```

2. **マーケットプレイス経由**
   - `marketplace.json`を含むリポジトリをホスト
   - `/plugin marketplace add user-or-org/repo-name`

### 2.4 firexをPluginとして提供する可能性

#### 結論: **有力な選択肢**

**メリット:**

1. **MCPサーバーをバンドル可能**
   - 既存のfirex MCPサーバーをそのまま含められる
   - インストールが簡単になる

2. **追加の拡張ポイント**
   - Slash Commands: `/firex:query`, `/firex:export`などのショートカット
   - Skills: 使い方ガイドの自動読み込み
   - Hooks: コミット前のFirestore検証など

3. **配布の容易さ**
   - GitHubリポジトリから直接インストール可能
   - バージョン管理が容易

4. **ユーザー体験の向上**
   - 現在: ユーザーが`.mcp.json`を手動設定
   - Plugin化後: `/plugin install github:hummer98/firex`一発

#### 実装案

```
firex/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── commands/
│   ├── query.md          # /firex:query コマンド
│   └── export.md         # /firex:export コマンド
├── skills/
│   └── firestore-guide/
│       └── SKILL.md      # Firestore操作ガイド
└── ... (既存のfirexコード)
```

**plugin.json例:**

```json
{
  "name": "firex",
  "version": "0.6.1",
  "description": "Firestore CLI and MCP integration for Claude Code",
  "namespace": "firex",
  "mcp": {
    "servers": {
      "firex": {
        "command": "npx",
        "args": ["@hummer98/firex", "mcp"]
      }
    }
  }
}
```

**参考リンク:**
- [Customize Claude Code with plugins | Claude](https://claude.com/blog/claude-code-plugins)
- [Claude Code VS Code extension: A complete guide in 2025](https://www.eesel.ai/blog/claude-code-vs-code-extension)

---

## 3. 比較表

| 観点 | MCP Server (現状) | Skill + Script | Plugin |
|------|------------------|----------------|--------|
| ツール機能提供 | ◎ 直接提供 | ○ Bash経由 | ◎ MCPをバンドル |
| インストールの容易さ | △ 手動設定 | ○ ファイル配置 | ◎ コマンド一発 |
| 配布方法 | npm | git/plugin | git/marketplace |
| 追加機能 | - | ガイド・指示 | コマンド/エージェント/Hook |
| 型安全性 | ◎ JSON Schema | × なし | ◎ MCPから継承 |
| エラーハンドリング | ◎ 構造化 | △ CLI出力パース | ◎ MCPから継承 |
| 保守コスト | 低 | 低 | 中 |
| ユーザー体験 | 普通 | 普通 | 良好 |

---

## 4. 推奨事項

### 短期（現状維持）

現在のMCPサーバー提供方式は適切。MCPはツール機能を提供する正しい方法であり、Skill化は不適切。

### 中期（Plugin化の検討）

firexをClaude Code Pluginとして再パッケージすることを推奨:

1. **インストールの簡易化**
   - 現在: `.mcp.json`の手動編集が必要
   - Plugin化後: `/plugin install github:hummer98/firex`

2. **追加価値の提供**
   - `/firex:query`などのSlash Commands
   - Firestore操作のベストプラクティスSkill
   - 必要に応じてHooksやSubagents

3. **マーケットプレイス公開**
   - 発見可能性の向上
   - ユーザー基盤の拡大

### 実装優先度

1. **Phase 1**: Pluginの基本構造追加（plugin.json、MCPバンドル）
2. **Phase 2**: Slash Commands追加（よく使う操作のショートカット）
3. **Phase 3**: Skills追加（使い方ガイド）
4. **Phase 4**: マーケットプレイス公開

---

## 5. 結論

| 方式 | 推奨度 | 理由 |
|------|--------|------|
| Skill + Script | △ | 技術的に可能だが、型安全性・エラーハンドリングに課題 |
| MCP継続 | ✅ | ツール機能提供に最適、型安全 |
| Plugin化 | ✅✅ | MCPをバンドル + UX向上 |

### 方式ごとの使い分け

**Skill + Script方式が適するケース:**
- 軽量な統合が求められる場合
- MCPサーバーの常時起動を避けたい場合
- シンプルな操作のみ（get, list程度）

**MCP方式が適するケース:**
- 頻繁なFirestore操作
- 型安全性・信頼性が重要
- IDE連携での自動補完が欲しい

**Plugin方式が適するケース:**
- 上記MCPのメリット + インストールの簡易化
- Slash Commandsなど追加価値の提供
- マーケットプレイス公開による認知度向上

### 最終推奨

**MCPサーバーをPlugin内にバンドルする形式で提供。** これにより:
- 既存のMCP機能を維持（型安全性、構造化エラー）
- インストール・設定の簡易化
- Slash Commands等の追加価値提供

が可能になる。

**補足**: Skill単体での提供も選択肢として残しておく価値はある。MCPサーバーを起動したくないユーザー向けの軽量オプションとして、Skill版も並行して提供することを検討できる。
