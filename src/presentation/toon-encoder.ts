/**
 * TOON encoder service
 * Wraps @toon-format/toon library with Result-based error handling
 */

import { Result, ok, err } from '../shared/types';
import { encode as toonEncode } from '@toon-format/toon';
import type { FormatError } from './output-formatter';

/**
 * TOON encoder service
 * Wraps @toon-format/toon library with Result-based error handling
 */
export class ToonEncoder {
  /**
   * Encode data to TOON format
   * @param data - JSON-compatible data to encode
   * @returns Result containing TOON string or FormatError
   */
  encode(data: unknown): Result<string, FormatError> {
    try {
      // Pre-process data to handle special values (NaN, Infinity, -Infinity)
      const sanitizedData = this.sanitizeData(data);
      const toonString = toonEncode(sanitizedData);
      return ok(toonString);
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `TOON形式への変換に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Sanitize data to handle special JavaScript values
   * - NaN -> null
   * - Infinity -> null
   * - -Infinity -> null
   */
  private sanitizeData(data: unknown, seen = new WeakSet<object>()): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'number') {
      if (Number.isNaN(data) || !Number.isFinite(data)) {
        return null;
      }
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    // Check for circular reference
    if (seen.has(data)) {
      throw new Error('Converting circular structure to TOON');
    }
    seen.add(data);

    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString();
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item, seen));
    }

    // Handle plain objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values (JSON.stringify behavior)
      if (value !== undefined) {
        sanitized[key] = this.sanitizeData(value, seen);
      }
    }
    return sanitized;
  }
}
