/**
 * Interface for the application logger service
 * Extends the NestJS LoggerService with additional context capabilities
 */
export interface ILogger {
  /**
   * Set the context for logging messages
   * @param context The context string (typically the class name)
   * @returns The logger instance for method chaining
   */
  setContext(context: string): this;

  /**
   * Log an informational message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  log(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log an error message
   * @param message The message to log
   * @param trace Optional stack trace
   * @param optionalParams Additional parameters to log
   */
  error(message: string, trace?: string, ...optionalParams: unknown[]): void;

  /**
   * Log a warning message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  warn(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log a debug message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  debug(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log a verbose message (detailed info)
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  verbose(message: string, ...optionalParams: unknown[]): void;
}
