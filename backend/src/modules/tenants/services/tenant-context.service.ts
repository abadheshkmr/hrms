import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Interface for the tenant context data structure
 */
interface TenantContext {
  tenantId: string | null;
}

/**
 * Service responsible for managing tenant context throughout request lifecycle
 * Uses AsyncLocalStorage to maintain context across async operations
 */
@Injectable()
export class TenantContextService {
  private readonly storage: AsyncLocalStorage<TenantContext>;

  constructor() {
    this.storage = new AsyncLocalStorage<TenantContext>();
  }

  /**
   * Get the current tenant ID from context
   * @returns The current tenant ID or null if not in tenant context
   */
  getCurrentTenantId(): string | null {
    const store = this.storage.getStore();
    return store?.tenantId || null;
  }

  /**
   * Set the current tenant context
   * @param tenantId The tenant ID to set in the context
   * @param callback Function to execute within this tenant context
   * @returns Result of the callback function
   */
  runWithTenantId<T>(tenantId: string | null, callback: () => T): T {
    return this.storage.run({ tenantId }, callback);
  }

  /**
   * Clear the current tenant context
   */
  clearCurrentTenant(): void {
    // AsyncLocalStorage context is automatically cleaned up after the callback completes
    // This method exists for explicit cleanup if needed
  }
}
