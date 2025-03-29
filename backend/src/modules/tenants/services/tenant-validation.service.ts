import { Injectable } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantContextService } from './tenant-context.service';
import {
  InactiveTenantException,
  MissingTenantContextException,
  TenantNotFoundException,
} from '../exceptions/tenant-exceptions';

/**
 * Service for validating tenant access, status, and existence
 * Centralizes tenant validation logic across the application
 */
@Injectable()
export class TenantValidationService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Validate that a tenant exists and is active
   * @param tenantId The tenant ID to validate
   * @returns Promise resolving to true if tenant is valid, throws exception otherwise
   */
  async validateTenantActive(tenantId?: string): Promise<boolean> {
    const currentTenantId = tenantId || this.tenantContextService.getCurrentTenantId();

    if (!currentTenantId) {
      throw new MissingTenantContextException();
    }

    try {
      const tenant = await this.tenantsService.findById(currentTenantId);
      if (!tenant.isActive) {
        throw new InactiveTenantException(currentTenantId);
      }
      return true;
    } catch (err) {
      if (err instanceof InactiveTenantException) {
        throw err;
      }
      throw new TenantNotFoundException(currentTenantId);
    }
  }

  /**
   * Validate that a tenant exists
   * @param tenantId The tenant ID to validate
   * @returns Promise resolving to true if tenant exists, throws exception otherwise
   */
  async validateTenantExists(tenantId?: string): Promise<boolean> {
    const currentTenantId = tenantId || this.tenantContextService.getCurrentTenantId();

    if (!currentTenantId) {
      throw new MissingTenantContextException();
    }

    try {
      await this.tenantsService.findById(currentTenantId);
      return true;
    } catch {
      throw new TenantNotFoundException(currentTenantId);
    }
  }

  /**
   * Validate tenant access based on user permissions
   * @param tenantId The tenant ID to check access for
   * @param _userId The user ID to check access for
   * @returns Promise resolving to true if access is allowed, throws exception otherwise
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateTenantAccess(tenantId: string, _userId: string): Promise<boolean> {
    // First check if tenant exists and is active
    await this.validateTenantActive(tenantId);

    // TODO: Implement actual permission logic here
    // This would typically check user roles and permissions
    // For now, we just return true if the tenant is active

    // If permission check fails, throw this exception:
    // throw new UnauthorizedTenantAccessException(tenantId);

    return true;
  }

  /**
   * Validate that current operation is performed in a tenant context
   * @returns The current tenant ID if available
   * @throws MissingTenantContextException if no tenant context is present
   */
  getCurrentTenantIdOrFail(): string {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new MissingTenantContextException();
    }

    return tenantId;
  }
}
