import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Exception thrown when an external service call fails
 * Extends NestJS's built-in ServiceUnavailableException
 */
export class ExternalServiceException extends ServiceUnavailableException {
  /**
   * Creates a new ExternalServiceException
   * @param service The name of the external service
   * @param operation The operation that was attempted
   * @param error Optional error details
   */
  constructor(service: string, operation: string, error?: string) {
    super(`External service '${service}' failed during ${operation}${error ? `: ${error}` : ''}`);
  }
}
