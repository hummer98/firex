/**
 * PromptService unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptService } from './prompt-service';

describe('PromptService', () => {
  let promptService: PromptService;

  beforeEach(() => {
    promptService = new PromptService();
  });

  describe('confirm', () => {
    it('should return Result type', async () => {
      // Mock the confirm function to return true
      vi.spyOn(promptService as any, 'confirmPrompt').mockResolvedValue(true);

      const result = await promptService.confirm('Delete this?');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('boolean');
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock error scenario
      vi.spyOn(promptService as any, 'confirmPrompt').mockRejectedValue(
        new Error('User cancelled')
      );

      const result = await promptService.confirm('Delete this?');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PROMPT_ERROR');
      }
    });
  });

  describe('input', () => {
    it('should return string input', async () => {
      vi.spyOn(promptService as any, 'inputPrompt').mockResolvedValue('test input');

      const result = await promptService.input('Enter name:');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('string');
      }
    });

    it('should handle empty input with default value', async () => {
      vi.spyOn(promptService as any, 'inputPrompt').mockResolvedValue('');

      const result = await promptService.input('Enter name:', { defaultValue: 'default' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('default');
      }
    });
  });
});
