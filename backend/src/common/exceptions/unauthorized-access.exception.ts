import { UnauthorizedException } from '@nestjs/common';

/**
 * Exception thrown when an unauthenticated user attempts to access a protected resource
 * Extends NestJS's built-in UnauthorizedException
 */
export class UnauthorizedAccessException extends UnauthorizedException {
  /**
   * Creates a new UnauthorizedAccessException
   * @param resource The resource being accessed
   * @param details Optional additional context about the unauthorized access
   */
  constructor(resource: string, details?: string) {
    super(`Unauthorized access to ${resource}${details ? `: ${details}` : ''}`);
  }
}
