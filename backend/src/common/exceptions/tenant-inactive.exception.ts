import { ForbiddenException } from '@nestjs/common';

/**
 * Exception thrown when an operation is attempted on an inactive tenant
 * Extends NestJS's built-in ForbiddenException
 */
export class TenantInactiveException extends ForbiddenException {
  /**
   * Creates a new TenantInactiveException
   * @param tenantId The ID of the inactive tenant
   */
  constructor(tenantId: string) {
    super(`Tenant with ID ${tenantId} is inactive`);
  }
}
