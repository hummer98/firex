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
  'cmd.doctor.description': string;

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
  'flag.timezone': string;
  'flag.dateFormat': string;
  'flag.rawOutput': string;
  'flag.noColor': string;
  'flag.noDateFormat': string;

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

  // FieldValue error messages
  'err.fieldValue.invalidType': string;
  'err.fieldValue.invalidOperand': string;
  'err.fieldValue.invalidElements': string;
  'err.fieldValue.invalidFormat': string;
  'err.fieldValue.atPath': string;
  'err.fieldValue.validTypes': string;
  'err.fieldValue.invalidTimestampValue': string;

  // === Error Handler Messages ===
  // Auth errors
  'err.handler.auth.invalid': string;
  'err.handler.auth.timeout': string;
  'err.handler.auth.retryHint': string;
  'err.handler.auth.projectNotFound': string;
  'err.handler.auth.checkProjectId': string;
  'err.handler.auth.permissionDenied': string;
  'err.handler.auth.checkPermission': string;
  'err.handler.auth.uninitialized': string;
  'err.handler.auth.generic': string;

  // Config errors
  'err.handler.config.fileNotFound': string;
  'err.handler.config.parseError': string;
  'err.handler.config.validationError': string;
  'err.handler.config.generic': string;

  // Firestore errors
  'err.handler.firestore.notFound': string;
  'err.handler.firestore.permissionDenied': string;
  'err.handler.firestore.checkRules': string;
  'err.handler.firestore.quotaExceeded': string;
  'err.handler.firestore.waitAndRetry': string;
  'err.handler.firestore.unavailable': string;
  'err.handler.firestore.checkConnection': string;
  'err.handler.firestore.timeout': string;
  'err.handler.firestore.retry': string;
  'err.handler.firestore.alreadyExists': string;
  'err.handler.firestore.invalidArgument': string;
  'err.handler.firestore.generic': string;

  // Validation errors
  'err.handler.validation.withField': string;
  'err.handler.validation.generic': string;

  // Stack trace
  'err.handler.stackTrace': string;

  // Help suggestions
  'err.handler.help.showHelp': string;
  'err.handler.help.configHelp': string;
  'err.handler.help.commandHelp': string;

  // === Doctor Service Messages ===
  // Progress messages
  'doctor.progress.starting': string;
  'doctor.progress.emulatorMode': string;
  'doctor.progress.checkingNode': string;
  'doctor.progress.checkingFirebaseCli': string;
  'doctor.progress.checkingAuth': string;
  'doctor.progress.resolvingProjectId': string;
  'doctor.progress.checkingEmulator': string;
  'doctor.progress.checkingFirestoreApi': string;
  'doctor.progress.checkingFirestoreAccess': string;
  'doctor.progress.checkingConfig': string;
  'doctor.progress.validatingSyntax': string;
  'doctor.progress.validatingSchema': string;
  'doctor.progress.validatingPaths': string;
  'doctor.progress.checkingBuild': string;
  'doctor.progress.complete': string;

  // Error messages
  'doctor.error.checkFailed': string;
  'doctor.error.executionFailed': string;
  'doctor.error.formatFailed': string;

  // Flag description
  'flag.doctor.json': string;

  // === Checker Module Messages ===
  // EnvironmentChecker - Node.js
  'doctor.check.node.installed': string;
  'doctor.check.node.minVersion': string;
  'doctor.check.node.belowMinimum': string;
  'doctor.check.node.currentVersion': string;
  'doctor.check.node.upgradeHint': string;

  // EnvironmentChecker - Firebase CLI
  'doctor.check.firebaseCli.installed': string;
  'doctor.check.firebaseCli.notInstalled': string;
  'doctor.check.firebaseCli.installHint': string;

  // EnvironmentChecker - Auth
  'doctor.check.auth.info': string;
  'doctor.check.auth.emulatorMode': string;
  'doctor.check.auth.serviceAccount': string;
  'doctor.check.auth.adc': string;
  'doctor.check.auth.fileNotFound': string;
  'doctor.check.auth.setCredentialHint': string;
  'doctor.check.auth.notFound': string;
  'doctor.check.auth.notConfigured': string;
  'doctor.check.auth.setupHint': string;

  // FirebaseChecker - .firebaserc
  'doctor.check.firebaserc.found': string;
  'doctor.check.firebaserc.noDefault': string;
  'doctor.check.firebaserc.useProjectHint': string;
  'doctor.check.firebaserc.parseError': string;
  'doctor.check.firebaserc.checkJsonHint': string;
  'doctor.check.firebaserc.notFound': string;
  'doctor.check.firebaserc.searchPath': string;
  'doctor.check.firebaserc.initHint': string;

  // FirebaseChecker - Firestore API
  'doctor.check.firestoreApi.enabled': string;
  'doctor.check.firestoreApi.notInitialized': string;
  'doctor.check.firestoreApi.checkProject': string;
  'doctor.check.firestoreApi.rerunHint': string;
  'doctor.check.firestoreApi.notEnabled': string;
  'doctor.check.firestoreApi.enableHint': string;
  'doctor.check.firestoreApi.checkFailed': string;
  'doctor.check.firestoreApi.consoleHint': string;

  // FirebaseChecker - Firestore Access
  'doctor.check.firestoreAccess.hasAccess': string;
  'doctor.check.firestoreAccess.collectionsFound': string;
  'doctor.check.firestoreAccess.noPermission': string;
  'doctor.check.firestoreAccess.grantRoleHint': string;
  'doctor.check.firestoreAccess.checkFailed': string;

  // FirebaseChecker - Emulator
  'doctor.check.emulator.connected': string;
  'doctor.check.emulator.httpStatus': string;
  'doctor.check.emulator.unexpectedResponse': string;
  'doctor.check.emulator.checkRunning': string;
  'doctor.check.emulator.connectionFailed': string;
  'doctor.check.emulator.host': string;
  'doctor.check.emulator.startHint': string;

  // FirebaseChecker - Project ID
  'doctor.check.projectId.resolved': string;
  'doctor.check.projectId.notResolved': string;
  'doctor.check.projectId.setupHint': string;
  'doctor.check.projectId.source.gcloudProject': string;
  'doctor.check.projectId.source.googleCloudProject': string;
  'doctor.check.projectId.source.firebaseProject': string;
  'doctor.check.projectId.source.firebaserc': string;
  'doctor.check.projectId.source.serviceAccount': string;
  'doctor.check.projectId.source.cliFlag': string;
  'doctor.check.projectId.source.unknown': string;

  // ConfigChecker - Config file
  'doctor.check.config.found': string;
  'doctor.check.config.filePath': string;
  'doctor.check.config.notFound': string;
  'doctor.check.config.usingDefaults': string;
  'doctor.check.config.searchPath': string;
  'doctor.check.config.createHint': string;

  // ConfigChecker - Syntax
  'doctor.check.syntax.yamlValid': string;
  'doctor.check.syntax.yamlError': string;
  'doctor.check.syntax.position': string;
  'doctor.check.syntax.yamlHint': string;
  'doctor.check.syntax.jsonValid': string;
  'doctor.check.syntax.jsonError': string;
  'doctor.check.syntax.jsonHint': string;

  // ConfigChecker - Schema
  'doctor.check.schema.valid': string;
  'doctor.check.schema.invalid': string;
  'doctor.check.schema.validFields': string;

  // ConfigChecker - Collection paths
  'doctor.check.paths.noTargets': string;
  'doctor.check.paths.allValid': string;
  'doctor.check.paths.invalid': string;
  'doctor.check.paths.invalidPaths': string;
  'doctor.check.paths.segmentHint': string;

  // BuildChecker
  'doctor.check.build.npmPackage': string;
  'doctor.check.build.skipped': string;
  'doctor.check.build.noDistDir': string;
  'doctor.check.build.expectedPath': string;
  'doctor.check.build.runBuildHint': string;
  'doctor.check.build.builtEnv': string;
  'doctor.check.build.noSrcDir': string;
  'doctor.check.build.rebuildRequired': string;
  'doctor.check.build.newestSource': string;
  'doctor.check.build.newestBuild': string;
  'doctor.check.build.upToDate': string;
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
  'cmd.doctor.description': 'firex CLI の実行環境と設定を診断する',

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
  'flag.timezone': '出力タイムゾーン (IANA形式、例: Asia/Tokyo)',
  'flag.dateFormat': '日時フォーマットパターン (例: yyyy-MM-dd)',
  'flag.rawOutput': '全整形処理を無効化',
  'flag.noColor': 'ANSIカラーコードを無効化',
  'flag.noDateFormat': '日付フォーマット変換のみを無効化',

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

  // FieldValue error messages
  'err.fieldValue.invalidType': 'FieldValueタイプが無効です',
  'err.fieldValue.invalidOperand': 'operandは数値である必要があります',
  'err.fieldValue.invalidElements': 'elementsは配列である必要があります',
  'err.fieldValue.invalidFormat': '$fieldValueオブジェクトの形式が不正です',
  'err.fieldValue.atPath': 'フィールド',
  'err.fieldValue.validTypes': '有効な値: serverTimestamp, increment, arrayUnion, arrayRemove, delete',
  'err.fieldValue.invalidTimestampValue': '$timestampValueは有効なISO 8601日時文字列である必要があります',

  // === Error Handler Messages ===
  // Auth errors
  'err.handler.auth.invalid': '認証エラー',
  'err.handler.auth.timeout': '接続タイムアウト',
  'err.handler.auth.retryHint': '再試行してください。',
  'err.handler.auth.projectNotFound': 'プロジェクトが見つかりません',
  'err.handler.auth.checkProjectId': 'プロジェクトIDを確認してください。',
  'err.handler.auth.permissionDenied': 'アクセス権限がありません',
  'err.handler.auth.checkPermission': 'サービスアカウントの権限を確認してください。',
  'err.handler.auth.uninitialized': '初期化されていません',
  'err.handler.auth.generic': '認証エラー',

  // Config errors
  'err.handler.config.fileNotFound': '設定ファイルが見つかりません',
  'err.handler.config.parseError': '設定ファイルの解析エラー',
  'err.handler.config.validationError': '設定値が不正です',
  'err.handler.config.generic': '設定エラー',

  // Firestore errors
  'err.handler.firestore.notFound': 'ドキュメントが見つかりません',
  'err.handler.firestore.permissionDenied': 'アクセス権限がありません',
  'err.handler.firestore.checkRules': 'Firestoreルールを確認してください。',
  'err.handler.firestore.quotaExceeded': 'クォータを超過しました',
  'err.handler.firestore.waitAndRetry': 'しばらく待ってから再試行してください。',
  'err.handler.firestore.unavailable': 'Firestoreが利用できません',
  'err.handler.firestore.checkConnection': '接続を確認して再試行してください。',
  'err.handler.firestore.timeout': 'リクエストがタイムアウトしました',
  'err.handler.firestore.retry': '再試行してください。',
  'err.handler.firestore.alreadyExists': 'ドキュメントは既に存在します',
  'err.handler.firestore.invalidArgument': '引数が無効です',
  'err.handler.firestore.generic': 'Firestoreエラー',

  // Validation errors
  'err.handler.validation.withField': 'バリデーションエラー ({field})',
  'err.handler.validation.generic': 'バリデーションエラー',

  // Stack trace
  'err.handler.stackTrace': 'スタックトレース',

  // Help suggestions
  'err.handler.help.showHelp': 'ヘルプを表示: firex --help',
  'err.handler.help.configHelp': '設定のヘルプを表示: firex config --help',
  'err.handler.help.commandHelp': 'ヘルプを表示: firex {command} --help',

  // === Doctor Service Messages ===
  // Progress messages
  'doctor.progress.starting': '診断を開始しています...',
  'doctor.progress.emulatorMode': 'エミュレータモード',
  'doctor.progress.checkingNode': 'Node.js バージョンを確認しています...',
  'doctor.progress.checkingFirebaseCli': 'Firebase CLI を確認しています...',
  'doctor.progress.checkingAuth': '認証状態を確認しています...',
  'doctor.progress.resolvingProjectId': 'プロジェクト ID を解決しています...',
  'doctor.progress.checkingEmulator': 'エミュレータ接続を確認しています...',
  'doctor.progress.checkingFirestoreApi': 'Firestore API を確認しています...',
  'doctor.progress.checkingFirestoreAccess': 'Firestore アクセス権を確認しています...',
  'doctor.progress.checkingConfig': '設定ファイルを確認しています...',
  'doctor.progress.validatingSyntax': '設定ファイルの構文を検証しています...',
  'doctor.progress.validatingSchema': '設定スキーマを検証しています...',
  'doctor.progress.validatingPaths': 'コレクションパスを検証しています...',
  'doctor.progress.checkingBuild': 'ビルド状態を確認しています...',
  'doctor.progress.complete': '診断が完了しました。',

  // Error messages
  'doctor.error.checkFailed': 'チェックに失敗しました',
  'doctor.error.executionFailed': '診断の実行に失敗しました',
  'doctor.error.formatFailed': '診断結果のフォーマットに失敗しました',

  // Flag description
  'flag.doctor.json': '診断結果を JSON 形式で出力する',

  // === Checker Module Messages ===
  // EnvironmentChecker - Node.js
  'doctor.check.node.installed': 'がインストールされています',
  'doctor.check.node.minVersion': '最小要件',
  'doctor.check.node.belowMinimum': 'は最小要件を満たしていません',
  'doctor.check.node.currentVersion': '現在のバージョン',
  'doctor.check.node.upgradeHint': '以上にアップグレードしてください。',

  // EnvironmentChecker - Firebase CLI
  'doctor.check.firebaseCli.installed': 'がインストールされています',
  'doctor.check.firebaseCli.notInstalled': 'Firebase CLI がインストールされていません',
  'doctor.check.firebaseCli.installHint': 'Firebase CLI をインストールしてください',

  // EnvironmentChecker - Auth
  'doctor.check.auth.info': '認証情報',
  'doctor.check.auth.emulatorMode': 'Emulator Mode',
  'doctor.check.auth.serviceAccount': 'Service Account',
  'doctor.check.auth.adc': 'Application Default Credentials (ADC)',
  'doctor.check.auth.fileNotFound': 'ファイルが見つかりません',
  'doctor.check.auth.setCredentialHint': 'GOOGLE_APPLICATION_CREDENTIALS に正しいパスを設定してください',
  'doctor.check.auth.notFound': '認証情報が見つかりません',
  'doctor.check.auth.notConfigured': 'サービスアカウントキーまたは ADC が設定されていません',
  'doctor.check.auth.setupHint': '認証を設定してください',

  // FirebaseChecker - .firebaserc
  'doctor.check.firebaserc.found': '.firebaserc が見つかりました',
  'doctor.check.firebaserc.noDefault': '.firebaserc にデフォルトプロジェクトが設定されていません',
  'doctor.check.firebaserc.useProjectHint': 'firebase use <project-id> を実行してデフォルトプロジェクトを設定してください',
  'doctor.check.firebaserc.parseError': '.firebaserc の解析に失敗しました',
  'doctor.check.firebaserc.checkJsonHint': '.firebaserc ファイルの JSON 形式を確認してください',
  'doctor.check.firebaserc.notFound': '.firebaserc ファイルが見つかりません',
  'doctor.check.firebaserc.searchPath': '検索開始パス',
  'doctor.check.firebaserc.initHint': 'Firebase プロジェクトを初期化してください: firebase init',

  // FirebaseChecker - Firestore API
  'doctor.check.firestoreApi.enabled': 'Firestore API が有効です',
  'doctor.check.firestoreApi.notInitialized': 'Firestore インスタンスが初期化されていません',
  'doctor.check.firestoreApi.checkProject': 'プロジェクト設定を確認してください',
  'doctor.check.firestoreApi.rerunHint': '認証設定後に再度診断を実行してください',
  'doctor.check.firestoreApi.notEnabled': 'Firestore API が有効化されていません',
  'doctor.check.firestoreApi.enableHint': 'Firestore API を有効化してください',
  'doctor.check.firestoreApi.checkFailed': 'Firestore API の確認に失敗しました',
  'doctor.check.firestoreApi.consoleHint': 'Google Cloud Console で Firestore の状態を確認してください',

  // FirebaseChecker - Firestore Access
  'doctor.check.firestoreAccess.hasAccess': 'Firestore へのアクセス権限があります',
  'doctor.check.firestoreAccess.collectionsFound': '検出されたコレクション数',
  'doctor.check.firestoreAccess.noPermission': 'Firestore へのアクセス権限がありません',
  'doctor.check.firestoreAccess.grantRoleHint': '必要な IAM ロールを付与してください',
  'doctor.check.firestoreAccess.checkFailed': 'Firestore アクセスの確認に失敗しました',

  // FirebaseChecker - Emulator
  'doctor.check.emulator.connected': 'Firestore エミュレータに接続できました',
  'doctor.check.emulator.httpStatus': 'HTTP ステータス',
  'doctor.check.emulator.unexpectedResponse': 'エミュレータからの応答が予期しないものでした',
  'doctor.check.emulator.checkRunning': 'エミュレータが正常に動作しているか確認してください',
  'doctor.check.emulator.connectionFailed': 'Firestore エミュレータに接続できません',
  'doctor.check.emulator.host': 'ホスト',
  'doctor.check.emulator.startHint': 'エミュレータを起動してください: firebase emulators:start --only firestore',

  // FirebaseChecker - Project ID
  'doctor.check.projectId.resolved': 'プロジェクト',
  'doctor.check.projectId.notResolved': 'プロジェクト ID を特定できません',
  'doctor.check.projectId.setupHint': 'プロジェクト ID を設定してください',
  'doctor.check.projectId.source.gcloudProject': 'GCLOUD_PROJECT 環境変数',
  'doctor.check.projectId.source.googleCloudProject': 'GOOGLE_CLOUD_PROJECT 環境変数',
  'doctor.check.projectId.source.firebaseProject': 'FIREBASE_PROJECT 環境変数',
  'doctor.check.projectId.source.firebaserc': '.firebaserc (default alias)',
  'doctor.check.projectId.source.serviceAccount': 'Service Account ファイル',
  'doctor.check.projectId.source.cliFlag': '--project-id オプション',
  'doctor.check.projectId.source.unknown': '不明',

  // ConfigChecker - Config file
  'doctor.check.config.found': '設定ファイルが見つかりました',
  'doctor.check.config.filePath': 'ファイルパス',
  'doctor.check.config.notFound': '設定ファイルが見つかりません - デフォルト設定で動作します',
  'doctor.check.config.usingDefaults': 'デフォルト設定を使用中',
  'doctor.check.config.searchPath': '検索パス',
  'doctor.check.config.createHint': '設定ファイルを作成する場合は .firex.yaml または .firex.json を作成してください',

  // ConfigChecker - Syntax
  'doctor.check.syntax.yamlValid': 'YAML 構文は有効です',
  'doctor.check.syntax.yamlError': 'YAML 構文エラー',
  'doctor.check.syntax.position': '位置',
  'doctor.check.syntax.yamlHint': 'YAML の構文を確認してください。インデントはスペースを使用してください。',
  'doctor.check.syntax.jsonValid': 'JSON 構文は有効です',
  'doctor.check.syntax.jsonError': 'JSON 構文エラー',
  'doctor.check.syntax.jsonHint': 'JSON の構文を確認してください。カンマやクォートを確認してください。',

  // ConfigChecker - Schema
  'doctor.check.schema.valid': '設定スキーマは有効です',
  'doctor.check.schema.invalid': '設定スキーマの検証に失敗しました',
  'doctor.check.schema.validFields': '有効なフィールド',

  // ConfigChecker - Collection paths
  'doctor.check.paths.noTargets': 'コレクションパスの検証: 対象なし',
  'doctor.check.paths.allValid': 'すべてのコレクションパスが有効です',
  'doctor.check.paths.invalid': 'コレクションパスの形式が不正です',
  'doctor.check.paths.invalidPaths': '無効なパス',
  'doctor.check.paths.segmentHint': 'コレクションパスは奇数のセグメント数である必要があります',

  // BuildChecker
  'doctor.check.build.npmPackage': 'npm パッケージとしてインストールされています',
  'doctor.check.build.skipped': 'ビルドチェックはスキップされました',
  'doctor.check.build.noDistDir': 'dist ディレクトリが見つかりません',
  'doctor.check.build.expectedPath': '期待されるパス',
  'doctor.check.build.runBuildHint': 'ビルドを実行してください: npm run build',
  'doctor.check.build.builtEnv': 'ビルド済み環境で動作中',
  'doctor.check.build.noSrcDir': 'ソースディレクトリが見つからないため、ビルドチェックをスキップしました',
  'doctor.check.build.rebuildRequired': 'ソースファイルがビルドファイルより新しいため、リビルドが必要です',
  'doctor.check.build.newestSource': '最新のソース',
  'doctor.check.build.newestBuild': '最新のビルド',
  'doctor.check.build.upToDate': 'ビルドは最新です',
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
  'cmd.doctor.description': 'Diagnose firex CLI environment and configuration',

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
  'flag.timezone': 'Output timezone (IANA format, e.g., Asia/Tokyo)',
  'flag.dateFormat': 'Date format pattern (e.g., yyyy-MM-dd)',
  'flag.rawOutput': 'Disable all formatting',
  'flag.noColor': 'Disable ANSI color codes',
  'flag.noDateFormat': 'Disable date format conversion only',

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

  // FieldValue error messages
  'err.fieldValue.invalidType': 'Invalid FieldValue type',
  'err.fieldValue.invalidOperand': 'operand must be a number',
  'err.fieldValue.invalidElements': 'elements must be an array',
  'err.fieldValue.invalidFormat': 'Invalid $fieldValue object format',
  'err.fieldValue.atPath': 'Field',
  'err.fieldValue.validTypes': 'Valid types: serverTimestamp, increment, arrayUnion, arrayRemove, delete',
  'err.fieldValue.invalidTimestampValue': '$timestampValue must be a valid ISO 8601 date string',

  // === Error Handler Messages ===
  // Auth errors
  'err.handler.auth.invalid': 'Authentication error',
  'err.handler.auth.timeout': 'Connection timeout',
  'err.handler.auth.retryHint': 'Please retry.',
  'err.handler.auth.projectNotFound': 'Project not found',
  'err.handler.auth.checkProjectId': 'Please check your project ID.',
  'err.handler.auth.permissionDenied': 'Permission denied',
  'err.handler.auth.checkPermission': 'Please check the service account permissions.',
  'err.handler.auth.uninitialized': 'Not initialized',
  'err.handler.auth.generic': 'Authentication error',

  // Config errors
  'err.handler.config.fileNotFound': 'Configuration file not found',
  'err.handler.config.parseError': 'Configuration file parse error',
  'err.handler.config.validationError': 'Invalid configuration value',
  'err.handler.config.generic': 'Configuration error',

  // Firestore errors
  'err.handler.firestore.notFound': 'Document not found',
  'err.handler.firestore.permissionDenied': 'Permission denied',
  'err.handler.firestore.checkRules': 'Please check your Firestore rules.',
  'err.handler.firestore.quotaExceeded': 'Quota exceeded',
  'err.handler.firestore.waitAndRetry': 'Please wait and retry.',
  'err.handler.firestore.unavailable': 'Firestore is unavailable',
  'err.handler.firestore.checkConnection': 'Please check your connection and retry.',
  'err.handler.firestore.timeout': 'Request timed out',
  'err.handler.firestore.retry': 'Please retry.',
  'err.handler.firestore.alreadyExists': 'Document already exists',
  'err.handler.firestore.invalidArgument': 'Invalid argument',
  'err.handler.firestore.generic': 'Firestore error',

  // Validation errors
  'err.handler.validation.withField': 'Validation error ({field})',
  'err.handler.validation.generic': 'Validation error',

  // Stack trace
  'err.handler.stackTrace': 'Stack trace',

  // Help suggestions
  'err.handler.help.showHelp': 'Show help: firex --help',
  'err.handler.help.configHelp': 'Show config help: firex config --help',
  'err.handler.help.commandHelp': 'Show help: firex {command} --help',

  // === Doctor Service Messages ===
  // Progress messages
  'doctor.progress.starting': 'Starting diagnostics...',
  'doctor.progress.emulatorMode': 'Emulator mode',
  'doctor.progress.checkingNode': 'Checking Node.js version...',
  'doctor.progress.checkingFirebaseCli': 'Checking Firebase CLI...',
  'doctor.progress.checkingAuth': 'Checking authentication status...',
  'doctor.progress.resolvingProjectId': 'Resolving project ID...',
  'doctor.progress.checkingEmulator': 'Checking emulator connection...',
  'doctor.progress.checkingFirestoreApi': 'Checking Firestore API...',
  'doctor.progress.checkingFirestoreAccess': 'Checking Firestore access...',
  'doctor.progress.checkingConfig': 'Checking config file...',
  'doctor.progress.validatingSyntax': 'Validating config file syntax...',
  'doctor.progress.validatingSchema': 'Validating config schema...',
  'doctor.progress.validatingPaths': 'Validating collection paths...',
  'doctor.progress.checkingBuild': 'Checking build status...',
  'doctor.progress.complete': 'Diagnostics complete.',

  // Error messages
  'doctor.error.checkFailed': 'Check failed',
  'doctor.error.executionFailed': 'Failed to run diagnostics',
  'doctor.error.formatFailed': 'Failed to format diagnostic results',

  // Flag description
  'flag.doctor.json': 'Output diagnostic results in JSON format',

  // === Checker Module Messages ===
  // EnvironmentChecker - Node.js
  'doctor.check.node.installed': 'is installed',
  'doctor.check.node.minVersion': 'Minimum requirement',
  'doctor.check.node.belowMinimum': 'does not meet minimum requirement',
  'doctor.check.node.currentVersion': 'Current version',
  'doctor.check.node.upgradeHint': 'Please upgrade.',

  // EnvironmentChecker - Firebase CLI
  'doctor.check.firebaseCli.installed': 'is installed',
  'doctor.check.firebaseCli.notInstalled': 'Firebase CLI is not installed',
  'doctor.check.firebaseCli.installHint': 'Please install Firebase CLI',

  // EnvironmentChecker - Auth
  'doctor.check.auth.info': 'Authentication info',
  'doctor.check.auth.emulatorMode': 'Emulator Mode',
  'doctor.check.auth.serviceAccount': 'Service Account',
  'doctor.check.auth.adc': 'Application Default Credentials (ADC)',
  'doctor.check.auth.fileNotFound': 'File not found',
  'doctor.check.auth.setCredentialHint': 'Please set GOOGLE_APPLICATION_CREDENTIALS to correct path',
  'doctor.check.auth.notFound': 'Authentication info not found',
  'doctor.check.auth.notConfigured': 'Service account key or ADC is not configured',
  'doctor.check.auth.setupHint': 'Please configure authentication',

  // FirebaseChecker - .firebaserc
  'doctor.check.firebaserc.found': '.firebaserc found',
  'doctor.check.firebaserc.noDefault': 'No default project set in .firebaserc',
  'doctor.check.firebaserc.useProjectHint': 'Run firebase use <project-id> to set default project',
  'doctor.check.firebaserc.parseError': 'Failed to parse .firebaserc',
  'doctor.check.firebaserc.checkJsonHint': 'Please check .firebaserc JSON format',
  'doctor.check.firebaserc.notFound': '.firebaserc file not found',
  'doctor.check.firebaserc.searchPath': 'Search start path',
  'doctor.check.firebaserc.initHint': 'Please initialize Firebase project: firebase init',

  // FirebaseChecker - Firestore API
  'doctor.check.firestoreApi.enabled': 'Firestore API is enabled',
  'doctor.check.firestoreApi.notInitialized': 'Firestore instance is not initialized',
  'doctor.check.firestoreApi.checkProject': 'Please check project settings',
  'doctor.check.firestoreApi.rerunHint': 'Please run diagnostics again after configuring authentication',
  'doctor.check.firestoreApi.notEnabled': 'Firestore API is not enabled',
  'doctor.check.firestoreApi.enableHint': 'Please enable Firestore API',
  'doctor.check.firestoreApi.checkFailed': 'Failed to check Firestore API',
  'doctor.check.firestoreApi.consoleHint': 'Please check Firestore status in Google Cloud Console',

  // FirebaseChecker - Firestore Access
  'doctor.check.firestoreAccess.hasAccess': 'Has access to Firestore',
  'doctor.check.firestoreAccess.collectionsFound': 'Collections found',
  'doctor.check.firestoreAccess.noPermission': 'No permission to access Firestore',
  'doctor.check.firestoreAccess.grantRoleHint': 'Please grant required IAM roles',
  'doctor.check.firestoreAccess.checkFailed': 'Failed to check Firestore access',

  // FirebaseChecker - Emulator
  'doctor.check.emulator.connected': 'Connected to Firestore emulator',
  'doctor.check.emulator.httpStatus': 'HTTP status',
  'doctor.check.emulator.unexpectedResponse': 'Unexpected response from emulator',
  'doctor.check.emulator.checkRunning': 'Please check if emulator is running properly',
  'doctor.check.emulator.connectionFailed': 'Cannot connect to Firestore emulator',
  'doctor.check.emulator.host': 'Host',
  'doctor.check.emulator.startHint': 'Please start emulator: firebase emulators:start --only firestore',

  // FirebaseChecker - Project ID
  'doctor.check.projectId.resolved': 'Project',
  'doctor.check.projectId.notResolved': 'Cannot determine project ID',
  'doctor.check.projectId.setupHint': 'Please configure project ID',
  'doctor.check.projectId.source.gcloudProject': 'GCLOUD_PROJECT environment variable',
  'doctor.check.projectId.source.googleCloudProject': 'GOOGLE_CLOUD_PROJECT environment variable',
  'doctor.check.projectId.source.firebaseProject': 'FIREBASE_PROJECT environment variable',
  'doctor.check.projectId.source.firebaserc': '.firebaserc (default alias)',
  'doctor.check.projectId.source.serviceAccount': 'Service Account file',
  'doctor.check.projectId.source.cliFlag': '--project-id option',
  'doctor.check.projectId.source.unknown': 'Unknown',

  // ConfigChecker - Config file
  'doctor.check.config.found': 'Config file found',
  'doctor.check.config.filePath': 'File path',
  'doctor.check.config.notFound': 'Config file not found - using defaults',
  'doctor.check.config.usingDefaults': 'Using default configuration',
  'doctor.check.config.searchPath': 'Search path',
  'doctor.check.config.createHint': 'Create .firex.yaml or .firex.json to customize configuration',

  // ConfigChecker - Syntax
  'doctor.check.syntax.yamlValid': 'YAML syntax is valid',
  'doctor.check.syntax.yamlError': 'YAML syntax error',
  'doctor.check.syntax.position': 'Position',
  'doctor.check.syntax.yamlHint': 'Please check YAML syntax. Use spaces for indentation.',
  'doctor.check.syntax.jsonValid': 'JSON syntax is valid',
  'doctor.check.syntax.jsonError': 'JSON syntax error',
  'doctor.check.syntax.jsonHint': 'Please check JSON syntax. Check commas and quotes.',

  // ConfigChecker - Schema
  'doctor.check.schema.valid': 'Config schema is valid',
  'doctor.check.schema.invalid': 'Config schema validation failed',
  'doctor.check.schema.validFields': 'Valid fields',

  // ConfigChecker - Collection paths
  'doctor.check.paths.noTargets': 'Collection path validation: no targets',
  'doctor.check.paths.allValid': 'All collection paths are valid',
  'doctor.check.paths.invalid': 'Invalid collection path format',
  'doctor.check.paths.invalidPaths': 'Invalid paths',
  'doctor.check.paths.segmentHint': 'Collection paths must have odd number of segments',

  // BuildChecker
  'doctor.check.build.npmPackage': 'Installed as npm package',
  'doctor.check.build.skipped': 'Build check skipped',
  'doctor.check.build.noDistDir': 'dist directory not found',
  'doctor.check.build.expectedPath': 'Expected path',
  'doctor.check.build.runBuildHint': 'Please run build: npm run build',
  'doctor.check.build.builtEnv': 'Running in built environment',
  'doctor.check.build.noSrcDir': 'Build check skipped - source directory not found',
  'doctor.check.build.rebuildRequired': 'Source files are newer than build files, rebuild required',
  'doctor.check.build.newestSource': 'Newest source',
  'doctor.check.build.newestBuild': 'Newest build',
  'doctor.check.build.upToDate': 'Build is up to date',
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
