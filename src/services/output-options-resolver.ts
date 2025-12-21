/**
 * OutputOptionsResolver - Resolves output options with priority handling
 */

import { TimezoneService } from './timezone';
import { OutputConfig } from './config';
import { DEFAULT_DATE_FORMAT } from '../presentation/date-formatter';

/**
 * CLI flags related to output options
 */
export interface OutputCliFlags {
  timezone?: string;
  dateFormat?: string;
  rawOutput?: boolean;
  noColor?: boolean;
  noDateFormat?: boolean;
}

/**
 * Sources for output options
 */
export interface OutputOptionSources {
  cliFlags: OutputCliFlags;
  config: OutputConfig;
}

/**
 * Resolved output options after priority resolution
 */
export interface ResolvedOutputOptions {
  dateFormat: string;
  timezone: string;
  color: boolean;
  rawOutput: boolean;
  noDateFormat: boolean;
}

/**
 * Resolver for output options with priority: CLI > env > config > defaults
 */
export class OutputOptionsResolver {
  constructor(private readonly timezoneService: TimezoneService) {}

  /**
   * Resolve output options from all sources
   * Priority: CLI flags > config (which includes env) > defaults
   */
  resolve(sources: OutputOptionSources): ResolvedOutputOptions {
    const { cliFlags, config } = sources;

    // Resolve dateFormat: CLI > config > default
    const dateFormat =
      cliFlags.dateFormat ?? config.dateFormat ?? DEFAULT_DATE_FORMAT;

    // Resolve timezone: CLI > config > system
    let timezone = cliFlags.timezone ?? config.timezone;
    if (!timezone) {
      timezone = this.timezoneService.getSystemTimezone();
    } else {
      // Validate and resolve timezone
      const resolution = this.timezoneService.resolveTimezone(timezone);
      if (resolution.warning) {
        console.error(resolution.warning);
      }
      timezone = resolution.timezone;
    }

    // Resolve color: CLI (noColor) > config > default (true)
    let color: boolean;
    if (cliFlags.noColor !== undefined) {
      color = !cliFlags.noColor;
    } else if (config.color !== undefined) {
      color = config.color;
    } else {
      color = true;
    }

    // Resolve rawOutput: CLI > config > default (false)
    const rawOutput = cliFlags.rawOutput ?? config.rawOutput ?? false;

    // Resolve noDateFormat: CLI > default (false)
    const noDateFormat = cliFlags.noDateFormat ?? false;

    return {
      dateFormat,
      timezone,
      color,
      rawOutput,
      noDateFormat,
    };
  }
}
