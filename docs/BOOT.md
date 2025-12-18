以下のアプリケーションを作成したいです

- npxで呼び出せるCLIツール
- firestoreへのCURD操作が可能
- フォルダ毎の設定、環境変数での設定ファイル指定に対応
- 危険な操作にはconfirmを要求する（deleteAllなど)が、設定ファイルや環境変数で回避可能
- application default credentials or サービスアカウントファイルで動作する(Firebase Admin)
- watchモードでは、documentまたはcollectionをonSnapshotして、変更があったら標準出力に逐次出力される

質問は？

# feature

- mcp serverとして動作可能
- すべての操作はログファイルに自動的に出力される。update/delete処理はreadしてログに保存してから処理 -> 処理結果をreadしてさらに保存
- --user [uid] でAdmin SDKではなくUserのcredentialsで動作可能(ログイン画面が出る, or EMAIL/PASSWORD指定)
- zodスキーマを与えるとバリデーションチェック
- バッチアップデート(query -> updateのパック)
- 自然言語クエリ(claude経由)が可能
  - steeringファイルを読む, firestore-scheme.mdなどがあればそれを参照する
  - 現状コードからfirestore-scheme.mdを生成してくれる
