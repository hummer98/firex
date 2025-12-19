/**
 * i18n unit tests for collections command messages
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, setLocale, getLocale, type SupportedLocale } from './i18n';

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
