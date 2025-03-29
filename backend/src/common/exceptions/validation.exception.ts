import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when validation of input data fails
 * Extends NestJS's built-in BadRequestException
 */
export class ValidationException extends BadRequestException {
  /**
   * Creates a new ValidationException
   * @param errors Record of validation errors by field
   */
  constructor(errors: Record<string, unknown>) {
    super({
      message: 'Validation failed',
      errors,
    });
  }
}
