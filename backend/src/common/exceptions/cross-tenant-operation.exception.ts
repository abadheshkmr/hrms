import { ForbiddenException } from '@nestjs/common';

/**
 * Exception thrown when an operation attempts to cross tenant boundaries
 * Extends NestJS's built-in ForbiddenException
 */
export class CrossTenantOperationException extends ForbiddenException {
  /**
   * Creates a new CrossTenantOperationException
   * @param operation The operation that was attempted
   * @param sourceTenantId The ID of the source tenant
   * @param targetTenantId The ID of the target tenant
   */
  constructor(operation: string, sourceTenantId: string, targetTenantId: string) {
    super(
      `Cross-tenant ${operation} not allowed from tenant ${sourceTenantId} to tenant ${targetTenantId}`,
    );
  }
}
