/**
 * i18n unit tests for collections command messages
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, setLocale, getLocale, type SupportedLocale } from './i18n';

describe('i18n - error handler messages', () => {
  let originalLocale: SupportedLocale;

  beforeEach(() => {
    originalLocale = getLocale();
  });

  afterEach(() => {
    setLocale(originalLocale);
  });

  describe('Japanese error messages', () => {
    beforeEach(() => {
      setLocale('ja');
    });

    // Auth errors
    it('should have auth invalid message', () => {
      expect(t('err.handler.auth.invalid')).toBe('認証エラー');
    });

    it('should have auth timeout message', () => {
      expect(t('err.handler.auth.timeout')).toBe('接続タイムアウト');
    });

    it('should have auth retry hint message', () => {
      expect(t('err.handler.auth.retryHint')).toBe('再試行してください。');
    });

    it('should have auth project not found message', () => {
      expect(t('err.handler.auth.projectNotFound')).toBe('プロジェクトが見つかりません');
    });

    it('should have auth check project id message', () => {
      expect(t('err.handler.auth.checkProjectId')).toBe('プロジェクトIDを確認してください。');
    });

    it('should have auth permission denied message', () => {
      expect(t('err.handler.auth.permissionDenied')).toBe('アクセス権限がありません');
    });

    it('should have auth check permission message', () => {
      expect(t('err.handler.auth.checkPermission')).toBe('サービスアカウントの権限を確認してください。');
    });

    it('should have auth uninitialized message', () => {
      expect(t('err.handler.auth.uninitialized')).toBe('初期化されていません');
    });

    it('should have auth generic message', () => {
      expect(t('err.handler.auth.generic')).toBe('認証エラー');
    });

    // Config errors
    it('should have config file not found message', () => {
      expect(t('err.handler.config.fileNotFound')).toBe('設定ファイルが見つかりません');
    });

    it('should have config parse error message', () => {
      expect(t('err.handler.config.parseError')).toBe('設定ファイルの解析エラー');
    });

    it('should have config validation error message', () => {
      expect(t('err.handler.config.validationError')).toBe('設定値が不正です');
    });

    it('should have config generic message', () => {
      expect(t('err.handler.config.generic')).toBe('設定エラー');
    });

    // Firestore errors
    it('should have firestore not found message', () => {
      expect(t('err.handler.firestore.notFound')).toBe('ドキュメントが見つかりません');
    });

    it('should have firestore permission denied message', () => {
      expect(t('err.handler.firestore.permissionDenied')).toBe('アクセス権限がありません');
    });

    it('should have firestore check rules message', () => {
      expect(t('err.handler.firestore.checkRules')).toBe('Firestoreルールを確認してください。');
    });

    it('should have firestore quota exceeded message', () => {
      expect(t('err.handler.firestore.quotaExceeded')).toBe('クォータを超過しました');
    });

    it('should have firestore wait and retry message', () => {
      expect(t('err.handler.firestore.waitAndRetry')).toBe('しばらく待ってから再試行してください。');
    });

    it('should have firestore unavailable message', () => {
      expect(t('err.handler.firestore.unavailable')).toBe('Firestoreが利用できません');
    });

    it('should have firestore check connection message', () => {
      expect(t('err.handler.firestore.checkConnection')).toBe('接続を確認して再試行してください。');
    });

    it('should have firestore timeout message', () => {
      expect(t('err.handler.firestore.timeout')).toBe('リクエストがタイムアウトしました');
    });

    it('should have firestore retry message', () => {
      expect(t('err.handler.firestore.retry')).toBe('再試行してください。');
    });

    it('should have firestore already exists message', () => {
      expect(t('err.handler.firestore.alreadyExists')).toBe('ドキュメントは既に存在します');
    });

    it('should have firestore invalid argument message', () => {
      expect(t('err.handler.firestore.invalidArgument')).toBe('引数が無効です');
    });

    it('should have firestore generic message', () => {
      expect(t('err.handler.firestore.generic')).toBe('Firestoreエラー');
    });

    // Validation errors
    it('should have validation with field message', () => {
      expect(t('err.handler.validation.withField')).toBe('バリデーションエラー ({field})');
    });

    it('should have validation generic message', () => {
      expect(t('err.handler.validation.generic')).toBe('バリデーションエラー');
    });

    // Stack trace
    it('should have stack trace label', () => {
      expect(t('err.handler.stackTrace')).toBe('スタックトレース');
    });

    // Help suggestions
    it('should have show help message', () => {
      expect(t('err.handler.help.showHelp')).toBe('ヘルプを表示: firex --help');
    });

    it('should have config help message', () => {
      expect(t('err.handler.help.configHelp')).toBe('設定のヘルプを表示: firex config --help');
    });

    it('should have command help message', () => {
      expect(t('err.handler.help.commandHelp')).toBe('ヘルプを表示: firex {command} --help');
    });
  });

  describe('English error messages', () => {
    beforeEach(() => {
      setLocale('en');
    });

    // Auth errors
    it('should have auth invalid message', () => {
      expect(t('err.handler.auth.invalid')).toBe('Authentication error');
    });

    it('should have auth timeout message', () => {
      expect(t('err.handler.auth.timeout')).toBe('Connection timeout');
    });

    it('should have auth retry hint message', () => {
      expect(t('err.handler.auth.retryHint')).toBe('Please retry.');
    });

    it('should have auth project not found message', () => {
      expect(t('err.handler.auth.projectNotFound')).toBe('Project not found');
    });

    it('should have auth check project id message', () => {
      expect(t('err.handler.auth.checkProjectId')).toBe('Please check your project ID.');
    });

    it('should have auth permission denied message', () => {
      expect(t('err.handler.auth.permissionDenied')).toBe('Permission denied');
    });

    it('should have auth check permission message', () => {
      expect(t('err.handler.auth.checkPermission')).toBe('Please check the service account permissions.');
    });

    it('should have auth uninitialized message', () => {
      expect(t('err.handler.auth.uninitialized')).toBe('Not initialized');
    });

    it('should have auth generic message', () => {
      expect(t('err.handler.auth.generic')).toBe('Authentication error');
    });

    // Config errors
    it('should have config file not found message', () => {
      expect(t('err.handler.config.fileNotFound')).toBe('Configuration file not found');
    });

    it('should have config parse error message', () => {
      expect(t('err.handler.config.parseError')).toBe('Configuration file parse error');
    });

    it('should have config validation error message', () => {
      expect(t('err.handler.config.validationError')).toBe('Invalid configuration value');
    });

    it('should have config generic message', () => {
      expect(t('err.handler.config.generic')).toBe('Configuration error');
    });

    // Firestore errors
    it('should have firestore not found message', () => {
      expect(t('err.handler.firestore.notFound')).toBe('Document not found');
    });

    it('should have firestore permission denied message', () => {
      expect(t('err.handler.firestore.permissionDenied')).toBe('Permission denied');
    });

    it('should have firestore check rules message', () => {
      expect(t('err.handler.firestore.checkRules')).toBe('Please check your Firestore rules.');
    });

    it('should have firestore quota exceeded message', () => {
      expect(t('err.handler.firestore.quotaExceeded')).toBe('Quota exceeded');
    });

    it('should have firestore wait and retry message', () => {
      expect(t('err.handler.firestore.waitAndRetry')).toBe('Please wait and retry.');
    });

    it('should have firestore unavailable message', () => {
      expect(t('err.handler.firestore.unavailable')).toBe('Firestore is unavailable');
    });

    it('should have firestore check connection message', () => {
      expect(t('err.handler.firestore.checkConnection')).toBe('Please check your connection and retry.');
    });

    it('should have firestore timeout message', () => {
      expect(t('err.handler.firestore.timeout')).toBe('Request timed out');
    });

    it('should have firestore retry message', () => {
      expect(t('err.handler.firestore.retry')).toBe('Please retry.');
    });

    it('should have firestore already exists message', () => {
      expect(t('err.handler.firestore.alreadyExists')).toBe('Document already exists');
    });

    it('should have firestore invalid argument message', () => {
      expect(t('err.handler.firestore.invalidArgument')).toBe('Invalid argument');
    });

    it('should have firestore generic message', () => {
      expect(t('err.handler.firestore.generic')).toBe('Firestore error');
    });

    // Validation errors
    it('should have validation with field message', () => {
      expect(t('err.handler.validation.withField')).toBe('Validation error ({field})');
    });

    it('should have validation generic message', () => {
      expect(t('err.handler.validation.generic')).toBe('Validation error');
    });

    // Stack trace
    it('should have stack trace label', () => {
      expect(t('err.handler.stackTrace')).toBe('Stack trace');
    });

    // Help suggestions
    it('should have show help message', () => {
      expect(t('err.handler.help.showHelp')).toBe('Show help: firex --help');
    });

    it('should have config help message', () => {
      expect(t('err.handler.help.configHelp')).toBe('Show config help: firex config --help');
    });

    it('should have command help message', () => {
      expect(t('err.handler.help.commandHelp')).toBe('Show help: firex {command} --help');
    });
  });
});

describe('i18n - doctor service messages', () => {
  let originalLocale: SupportedLocale;

  beforeEach(() => {
    originalLocale = getLocale();
  });

  afterEach(() => {
    setLocale(originalLocale);
  });

  describe('Japanese doctor messages', () => {
    beforeEach(() => {
      setLocale('ja');
    });

    // Progress messages
    it('should have doctor progress starting message', () => {
      expect(t('doctor.progress.starting')).toBe('診断を開始しています...');
    });

    it('should have doctor progress emulator mode message', () => {
      expect(t('doctor.progress.emulatorMode')).toBe('エミュレータモード');
    });

    it('should have doctor progress checking node message', () => {
      expect(t('doctor.progress.checkingNode')).toBe('Node.js バージョンを確認しています...');
    });

    it('should have doctor progress checking firebase cli message', () => {
      expect(t('doctor.progress.checkingFirebaseCli')).toBe('Firebase CLI を確認しています...');
    });

    it('should have doctor progress checking auth message', () => {
      expect(t('doctor.progress.checkingAuth')).toBe('認証状態を確認しています...');
    });

    it('should have doctor progress resolving project id message', () => {
      expect(t('doctor.progress.resolvingProjectId')).toBe('プロジェクト ID を解決しています...');
    });

    it('should have doctor progress checking emulator message', () => {
      expect(t('doctor.progress.checkingEmulator')).toBe('エミュレータ接続を確認しています...');
    });

    it('should have doctor progress checking firestore api message', () => {
      expect(t('doctor.progress.checkingFirestoreApi')).toBe('Firestore API を確認しています...');
    });

    it('should have doctor progress checking firestore access message', () => {
      expect(t('doctor.progress.checkingFirestoreAccess')).toBe('Firestore アクセス権を確認しています...');
    });

    it('should have doctor progress checking config message', () => {
      expect(t('doctor.progress.checkingConfig')).toBe('設定ファイルを確認しています...');
    });

    it('should have doctor progress validating syntax message', () => {
      expect(t('doctor.progress.validatingSyntax')).toBe('設定ファイルの構文を検証しています...');
    });

    it('should have doctor progress validating schema message', () => {
      expect(t('doctor.progress.validatingSchema')).toBe('設定スキーマを検証しています...');
    });

    it('should have doctor progress validating paths message', () => {
      expect(t('doctor.progress.validatingPaths')).toBe('コレクションパスを検証しています...');
    });

    it('should have doctor progress checking build message', () => {
      expect(t('doctor.progress.checkingBuild')).toBe('ビルド状態を確認しています...');
    });

    it('should have doctor progress complete message', () => {
      expect(t('doctor.progress.complete')).toBe('診断が完了しました。');
    });

    // Error messages
    it('should have doctor error check failed message', () => {
      expect(t('doctor.error.checkFailed')).toBe('チェックに失敗しました');
    });

    it('should have doctor error execution failed message', () => {
      expect(t('doctor.error.executionFailed')).toBe('診断の実行に失敗しました');
    });

    it('should have doctor error format failed message', () => {
      expect(t('doctor.error.formatFailed')).toBe('診断結果のフォーマットに失敗しました');
    });

    // Flag description
    it('should have doctor json flag description', () => {
      expect(t('flag.doctor.json')).toBe('診断結果を JSON 形式で出力する');
    });
  });

  describe('English doctor messages', () => {
    beforeEach(() => {
      setLocale('en');
    });

    // Progress messages
    it('should have doctor progress starting message', () => {
      expect(t('doctor.progress.starting')).toBe('Starting diagnostics...');
    });

    it('should have doctor progress emulator mode message', () => {
      expect(t('doctor.progress.emulatorMode')).toBe('Emulator mode');
    });

    it('should have doctor progress checking node message', () => {
      expect(t('doctor.progress.checkingNode')).toBe('Checking Node.js version...');
    });

    it('should have doctor progress checking firebase cli message', () => {
      expect(t('doctor.progress.checkingFirebaseCli')).toBe('Checking Firebase CLI...');
    });

    it('should have doctor progress checking auth message', () => {
      expect(t('doctor.progress.checkingAuth')).toBe('Checking authentication status...');
    });

    it('should have doctor progress resolving project id message', () => {
      expect(t('doctor.progress.resolvingProjectId')).toBe('Resolving project ID...');
    });

    it('should have doctor progress checking emulator message', () => {
      expect(t('doctor.progress.checkingEmulator')).toBe('Checking emulator connection...');
    });

    it('should have doctor progress checking firestore api message', () => {
      expect(t('doctor.progress.checkingFirestoreApi')).toBe('Checking Firestore API...');
    });

    it('should have doctor progress checking firestore access message', () => {
      expect(t('doctor.progress.checkingFirestoreAccess')).toBe('Checking Firestore access...');
    });

    it('should have doctor progress checking config message', () => {
      expect(t('doctor.progress.checkingConfig')).toBe('Checking config file...');
    });

    it('should have doctor progress validating syntax message', () => {
      expect(t('doctor.progress.validatingSyntax')).toBe('Validating config file syntax...');
    });

    it('should have doctor progress validating schema message', () => {
      expect(t('doctor.progress.validatingSchema')).toBe('Validating config schema...');
    });

    it('should have doctor progress validating paths message', () => {
      expect(t('doctor.progress.validatingPaths')).toBe('Validating collection paths...');
    });

    it('should have doctor progress checking build message', () => {
      expect(t('doctor.progress.checkingBuild')).toBe('Checking build status...');
    });

    it('should have doctor progress complete message', () => {
      expect(t('doctor.progress.complete')).toBe('Diagnostics complete.');
    });

    // Error messages
    it('should have doctor error check failed message', () => {
      expect(t('doctor.error.checkFailed')).toBe('Check failed');
    });

    it('should have doctor error execution failed message', () => {
      expect(t('doctor.error.executionFailed')).toBe('Failed to run diagnostics');
    });

    it('should have doctor error format failed message', () => {
      expect(t('doctor.error.formatFailed')).toBe('Failed to format diagnostic results');
    });

    // Flag description
    it('should have doctor json flag description', () => {
      expect(t('flag.doctor.json')).toBe('Output diagnostic results in JSON format');
    });
  });
});

describe('i18n - checker module messages', () => {
  let originalLocale: SupportedLocale;

  beforeEach(() => {
    originalLocale = getLocale();
  });

  afterEach(() => {
    setLocale(originalLocale);
  });

  describe('Japanese checker messages', () => {
    beforeEach(() => {
      setLocale('ja');
    });

    // EnvironmentChecker - Node.js
    it('should have node installed message', () => {
      expect(t('doctor.check.node.installed')).toContain('インストール');
    });

    it('should have node minimum version message', () => {
      expect(t('doctor.check.node.minVersion')).toContain('最小要件');
    });

    // EnvironmentChecker - Firebase CLI
    it('should have firebase cli installed message', () => {
      expect(t('doctor.check.firebaseCli.installed')).toContain('インストール');
    });

    it('should have firebase cli not installed message', () => {
      expect(t('doctor.check.firebaseCli.notInstalled')).toContain('インストールされていません');
    });

    // EnvironmentChecker - Auth
    it('should have auth info message', () => {
      expect(t('doctor.check.auth.info')).toBe('認証情報');
    });

    it('should have auth not found message', () => {
      expect(t('doctor.check.auth.notFound')).toContain('見つかりません');
    });

    // FirebaseChecker - .firebaserc
    it('should have firebaserc found message', () => {
      expect(t('doctor.check.firebaserc.found')).toContain('見つかりました');
    });

    it('should have firebaserc not found message', () => {
      expect(t('doctor.check.firebaserc.notFound')).toContain('見つかりません');
    });

    // FirebaseChecker - Firestore API
    it('should have firestore api enabled message', () => {
      expect(t('doctor.check.firestoreApi.enabled')).toContain('有効');
    });

    it('should have firestore api not enabled message', () => {
      expect(t('doctor.check.firestoreApi.notEnabled')).toContain('有効化されていません');
    });

    // FirebaseChecker - Emulator
    it('should have emulator connected message', () => {
      expect(t('doctor.check.emulator.connected')).toContain('接続');
    });

    it('should have emulator connection failed message', () => {
      expect(t('doctor.check.emulator.connectionFailed')).toContain('接続できません');
    });

    // FirebaseChecker - Project ID
    it('should have project id resolved message', () => {
      expect(t('doctor.check.projectId.resolved')).toBe('プロジェクト');
    });

    it('should have project id not resolved message', () => {
      expect(t('doctor.check.projectId.notResolved')).toContain('特定できません');
    });

    // ConfigChecker
    it('should have config found message', () => {
      expect(t('doctor.check.config.found')).toContain('見つかりました');
    });

    it('should have config not found message', () => {
      expect(t('doctor.check.config.notFound')).toContain('見つかりません');
    });

    it('should have yaml valid message', () => {
      expect(t('doctor.check.syntax.yamlValid')).toContain('有効');
    });

    it('should have schema valid message', () => {
      expect(t('doctor.check.schema.valid')).toContain('有効');
    });

    // BuildChecker
    it('should have build up to date message', () => {
      expect(t('doctor.check.build.upToDate')).toContain('最新');
    });

    it('should have build rebuild required message', () => {
      expect(t('doctor.check.build.rebuildRequired')).toContain('リビルド');
    });
  });

  describe('English checker messages', () => {
    beforeEach(() => {
      setLocale('en');
    });

    // EnvironmentChecker - Node.js
    it('should have node installed message', () => {
      expect(t('doctor.check.node.installed')).toContain('installed');
    });

    it('should have node minimum version message', () => {
      expect(t('doctor.check.node.minVersion')).toContain('Minimum');
    });

    // EnvironmentChecker - Firebase CLI
    it('should have firebase cli installed message', () => {
      expect(t('doctor.check.firebaseCli.installed')).toContain('installed');
    });

    it('should have firebase cli not installed message', () => {
      expect(t('doctor.check.firebaseCli.notInstalled')).toContain('not installed');
    });

    // EnvironmentChecker - Auth
    it('should have auth info message', () => {
      expect(t('doctor.check.auth.info')).toBe('Authentication info');
    });

    it('should have auth not found message', () => {
      expect(t('doctor.check.auth.notFound')).toContain('not found');
    });

    // FirebaseChecker - .firebaserc
    it('should have firebaserc found message', () => {
      expect(t('doctor.check.firebaserc.found')).toContain('found');
    });

    it('should have firebaserc not found message', () => {
      expect(t('doctor.check.firebaserc.notFound')).toContain('not found');
    });

    // FirebaseChecker - Firestore API
    it('should have firestore api enabled message', () => {
      expect(t('doctor.check.firestoreApi.enabled')).toContain('enabled');
    });

    it('should have firestore api not enabled message', () => {
      expect(t('doctor.check.firestoreApi.notEnabled')).toContain('not enabled');
    });

    // FirebaseChecker - Emulator
    it('should have emulator connected message', () => {
      expect(t('doctor.check.emulator.connected').toLowerCase()).toContain('connected');
    });

    it('should have emulator connection failed message', () => {
      expect(t('doctor.check.emulator.connectionFailed')).toContain('Cannot connect');
    });

    // FirebaseChecker - Project ID
    it('should have project id resolved message', () => {
      expect(t('doctor.check.projectId.resolved')).toBe('Project');
    });

    it('should have project id not resolved message', () => {
      expect(t('doctor.check.projectId.notResolved')).toContain('Cannot determine');
    });

    // ConfigChecker
    it('should have config found message', () => {
      expect(t('doctor.check.config.found')).toContain('found');
    });

    it('should have config not found message', () => {
      expect(t('doctor.check.config.notFound')).toContain('not found');
    });

    it('should have yaml valid message', () => {
      expect(t('doctor.check.syntax.yamlValid')).toContain('valid');
    });

    it('should have schema valid message', () => {
      expect(t('doctor.check.schema.valid')).toContain('valid');
    });

    // BuildChecker
    it('should have build up to date message', () => {
      expect(t('doctor.check.build.upToDate')).toContain('up to date');
    });

    it('should have build rebuild required message', () => {
      expect(t('doctor.check.build.rebuildRequired')).toContain('rebuild');
    });
  });
});

describe('i18n - collections command messages', () => {
  let originalLocale: SupportedLocale;

  beforeEach(() => {
    originalLocale = getLocale();
  });

  afterEach(() => {
    setLocale(originalLocale);
  });

  describe('Japanese messages', () => {
    beforeEach(() => {
      setLocale('ja');
    });

    it('should have toon flag description', () => {
      expect(t('flag.toon')).toBe('TOON形式で出力 (--format=toon のエイリアス)');
    });

    it('should have command description', () => {
      expect(t('cmd.collections.description')).toBe('コレクション一覧を表示する');
    });

    it('should have document path argument description', () => {
      expect(t('arg.documentPathOptional')).toBe('サブコレクションを取得するドキュメントパス（省略時はルートコレクション）');
    });

    it('should have collections found message', () => {
      expect(t('msg.collectionsFound')).toBe('件のコレクションが見つかりました');
    });

    it('should have no collections found message', () => {
      expect(t('msg.noCollectionsFound')).toBe('コレクションが見つかりません');
    });

    it('should have no subcollections found message', () => {
      expect(t('msg.noSubcollectionsFound')).toBe('サブコレクションが見つかりません');
    });

    it('should have document not found for subcollections error', () => {
      expect(t('err.documentNotFoundForSubcollections')).toBe('ドキュメントが見つかりません。サブコレクションを取得できません');
    });
  });

  describe('English messages', () => {
    beforeEach(() => {
      setLocale('en');
    });

    it('should have toon flag description', () => {
      expect(t('flag.toon')).toBe('Output in TOON format (alias for --format=toon)');
    });

    it('should have command description', () => {
      expect(t('cmd.collections.description')).toBe('List collections');
    });

    it('should have document path argument description', () => {
      expect(t('arg.documentPathOptional')).toBe('Document path for subcollections (omit for root collections)');
    });

    it('should have collections found message', () => {
      expect(t('msg.collectionsFound')).toBe('collection(s) found');
    });

    it('should have no collections found message', () => {
      expect(t('msg.noCollectionsFound')).toBe('No collections found');
    });

    it('should have no subcollections found message', () => {
      expect(t('msg.noSubcollectionsFound')).toBe('No subcollections found');
    });

    it('should have document not found for subcollections error', () => {
      expect(t('err.documentNotFoundForSubcollections')).toBe('Document not found. Cannot retrieve subcollections');
    });
  });
});
