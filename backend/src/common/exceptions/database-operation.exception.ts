import { InternalServerErrorException } from '@nestjs/common';

/**
 * Exception thrown when a database operation fails
 * Extends NestJS's built-in InternalServerErrorException
 */
export class DatabaseOperationException extends InternalServerErrorException {
  /**
   * Creates a new DatabaseOperationException
   * @param operation The database operation that failed (e.g., 'create', 'update', 'delete')
   * @param entity The entity type on which the operation was attempted
   * @param error Optional error details
   */
  constructor(operation: string, entity: string, error?: string) {
    super(`Database ${operation} failed for ${entity}${error ? `: ${error}` : ''}`);
  }
}
