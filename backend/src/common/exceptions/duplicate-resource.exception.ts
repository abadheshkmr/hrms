import { ConflictException } from '@nestjs/common';

/**
 * Exception thrown when attempting to create a resource that already exists
 * Extends NestJS's built-in ConflictException
 */
export class DuplicateResourceException extends ConflictException {
  /**
   * Creates a new DuplicateResourceException
   * @param resource The type of resource that has a duplicate
   * @param field The field that contains the duplicate value
   * @param value The duplicate value
   */
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`);
  }
}
