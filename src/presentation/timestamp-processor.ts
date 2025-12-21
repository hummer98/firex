/**
 * TimestampProcessor - Recursively processes data to convert Firestore Timestamps
 */

import { Result, ok, err } from '../shared/types';
import {
  DateFormatter,
  DateFormatError,
  FirestoreTimestampLike,
} from './date-formatter';

/**
 * Options for timestamp processing
 */
export interface TimestampProcessorOptions {
  dateFormat: string;
  timezone: string;
  noDateFormat: boolean;
}

/**
 * Processor for recursively converting Firestore Timestamps in data structures
 */
export class TimestampProcessor {
  constructor(private readonly formatter: DateFormatter) {}

  /**
   * Check if a value is a Firestore Timestamp-like object
   */
  isTimestamp(value: unknown): value is FirestoreTimestampLike {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value !== 'object') {
      return false;
    }

    // Check for array
    if (Array.isArray(value)) {
      return false;
    }

    // Check for Date object
    if (value instanceof Date) {
      return false;
    }

    const obj = value as Record<string, unknown>;

    // Check for _seconds and _nanoseconds properties
    const hasSeconds =
      '_seconds' in obj && typeof obj._seconds === 'number';
    const hasNanoseconds =
      '_nanoseconds' in obj && typeof obj._nanoseconds === 'number';

    return hasSeconds && hasNanoseconds;
  }

  /**
   * Process data recursively to convert all Timestamp fields
   */
  processData<T>(
    data: T,
    options: TimestampProcessorOptions
  ): Result<T, DateFormatError> {
    // If noDateFormat is true, return data as-is
    if (options.noDateFormat) {
      return ok(data);
    }

    try {
      const processed = this.processValue(data, options);
      return ok(processed as T);
    } catch (error) {
      return err({
        type: 'FORMAT_ERROR',
        message: `データの処理に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }

  /**
   * Process a single value (recursive helper)
   */
  private processValue(
    value: unknown,
    options: TimestampProcessorOptions
  ): unknown {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle primitives
    if (typeof value !== 'object') {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.processValue(item, options));
    }

    // Check if it's a Timestamp
    if (this.isTimestamp(value)) {
      return this.formatTimestamp(value, options);
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = this.processValue(val, options);
    }
    return result;
  }

  /**
   * Format a Timestamp value
   */
  private formatTimestamp(
    timestamp: FirestoreTimestampLike,
    options: TimestampProcessorOptions
  ): string {
    // Create a proper timestamp with toDate method if it doesn't exist
    const timestampWithToDate: FirestoreTimestampLike = {
      _seconds: timestamp._seconds,
      _nanoseconds: timestamp._nanoseconds,
      toDate:
        timestamp.toDate ||
        (() => new Date(timestamp._seconds * 1000)),
    };

    const result = this.formatter.format(timestampWithToDate, {
      pattern: options.dateFormat,
      timezone: options.timezone,
    });

    if (result.isErr()) {
      // On error, return a fallback representation
      return new Date(timestamp._seconds * 1000).toISOString();
    }

    return result.value;
  }
}
