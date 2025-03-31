import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when an entity is not found
 * Provides standardized entity not found error messages
 */
export class EntityNotFoundException extends NotFoundException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
  }
}

/**
 * Exception thrown when an entity already exists (e.g., unique constraint violation)
 * Provides standardized entity already exists error messages
 */
export class EntityAlreadyExistsException extends ConflictException {
  constructor(entityName: string, field: string, value: string) {
    super(`${entityName} with ${field} '${value}' already exists`);
  }
}

/**
 * Exception thrown when a bulk operation fails
 * Provides details about which entities failed and why
 */
export class BulkOperationException extends BadRequestException {
  constructor(
    operation: 'create' | 'update' | 'delete',
    errors: Array<{ id?: string; index: number; error: string }>,
  ) {
    super({
      message: `Bulk ${operation} operation failed for ${errors.length} items`,
      errors,
    });
  }
}

/**
 * Exception thrown when an entity state transition is invalid
 * E.g., when trying to change status from PENDING to TERMINATED when ACTIVE is required first
 */
export class InvalidStateTransitionException extends BadRequestException {
  constructor(entityName: string, id: string, fromState: string, toState: string, allowedTransitions: string[]) {
    super(
      `Invalid state transition for ${entityName} ${id}: ${fromState} → ${toState}. Allowed transitions: ${allowedTransitions.join(
        ', ',
      )}`,
    );
  }
}
