import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Exception thrown when a business rule is violated
 * Extends NestJS's built-in UnprocessableEntityException
 */
export class BusinessRuleViolationException extends UnprocessableEntityException {
  /**
   * Creates a new BusinessRuleViolationException
   * @param rule The business rule that was violated
   * @param details Optional additional details about the violation
   */
  constructor(rule: string, details?: string) {
    super(`Business rule violated: ${rule}${details ? ` - ${details}` : ''}`);
  }
}
