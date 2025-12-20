/**
 * Tests for DoctorCommand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DoctorCommand } from './doctor';

// Mock console output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('DoctorCommand', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('static properties', () => {
    it('should have correct description', () => {
      expect(DoctorCommand.description).toBeDefined();
      expect(typeof DoctorCommand.description).toBe('string');
    });

    it('should not be hidden', () => {
      expect(DoctorCommand.hidden).toBe(false);
    });

    it('should have --json flag', () => {
      expect(DoctorCommand.flags.json).toBeDefined();
    });

    it('should have --verbose flag', () => {
      expect(DoctorCommand.flags.verbose).toBeDefined();
    });
  });

  describe('examples', () => {
    it('should have usage examples', () => {
      expect(DoctorCommand.examples).toBeDefined();
      expect(Array.isArray(DoctorCommand.examples)).toBe(true);
      expect(DoctorCommand.examples.length).toBeGreaterThan(0);
    });
  });
});
