import { NotFoundException } from '@nestjs/common';

/**
 * Exception thrown when an entity cannot be found by its identifier
 * Extends NestJS's built-in NotFoundException
 */
export class EntityNotFoundException extends NotFoundException {
  /**
   * Creates a new EntityNotFoundException
   * @param entityName The name of the entity that was not found
   * @param id Optional identifier of the entity that was searched for
   */
  constructor(entityName: string, id?: string) {
    super(id ? `${entityName} with ID ${id} not found` : `${entityName} not found`);
  }
}
