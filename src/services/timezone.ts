/**
 * TimezoneService - Timezone detection and validation
 */

import { Result, ok, err } from '../shared/types';

/**
 * Timezone error type
 */
export type TimezoneError = {
  type: 'INVALID_TIMEZONE';
  timezone: string;
  message: string;
};

/**
 * Timezone resolution result
 */
export interface TimezoneResolution {
  timezone: string;
  warning?: string;
}

/**
 * Service for timezone detection and validation
 */
export class TimezoneService {
  /**
   * Get the system's timezone using Intl API
   * @returns IANA timezone name (e.g., 'Asia/Tokyo', 'America/New_York')
   */
  getSystemTimezone(): string {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timezone) {
        return 'UTC';
      }
      return timezone;
    } catch {
      return 'UTC';
    }
  }

  /**
   * Validate an IANA timezone identifier
   * @param timezone - Timezone identifier to validate
   * @returns Ok with normalized timezone name, or Err with validation error
   */
  validateTimezone(timezone: string): Result<string, TimezoneError> {
    if (!timezone || timezone.trim() === '') {
      return err({
        type: 'INVALID_TIMEZONE',
        timezone,
        message: 'タイムゾーンが指定されていません',
      });
    }

    try {
      // Use Intl.DateTimeFormat to validate the timezone
      // This will throw a RangeError if the timezone is invalid
      new Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return ok(timezone);
    } catch (error) {
      return err({
        type: 'INVALID_TIMEZONE',
        timezone,
        message: `無効なタイムゾーン: ${timezone}`,
      });
    }
  }

  /**
   * Resolve a timezone with fallback to UTC for invalid values
   * @param timezone - Timezone identifier to resolve
   * @returns Resolved timezone with optional warning message
   */
  resolveTimezone(timezone: string): TimezoneResolution {
    const result = this.validateTimezone(timezone);

    if (result.isOk()) {
      return { timezone: result.value };
    }

    return {
      timezone: 'UTC',
      warning: `無効なタイムゾーン "${timezone}" が指定されました。UTCにフォールバックします。`,
    };
  }
}
