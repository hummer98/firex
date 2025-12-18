/**
 * Tests for Help system configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseCommand } from './base-command';
import { GetCommand } from './get';
import { SetCommand } from './set';
import { ListCommand } from './list';
import { DeleteCommand } from './delete';
import { ExportCommand } from './export';
import { ImportCommand } from './import';
import { ConfigCommand } from './config';
import { ExamplesCommand } from './examples';

describe('Help System', () => {
  describe('command descriptions', () => {
    it('GetCommand should have description', () => {
      expect(GetCommand.description).toBeDefined();
      expect(GetCommand.description.length).toBeGreaterThan(0);
    });

    it('SetCommand should have description', () => {
      expect(SetCommand.description).toBeDefined();
      expect(SetCommand.description.length).toBeGreaterThan(0);
    });

    it('ListCommand should have description', () => {
      expect(ListCommand.description).toBeDefined();
      expect(ListCommand.description.length).toBeGreaterThan(0);
    });

    it('DeleteCommand should have description', () => {
      expect(DeleteCommand.description).toBeDefined();
      expect(DeleteCommand.description.length).toBeGreaterThan(0);
    });

    it('ExportCommand should have description', () => {
      expect(ExportCommand.description).toBeDefined();
      expect(ExportCommand.description.length).toBeGreaterThan(0);
    });

    it('ImportCommand should have description', () => {
      expect(ImportCommand.description).toBeDefined();
      expect(ImportCommand.description.length).toBeGreaterThan(0);
    });

    it('ConfigCommand should have description', () => {
      expect(ConfigCommand.description).toBeDefined();
      expect(ConfigCommand.description.length).toBeGreaterThan(0);
    });

    it('ExamplesCommand should have description', () => {
      expect(ExamplesCommand.description).toBeDefined();
      expect(ExamplesCommand.description.length).toBeGreaterThan(0);
    });
  });

  describe('command examples', () => {
    it('GetCommand should have examples', () => {
      expect(GetCommand.examples).toBeDefined();
      expect(GetCommand.examples!.length).toBeGreaterThan(0);
    });

    it('SetCommand should have examples', () => {
      expect(SetCommand.examples).toBeDefined();
      expect(SetCommand.examples!.length).toBeGreaterThan(0);
    });

    it('ListCommand should have examples', () => {
      expect(ListCommand.examples).toBeDefined();
      expect(ListCommand.examples!.length).toBeGreaterThan(0);
    });

    it('DeleteCommand should have examples', () => {
      expect(DeleteCommand.examples).toBeDefined();
      expect(DeleteCommand.examples!.length).toBeGreaterThan(0);
    });
  });

  describe('flag descriptions', () => {
    it('BaseCommand flags should have descriptions', () => {
      const flags = BaseCommand.baseFlags;

      expect(flags.verbose.description).toBeDefined();
      expect(flags['project-id'].description).toBeDefined();
      expect(flags['credential-path'].description).toBeDefined();
      expect(flags.format.description).toBeDefined();
    });

    it('GetCommand flags should have descriptions', () => {
      expect(GetCommand.flags.watch.description).toBeDefined();
      expect(GetCommand.flags['show-initial'].description).toBeDefined();
    });

    it('ListCommand flags should have descriptions', () => {
      expect(ListCommand.flags.where.description).toBeDefined();
      expect(ListCommand.flags['order-by'].description).toBeDefined();
      expect(ListCommand.flags.limit.description).toBeDefined();
    });

    it('SetCommand flags should have descriptions', () => {
      expect(SetCommand.flags.merge.description).toBeDefined();
      expect(SetCommand.flags['from-file'].description).toBeDefined();
    });

    it('DeleteCommand flags should have descriptions', () => {
      expect(DeleteCommand.flags.recursive.description).toBeDefined();
      expect(DeleteCommand.flags.yes.description).toBeDefined();
    });
  });

  describe('argument descriptions', () => {
    it('GetCommand args should have descriptions', () => {
      expect(GetCommand.args.documentPath.description).toBeDefined();
    });

    it('SetCommand args should have descriptions', () => {
      expect(SetCommand.args.documentPath.description).toBeDefined();
      expect(SetCommand.args.data.description).toBeDefined();
    });

    it('ListCommand args should have descriptions', () => {
      expect(ListCommand.args.collectionPath.description).toBeDefined();
    });

    it('DeleteCommand args should have descriptions', () => {
      expect(DeleteCommand.args.path.description).toBeDefined();
    });
  });
});
