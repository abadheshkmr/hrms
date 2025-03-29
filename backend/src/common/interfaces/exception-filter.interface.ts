import { ArgumentsHost } from '@nestjs/common';

/**
 * Interface for all exception filters in the application
 */
export interface IExceptionFilter {
  /**
   * Method to handle exceptions
   * @param exception The caught exception
   * @param host The arguments host
   */
  catch(exception: unknown, host: ArgumentsHost): void;
}
