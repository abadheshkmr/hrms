import { ForbiddenException } from '@nestjs/common';

/**
 * Exception thrown when a user attempts an operation without sufficient permissions
 * Extends NestJS's built-in ForbiddenException
 */
export class InsufficientPermissionsException extends ForbiddenException {
  /**
   * Creates a new InsufficientPermissionsException
   * @param resource The resource being accessed
   * @param permission The permission that was required
   */
  constructor(resource: string, permission: string) {
    super(`Insufficient permissions to ${permission} ${resource}`);
  }
}
