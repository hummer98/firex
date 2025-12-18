/**
 * Prompt service for user interactions
 */

import { Result, ok, err } from '../shared/types';
import { confirm, input } from '@inquirer/prompts';

/**
 * Prompt error types
 */
export type PromptError = {
  type: 'PROMPT_ERROR';
  message: string;
  originalError?: Error;
};

/**
 * Input options
 */
export interface InputOptions {
  defaultValue?: string;
  validate?: (value: string) => boolean | string;
}

/**
 * Service for user prompts and interactions
 */
export class PromptService {
  /**
   * Show confirmation prompt
   */
  async confirm(message: string, defaultValue = false): Promise<Result<boolean, PromptError>> {
    try {
      const result = await this.confirmPrompt(message, defaultValue);
      return ok(result);
    } catch (error) {
      return err({
        type: 'PROMPT_ERROR',
        message: `プロンプトエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Show text input prompt
   */
  async input(
    message: string,
    options: InputOptions = {}
  ): Promise<Result<string, PromptError>> {
    try {
      const result = await this.inputPrompt(message, options);

      // Handle empty input with default value
      if (!result && options.defaultValue) {
        return ok(options.defaultValue);
      }

      return ok(result);
    } catch (error) {
      return err({
        type: 'PROMPT_ERROR',
        message: `プロンプトエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Internal method for confirmation (can be mocked in tests)
   */
  private async confirmPrompt(message: string, defaultValue: boolean): Promise<boolean> {
    return confirm({
      message,
      default: defaultValue,
    });
  }

  /**
   * Internal method for input (can be mocked in tests)
   */
  private async inputPrompt(message: string, options: InputOptions): Promise<string> {
    return input({
      message,
      default: options.defaultValue,
      validate: options.validate,
    });
  }
}
