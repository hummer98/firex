/**
 * Logging service for structured logging with credential masking
 */

import fs from 'node:fs/promises';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LoggingOptions {
  verbose?: boolean;
  logFile?: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service for application logging with credential masking
 */
export class LoggingService {
  private verbose: boolean;
  private logFile?: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: LoggingOptions = {}) {
    this.verbose = options.verbose || false;
    this.logFile = options.logFile;
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log debug message (only when verbose is true)
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.verbose) {
      this.log('debug', message, metadata);
    }
  }

  /**
   * Core logging function
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.maskCredentials(message),
      metadata,
    };

    // Console output
    this.logToConsole(entry);

    // File output
    if (this.logFile) {
      this.logToFile(entry);
    }
  }

  /**
   * Log to console with appropriate method
   */
  private logToConsole(entry: LogEntry): void {
    const formatted = this.formatConsoleMessage(entry);

    switch (entry.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
      case 'debug':
        console.log(formatted);
        break;
    }
  }

  /**
   * Format message for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(JSON.stringify(entry.metadata));
    }

    return parts.join(' ');
  }

  /**
   * Log to file asynchronously
   */
  private logToFile(entry: LogEntry): void {
    if (!this.logFile) return;

    // Chain writes to ensure ordering
    this.writeQueue = this.writeQueue
      .then(async () => {
        const line = this.formatFileMessage(entry);
        await fs.appendFile(this.logFile!, line + '\n', 'utf-8');
      })
      .catch((error) => {
        console.error('Failed to write to log file:', error);
      });
  }

  /**
   * Format message for file output
   */
  private formatFileMessage(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      entry.level.toUpperCase(),
      entry.message,
    ];

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(JSON.stringify(entry.metadata));
    }

    return parts.join(' | ');
  }

  /**
   * Mask sensitive credentials in messages
   */
  private maskCredentials(message: string): string {
    let masked = message;

    // Mask file paths containing service account keys
    masked = masked.replace(
      /([\/\\][\w\-\.]+)*[\/\\](.*service[\-_]?account.*\.json)/gi,
      '[REDACTED]'
    );

    // Mask API keys (common patterns)
    masked = masked.replace(/AIza[0-9A-Za-z\-_]{15,}/g, '[REDACTED]');
    masked = masked.replace(
      /ya29\.[0-9A-Za-z\-_]+/g,
      '[REDACTED]'
    );

    // Mask other common credential patterns
    masked = masked.replace(
      /"private_key":\s*"[^"]+"/g,
      '"private_key": "[REDACTED]"'
    );
    masked = masked.replace(
      /"client_secret":\s*"[^"]+"/g,
      '"client_secret": "[REDACTED]"'
    );

    return masked;
  }
}
