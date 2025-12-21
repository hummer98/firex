/**
 * DateFormatter - Date formatting abstraction and implementation
 */

import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { Result, ok, err } from '../shared/types';

/**
 * Default date format pattern (ISO 8601 with timezone offset)
 */
export const DEFAULT_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

/**
 * Firestore Timestamp-like interface
 */
export interface FirestoreTimestampLike {
  readonly _seconds: number;
  readonly _nanoseconds: number;
  toDate(): Date;
}

/**
 * Format options for date formatting
 */
export interface DateFormatOptions {
  pattern: string;
  timezone: string;
}

/**
 * Date format error types
 */
export type DateFormatError =
  | { type: 'INVALID_PATTERN'; pattern: string; message: string }
  | { type: 'INVALID_TIMEZONE'; timezone: string; message: string }
  | { type: 'FORMAT_ERROR'; message: string };

/**
 * DateFormatter interface - abstraction for date formatting
 */
export interface DateFormatter {
  /**
   * Format a Timestamp to a string
   */
  format(
    timestamp: FirestoreTimestampLike,
    options: DateFormatOptions
  ): Result<string, DateFormatError>;

  /**
   * Validate a format pattern
   */
  validatePattern(pattern: string): Result<void, DateFormatError>;

  /**
   * Validate a timezone identifier
   */
  validateTimezone(timezone: string): Result<void, DateFormatError>;
}

/**
 * DateFnsFormatter - Implementation using date-fns and @date-fns/tz
 */
export class DateFnsFormatter implements DateFormatter {
  /**
   * Format a Firestore Timestamp to a string
   */
  format(
    timestamp: FirestoreTimestampLike,
    options: DateFormatOptions
  ): Result<string, DateFormatError> {
    // Validate timezone first
    const tzResult = this.validateTimezone(options.timezone);
    if (tzResult.isErr()) {
      return err(tzResult.error);
    }

    // Validate pattern
    const patternResult = this.validatePattern(options.pattern);
    if (patternResult.isErr()) {
      return err(patternResult.error);
    }

    try {
      // Convert Firestore Timestamp to Date
      const date = timestamp.toDate();

      // Create TZDate for timezone-aware formatting
      const tzDate = new TZDate(date, options.timezone);

      // Format using date-fns
      const formatted = format(tzDate, options.pattern);

      return ok(formatted);
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `日時のフォーマットに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  /**
   * Validate a date format pattern
   */
  validatePattern(pattern: string): Result<void, DateFormatError> {
    if (!pattern || pattern.trim() === '') {
      return err({
        type: 'INVALID_PATTERN',
        pattern,
        message: 'フォーマットパターンが指定されていません',
      });
    }

    // Basic validation - try to format a known date
    try {
      const testDate = new Date(2024, 0, 15, 14, 30, 0);
      format(testDate, pattern);
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'INVALID_PATTERN',
        pattern,
        message: `無効なフォーマットパターン: ${pattern}`,
      });
    }
  }

  /**
   * Validate an IANA timezone identifier
   */
  validateTimezone(timezone: string): Result<void, DateFormatError> {
    if (!timezone || timezone.trim() === '') {
      return err({
        type: 'INVALID_TIMEZONE',
        timezone,
        message: 'タイムゾーンが指定されていません',
      });
    }

    try {
      // Use Intl.DateTimeFormat to validate timezone
      new Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return ok(undefined);
    } catch {
      return err({
        type: 'INVALID_TIMEZONE',
        timezone,
        message: `無効なタイムゾーン: ${timezone}`,
      });
    }
  }
}
