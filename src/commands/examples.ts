/**
 * ExamplesCommand - Display usage examples
 */

import { Command } from '@oclif/core';
import { t, isJapanese } from '../shared/i18n';

interface UsageExample {
  title: string;
  command: string;
  description: string;
}

export class ExamplesCommand extends Command {
  static override description = t('cmd.examples.description');

  static override examples = [
    {
      command: '<%= config.bin %> examples',
      description: 'Show all usage examples',
    },
  ];

  /**
   * Get usage examples based on current locale
   */
  private getUsageExamples(): UsageExample[] {
    if (isJapanese()) {
      return [
        // Get command
        { title: 'ドキュメントの取得', command: 'firex get users/user123', description: '指定したドキュメントを取得して表示します' },
        { title: 'YAML形式で取得', command: 'firex get users/user123 --format=yaml', description: 'YAML形式でドキュメントを表示します' },
        { title: 'ドキュメントの監視', command: 'firex get users/user123 --watch', description: 'ドキュメントの変更をリアルタイムで監視します' },
        // Set command
        { title: 'ドキュメントの作成', command: "firex set users/user123 '{\"name\": \"Alice\", \"age\": 30}'", description: '新規ドキュメントを作成します（既存の場合は上書き）' },
        { title: 'ドキュメントの部分更新', command: "firex set users/user123 '{\"age\": 31}' --merge", description: '既存のデータを保持しながら特定のフィールドのみ更新します' },
        { title: 'ファイルからデータを読み込んで設定', command: 'firex set users/user123 --from-file=user.json', description: 'JSONファイルからデータを読み込んで設定します' },
        // Update command
        { title: '部分更新（updateコマンド）', command: "firex update users/user123 '{\"age\": 31}'", description: 'set --merge と同じ動作で部分更新します' },
        // Delete command
        { title: 'ドキュメントの削除', command: 'firex delete users/user123', description: '確認プロンプト後にドキュメントを削除します' },
        { title: 'コレクションの一括削除', command: 'firex delete users --recursive --yes', description: 'コレクション内の全ドキュメントを削除します' },
        // List command
        { title: 'コレクション一覧', command: 'firex list users', description: 'コレクション内のドキュメント一覧を表示します（デフォルト100件）' },
        { title: 'フィルター付きクエリ', command: 'firex list users --where="age>=18" --order-by="age:desc"', description: '条件を指定してドキュメントを検索します' },
        { title: '複数条件のクエリ', command: 'firex list posts --where="status==published" --where="author==alice"', description: '複数の条件（AND）でドキュメントを検索します' },
        { title: 'コレクションの監視', command: 'firex list users --watch', description: 'コレクションの変更をリアルタイムで監視します' },
        // Export command
        { title: 'コレクションのエクスポート', command: 'firex export users --output=users.json', description: 'コレクションをJSONファイルにエクスポートします' },
        { title: 'サブコレクション含むエクスポート', command: 'firex export users --output=backup.json --include-subcollections', description: 'サブコレクションを含めてエクスポートします' },
        // Import command
        { title: 'データのインポート', command: 'firex import backup.json', description: 'JSONファイルからFirestoreにインポートします' },
        { title: 'バッチサイズ指定インポート', command: 'firex import backup.json --batch-size=250', description: 'バッチサイズを指定してインポートします' },
        // Config command
        { title: '設定の表示', command: 'firex config --show', description: '現在有効な設定値を表示します' },
        // FieldValue examples
        { title: 'サーバータイムスタンプの設定', command: "firex set users/user123 '{\"createdAt\": {\"$fieldValue\": \"serverTimestamp\"}}'", description: 'サーバー側でタイムスタンプを自動設定します' },
        { title: 'カウンターのインクリメント', command: "firex update posts/post1 '{\"viewCount\": {\"$fieldValue\": \"increment\", \"operand\": 1}}'", description: '数値フィールドを増減します' },
        { title: '配列への要素追加', command: "firex update users/user123 '{\"tags\": {\"$fieldValue\": \"arrayUnion\", \"elements\": [\"premium\"]}}'", description: '配列に要素を追加します（重複は無視）' },
        { title: '配列から要素削除', command: "firex update users/user123 '{\"tags\": {\"$fieldValue\": \"arrayRemove\", \"elements\": [\"trial\"]}}'", description: '配列から要素を削除します' },
        { title: 'フィールドの削除', command: "firex update users/user123 '{\"obsoleteField\": {\"$fieldValue\": \"delete\"}}'", description: 'フィールドをドキュメントから削除します' },
        // $timestampValue example
        { title: '指定日時のタイムスタンプ設定', command: "firex set events/event1 '{\"startAt\": {\"$timestampValue\": \"2025-06-01T09:00:00Z\"}}'", description: 'ISO 8601文字列をFirestore Timestampとして保存します' },
        { title: 'タイムゾーン付きタイムスタンプ', command: "firex set events/event1 '{\"startAt\": {\"$timestampValue\": \"2025-06-01T18:00:00+09:00\"}}'", description: 'タイムゾーンオフセット付きのISO 8601文字列をTimestampとして保存' },
        // Timestamp display formatting examples
        { title: 'タイムゾーン指定で表示', command: 'firex get users/user123 --timezone=Asia/Tokyo', description: 'Timestampを指定タイムゾーンで表示します（IANA形式）' },
        { title: '日付フォーマットの指定', command: 'firex get users/user123 --date-format="yyyy-MM-dd HH:mm:ss"', description: '日時の表示形式をカスタマイズします' },
        { title: 'フォーマットとタイムゾーンの組み合わせ', command: 'firex list users --date-format="yyyy/MM/dd HH:mm" --timezone=America/New_York', description: '日付フォーマットとタイムゾーンを同時に指定' },
        { title: '日付フォーマット無効化', command: 'firex get users/user123 --no-date-format', description: '日付変換を無効化し、生のFirestore Timestampオブジェクトを表示' },
        { title: '全フォーマット無効化', command: 'firex get users/user123 --raw-output', description: 'Timestamp変換を含む全ての整形処理を無効化' },
      ];
    }
    // English
    return [
      // Get command
      { title: 'Get a document', command: 'firex get users/user123', description: 'Retrieve and display the specified document' },
      { title: 'Get in YAML format', command: 'firex get users/user123 --format=yaml', description: 'Display the document in YAML format' },
      { title: 'Watch a document', command: 'firex get users/user123 --watch', description: 'Monitor document changes in realtime' },
      // Set command
      { title: 'Create a document', command: "firex set users/user123 '{\"name\": \"Alice\", \"age\": 30}'", description: 'Create a new document (overwrites if exists)' },
      { title: 'Partial update', command: "firex set users/user123 '{\"age\": 31}' --merge", description: 'Update specific fields while preserving existing data' },
      { title: 'Set from file', command: 'firex set users/user123 --from-file=user.json', description: 'Read data from a JSON file and set it' },
      // Update command
      { title: 'Update command', command: "firex update users/user123 '{\"age\": 31}'", description: 'Same as set --merge for partial updates' },
      // Delete command
      { title: 'Delete a document', command: 'firex delete users/user123', description: 'Delete document after confirmation prompt' },
      { title: 'Bulk delete collection', command: 'firex delete users --recursive --yes', description: 'Delete all documents in a collection' },
      // List command
      { title: 'List collection', command: 'firex list users', description: 'Display documents in a collection (default: 100)' },
      { title: 'Query with filters', command: 'firex list users --where="age>=18" --order-by="age:desc"', description: 'Search documents with conditions' },
      { title: 'Multiple conditions', command: 'firex list posts --where="status==published" --where="author==alice"', description: 'Search documents with multiple AND conditions' },
      { title: 'Watch collection', command: 'firex list users --watch', description: 'Monitor collection changes in realtime' },
      // Export command
      { title: 'Export collection', command: 'firex export users --output=users.json', description: 'Export collection to a JSON file' },
      { title: 'Export with subcollections', command: 'firex export users --output=backup.json --include-subcollections', description: 'Export including subcollections' },
      // Import command
      { title: 'Import data', command: 'firex import backup.json', description: 'Import from a JSON file to Firestore' },
      { title: 'Import with batch size', command: 'firex import backup.json --batch-size=250', description: 'Import with specified batch size' },
      // Config command
      { title: 'Show configuration', command: 'firex config --show', description: 'Display current configuration values' },
      // FieldValue examples
      { title: 'Set server timestamp', command: "firex set users/user123 '{\"createdAt\": {\"$fieldValue\": \"serverTimestamp\"}}'", description: 'Set timestamp automatically on server side' },
      { title: 'Increment counter', command: "firex update posts/post1 '{\"viewCount\": {\"$fieldValue\": \"increment\", \"operand\": 1}}'", description: 'Increment or decrement a numeric field' },
      { title: 'Add to array', command: "firex update users/user123 '{\"tags\": {\"$fieldValue\": \"arrayUnion\", \"elements\": [\"premium\"]}}'", description: 'Add elements to array (duplicates ignored)' },
      { title: 'Remove from array', command: "firex update users/user123 '{\"tags\": {\"$fieldValue\": \"arrayRemove\", \"elements\": [\"trial\"]}}'", description: 'Remove elements from array' },
      { title: 'Delete a field', command: "firex update users/user123 '{\"obsoleteField\": {\"$fieldValue\": \"delete\"}}'", description: 'Delete a field from the document' },
      // $timestampValue example
      { title: 'Set specific timestamp', command: "firex set events/event1 '{\"startAt\": {\"$timestampValue\": \"2025-06-01T09:00:00Z\"}}'", description: 'Store an ISO 8601 string as a Firestore Timestamp' },
      { title: 'Timestamp with timezone offset', command: "firex set events/event1 '{\"startAt\": {\"$timestampValue\": \"2025-06-01T18:00:00+09:00\"}}'", description: 'Store ISO 8601 with timezone offset as a Firestore Timestamp' },
      // Timestamp display formatting examples
      { title: 'Display with timezone', command: 'firex get users/user123 --timezone=Asia/Tokyo', description: 'Display timestamps in a specific timezone (IANA format)' },
      { title: 'Custom date format', command: 'firex get users/user123 --date-format="yyyy-MM-dd HH:mm:ss"', description: 'Customize the date/time display format' },
      { title: 'Format + timezone combined', command: 'firex list users --date-format="yyyy/MM/dd HH:mm" --timezone=America/New_York', description: 'Combine date format and timezone settings' },
      { title: 'Disable date formatting', command: 'firex get users/user123 --no-date-format', description: 'Disable date conversion, show raw Firestore Timestamp objects' },
      { title: 'Disable all formatting', command: 'firex get users/user123 --raw-output', description: 'Disable all formatting including timestamp conversion' },
    ];
  }

  async run(): Promise<void> {
    console.log(`${t('msg.examplesTitle')}\n`);
    console.log('='.repeat(60) + '\n');

    for (const example of this.getUsageExamples()) {
      console.log(`# ${example.title}`);
      console.log(`  ${example.description}`);
      console.log(`  $ ${example.command}`);
      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`\n${t('msg.examplesFooter')}`);
    console.log(t('msg.examplesHelpHint'));
  }
}
