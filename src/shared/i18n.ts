/**
 * Internationalization (i18n) module for firex CLI
 * Provides locale detection and message translation
 */

export type SupportedLocale = 'ja' | 'en';

/**
 * Message keys for all translatable strings
 */
export interface Messages {
  // Command descriptions
  'cmd.get.description': string;
  'cmd.set.description': string;
  'cmd.update.description': string;
  'cmd.delete.description': string;
  'cmd.list.description': string;
  'cmd.collections.description': string;
  'cmd.export.description': string;
  'cmd.import.description': string;
  'cmd.config.description': string;
  'cmd.examples.description': string;

  // Argument descriptions
  'arg.documentPath': string;
  'arg.documentPathOptional': string;
  'arg.collectionPath': string;
  'arg.data': string;
  'arg.file': string;
  'arg.collection': string;
  'arg.path': string;

  // Flag descriptions
  'flag.verbose': string;
  'flag.projectId': string;
  'flag.credentialPath': string;
  'flag.format': string;
  'flag.profile': string;
  'flag.watch': string;
  'flag.showInitial': string;
  'flag.merge': string;
  'flag.fromFile': string;
  'flag.recursive': string;
  'flag.yes': string;
  'flag.where': string;
  'flag.orderBy': string;
  'flag.limit': string;
  'flag.output': string;
  'flag.includeSubcollections': string;
  'flag.batchSize': string;
  'flag.show': string;
  'flag.quiet': string;
  'flag.json': string;
  'flag.yaml': string;
  'flag.table': string;
  'flag.toon': string;

  // Success messages
  'msg.documentCreated': string;
  'msg.documentUpdated': string;
  'msg.documentDeleted': string;
  'msg.documentsDeleted': string;
  'msg.exportComplete': string;
  'msg.importComplete': string;

  // Error messages
  'err.documentNotFound': string;
  'err.invalidPath': string;
  'err.invalidJson': string;
  'err.authFailed': string;
  'err.permissionDenied': string;

  // Prompts
  'prompt.confirmDelete': string;
  'prompt.confirmDeleteCollection': string;

  // Export/Import runtime messages
  'msg.exporting': string;
  'msg.exportingWithSub': string;
  'msg.exportProgress': string;
  'msg.exportedDocuments': string;
  'msg.outputFile': string;
  'msg.importing': string;
  'msg.importProgress': string;
  'msg.importSuccess': string;
  'msg.importSkipped': string;
  'msg.importFailed': string;
  'msg.batchCommitError': string;
  'msg.batchPartialSuccess': string;
  'msg.batchRetryHint': string;
  'msg.validationErrorLine': string;
  'msg.currentConfig': string;
  'msg.examplesTitle': string;
  'msg.examplesFooter': string;
  'msg.examplesHelpHint': string;

  // Validation errors
  'err.invalidCollectionPath': string;
  'err.invalidBatchSize': string;

  // Collections command messages
  'msg.collectionsFound': string;
  'msg.noCollectionsFound': string;
  'msg.noSubcollectionsFound': string;
  'err.documentNotFoundForSubcollections': string;
}

/**
 * Japanese translations
 */
const jaMessages: Messages = {
  // Command descriptions
  'cmd.get.description': 'Firestoreドキュメントを取得して表示する',
  'cmd.set.description': 'Firestoreドキュメントを作成または上書きする',
  'cmd.update.description': 'Firestoreドキュメントを部分更新する (set --merge のエイリアス)',
  'cmd.delete.description': 'Firestoreドキュメントまたはコレクションを削除する',
  'cmd.list.description': 'コレクション内のドキュメント一覧を取得する',
  'cmd.collections.description': 'コレクション一覧を表示する',
  'cmd.export.description': 'Firestoreコレクションをエクスポートする',
  'cmd.import.description': 'JSONファイルからFirestoreにインポートする',
  'cmd.config.description': '設定を表示する',
  'cmd.examples.description': 'よくある使用例を表示する',

  // Argument descriptions
  'arg.documentPath': 'ドキュメントパス (例: collection/document)',
  'arg.documentPathOptional': 'サブコレクションを取得するドキュメントパス（省略時はルートコレクション）',
  'arg.collectionPath': 'コレクションパス (例: users, posts)',
  'arg.data': 'JSON形式のドキュメントデータ',
  'arg.file': 'インポートするJSONファイルパス',
  'arg.collection': 'エクスポートするコレクションパス',
  'arg.path': '削除するドキュメントまたはコレクションのパス',

  // Flag descriptions
  'flag.verbose': '詳細な出力を表示する',
  'flag.projectId': 'Firebase プロジェクトID',
  'flag.credentialPath': 'サービスアカウントキーファイルのパス',
  'flag.format': '出力形式 (json, yaml, table)',
  'flag.profile': '使用する設定プロファイル',
  'flag.watch': 'リアルタイムで変更を監視する',
  'flag.showInitial': '--watchモード時に初期データを表示する',
  'flag.merge': '既存データを保持して部分更新する',
  'flag.fromFile': 'JSONファイルからデータを読み込む',
  'flag.recursive': 'コレクション内の全ドキュメントを再帰的に削除する',
  'flag.yes': '確認プロンプトをスキップする',
  'flag.where': 'フィルター条件 (例: age>=18, status==active)',
  'flag.orderBy': 'ソート順 (例: name:asc, age:desc)',
  'flag.limit': '取得件数制限 (デフォルト: 100)',
  'flag.output': '出力ファイルパス',
  'flag.includeSubcollections': 'サブコレクションを含める',
  'flag.batchSize': 'バッチサイズ (デフォルト: 500)',
  'flag.show': '現在の設定を表示する',
  'flag.quiet': 'メタ情報を非表示にして純粋なデータのみ出力',
  'flag.json': 'JSON形式で出力 (--format=json のエイリアス)',
  'flag.yaml': 'YAML形式で出力 (--format=yaml のエイリアス)',
  'flag.table': 'テーブル形式で出力 (--format=table のエイリアス)',
  'flag.toon': 'TOON形式で出力 (--format=toon のエイリアス)',

  // Success messages
  'msg.documentCreated': 'ドキュメントを作成しました',
  'msg.documentUpdated': 'ドキュメントを更新しました',
  'msg.documentDeleted': 'ドキュメントを削除しました',
  'msg.documentsDeleted': '件のドキュメントを削除しました',
  'msg.exportComplete': 'エクスポートが完了しました',
  'msg.importComplete': 'インポートが完了しました',

  // Error messages
  'err.documentNotFound': 'ドキュメントが見つかりません',
  'err.invalidPath': '無効なパスです',
  'err.invalidJson': 'JSONの形式が不正です',
  'err.authFailed': '認証に失敗しました',
  'err.permissionDenied': '権限がありません',

  // Prompts
  'prompt.confirmDelete': 'を削除しますか？',
  'prompt.confirmDeleteCollection': 'コレクション内の全ドキュメントを削除しますか？',

  // Export/Import runtime messages
  'msg.exporting': 'コレクションをエクスポートしています',
  'msg.exportingWithSub': '(サブコレクションを含む)',
  'msg.exportProgress': 'エクスポート進捗',
  'msg.exportedDocuments': '件のドキュメントをエクスポートしました',
  'msg.outputFile': '出力先',
  'msg.importing': 'ファイルからインポートしています',
  'msg.importProgress': 'インポート進捗',
  'msg.importSuccess': '成功',
  'msg.importSkipped': 'スキップ',
  'msg.importFailed': '失敗',
  'msg.batchCommitError': 'バッチコミットエラー',
  'msg.batchPartialSuccess': '件は正常にインポートされました',
  'msg.batchRetryHint': '再度インポートを実行すると、進捗ファイルから続行できます',
  'msg.validationErrorLine': 'バリデーションエラー (行',
  'msg.currentConfig': '現在の設定',
  'msg.examplesTitle': 'firex 使用例',
  'msg.examplesFooter': '詳細なヘルプは各コマンドで --help を使用してください。',
  'msg.examplesHelpHint': '例: firex get --help',

  // Validation errors
  'err.invalidCollectionPath': 'コレクションパスを指定してください（奇数のセグメント数が必要です）',
  'err.invalidBatchSize': 'バッチサイズは1から500の範囲で指定してください',

  // Collections command messages
  'msg.collectionsFound': '件のコレクションが見つかりました',
  'msg.noCollectionsFound': 'コレクションが見つかりません',
  'msg.noSubcollectionsFound': 'サブコレクションが見つかりません',
  'err.documentNotFoundForSubcollections': 'ドキュメントが見つかりません。サブコレクションを取得できません',
};

/**
 * English translations
 */
const enMessages: Messages = {
  // Command descriptions
  'cmd.get.description': 'Get and display a Firestore document',
  'cmd.set.description': 'Create or overwrite a Firestore document',
  'cmd.update.description': 'Partially update a Firestore document (alias for set --merge)',
  'cmd.delete.description': 'Delete a Firestore document or collection',
  'cmd.list.description': 'List documents in a collection',
  'cmd.collections.description': 'List collections',
  'cmd.export.description': 'Export a Firestore collection',
  'cmd.import.description': 'Import data from a JSON file to Firestore',
  'cmd.config.description': 'Display configuration',
  'cmd.examples.description': 'Show usage examples',

  // Argument descriptions
  'arg.documentPath': 'Document path (e.g., collection/document)',
  'arg.documentPathOptional': 'Document path for subcollections (omit for root collections)',
  'arg.collectionPath': 'Collection path (e.g., users, posts)',
  'arg.data': 'Document data in JSON format',
  'arg.file': 'Path to JSON file to import',
  'arg.collection': 'Collection path to export',
  'arg.path': 'Path to document or collection to delete',

  // Flag descriptions
  'flag.verbose': 'Enable verbose mode for detailed output',
  'flag.projectId': 'Firebase Project ID',
  'flag.credentialPath': 'Path to service account key file',
  'flag.format': 'Output format (json, yaml, table)',
  'flag.profile': 'Configuration profile to use',
  'flag.watch': 'Watch for realtime changes',
  'flag.showInitial': 'Show initial data in --watch mode',
  'flag.merge': 'Merge with existing data instead of overwriting',
  'flag.fromFile': 'Read data from a JSON file',
  'flag.recursive': 'Recursively delete all documents in collection',
  'flag.yes': 'Skip confirmation prompt',
  'flag.where': 'Filter condition (e.g., age>=18, status==active)',
  'flag.orderBy': 'Sort order (e.g., name:asc, age:desc)',
  'flag.limit': 'Maximum number of documents (default: 100)',
  'flag.output': 'Output file path',
  'flag.includeSubcollections': 'Include subcollections',
  'flag.batchSize': 'Batch size (default: 500)',
  'flag.show': 'Show current configuration',
  'flag.quiet': 'Suppress meta information and output only pure data',
  'flag.json': 'Output in JSON format (alias for --format=json)',
  'flag.yaml': 'Output in YAML format (alias for --format=yaml)',
  'flag.table': 'Output in table format (alias for --format=table)',
  'flag.toon': 'Output in TOON format (alias for --format=toon)',

  // Success messages
  'msg.documentCreated': 'Document created',
  'msg.documentUpdated': 'Document updated',
  'msg.documentDeleted': 'Document deleted',
  'msg.documentsDeleted': 'documents deleted',
  'msg.exportComplete': 'Export complete',
  'msg.importComplete': 'Import complete',

  // Error messages
  'err.documentNotFound': 'Document not found',
  'err.invalidPath': 'Invalid path',
  'err.invalidJson': 'Invalid JSON format',
  'err.authFailed': 'Authentication failed',
  'err.permissionDenied': 'Permission denied',

  // Prompts
  'prompt.confirmDelete': 'Are you sure you want to delete',
  'prompt.confirmDeleteCollection': 'Delete all documents in collection?',

  // Export/Import runtime messages
  'msg.exporting': 'Exporting collection',
  'msg.exportingWithSub': '(including subcollections)',
  'msg.exportProgress': 'Export progress',
  'msg.exportedDocuments': 'documents exported',
  'msg.outputFile': 'Output file',
  'msg.importing': 'Importing from file',
  'msg.importProgress': 'Import progress',
  'msg.importSuccess': 'Success',
  'msg.importSkipped': 'Skipped',
  'msg.importFailed': 'Failed',
  'msg.batchCommitError': 'Batch commit error',
  'msg.batchPartialSuccess': 'documents were successfully imported',
  'msg.batchRetryHint': 'Re-run import to resume from progress file',
  'msg.validationErrorLine': 'Validation error (line',
  'msg.currentConfig': 'Current configuration',
  'msg.examplesTitle': 'firex Usage Examples',
  'msg.examplesFooter': 'For detailed help, use --help with each command.',
  'msg.examplesHelpHint': 'Example: firex get --help',

  // Validation errors
  'err.invalidCollectionPath': 'Please specify a collection path (odd number of segments required)',
  'err.invalidBatchSize': 'Batch size must be between 1 and 500',

  // Collections command messages
  'msg.collectionsFound': 'collection(s) found',
  'msg.noCollectionsFound': 'No collections found',
  'msg.noSubcollectionsFound': 'No subcollections found',
  'err.documentNotFoundForSubcollections': 'Document not found. Cannot retrieve subcollections',
};

const messagesByLocale: Record<SupportedLocale, Messages> = {
  ja: jaMessages,
  en: enMessages,
};

/**
 * Detect user's locale from environment
 * Checks LANG, LC_ALL, LC_MESSAGES environment variables
 */
export function detectLocale(): SupportedLocale {
  const envLocale =
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    '';

  // Check if locale starts with 'ja' (e.g., ja_JP.UTF-8, ja_JP, ja)
  if (envLocale.toLowerCase().startsWith('ja')) {
    return 'ja';
  }

  return 'en';
}

let currentLocale: SupportedLocale = detectLocale();

/**
 * Get current locale
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Set locale explicitly (useful for testing)
 */
export function setLocale(locale: SupportedLocale): void {
  currentLocale = locale;
}

/**
 * Get translated message by key
 */
export function t(key: keyof Messages): string {
  return messagesByLocale[currentLocale][key];
}

/**
 * Get all messages for current locale
 */
export function getMessages(): Messages {
  return messagesByLocale[currentLocale];
}

/**
 * Check if current locale is Japanese
 */
export function isJapanese(): boolean {
  return currentLocale === 'ja';
}
