import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ILogger } from './interfaces/logger.interface';

/**
 * Logger service for the application
 * Provides context-aware logging throughout the application
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService, ILogger {
  private context?: string;
  private static instance: LoggerService;

  constructor() {
    // Create a singleton instance for use outside of NestJS context
    if (!LoggerService.instance) {
      LoggerService.instance = this;
    }
  }

  /**
   * Get a logger instance for use outside of NestJS context
   * @returns A logger instance
   */
  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Set the context for subsequent log messages
   * @param context The context (typically class name)
   * @returns The logger instance for method chaining
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Log an informational message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  log(message: string, ...optionalParams: unknown[]): void {
    this.printMessage('info', message, optionalParams);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param trace Optional stack trace
   * @param optionalParams Additional parameters to log
   */
  error(message: string, trace?: string, ...optionalParams: unknown[]): void {
    this.printMessage('error', message, optionalParams);

    if (trace) {
      console.error(trace);
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    this.printMessage('warn', message, optionalParams);
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    this.printMessage('debug', message, optionalParams);
  }

  /**
   * Log a verbose message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  verbose(message: string, ...optionalParams: unknown[]): void {
    this.printMessage('verbose', message, optionalParams);
  }

  /**
   * Internal method to format and print log messages
   * @param level The log level
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  private printMessage(level: string, message: string, optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : '';
    const formattedMessage = `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;

    switch (level) {
      case 'error':
        console.error(formattedMessage, ...optionalParams);
        break;
      case 'warn':
        console.warn(formattedMessage, ...optionalParams);
        break;
      case 'debug':
        console.debug(formattedMessage, ...optionalParams);
        break;
      case 'verbose':
        console.log(formattedMessage, ...optionalParams);
        break;
      default:
        console.log(formattedMessage, ...optionalParams);
    }
  }
}
