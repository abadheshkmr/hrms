import { Injectable, Logger } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantContextService } from './tenant-context.service';
import {
  InactiveTenantException,
  MissingTenantContextException,
  TenantNotFoundException,
} from '../exceptions/tenant-exceptions';

/**
 * Result of a tenant validation operation
 */
export interface TenantValidationResult {
  tenantId: string;
  isValid: boolean;
  exists: boolean;
  isActive: boolean;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  validatedAt: Date;
}

/**
 * Hook type for tenant validation
 */
export type ValidationHook = (tenantId: string, result: TenantValidationResult) => Promise<void>;

/**
 * Validation error details
 */
export class ValidationError extends Error {
  constructor(
    public readonly tenantId: string,
    public readonly errorCode: string,
    message: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Service for validating tenant access, status, and existence
 * Centralizes tenant validation logic across the application
 * Provides caching, batch validation, and extensibility with hooks
 */
@Injectable()
export class TenantValidationService {
  private readonly cache = new Map<string, TenantValidationResult>();
  private readonly logger = new Logger(TenantValidationService.name);
  private readonly preValidationHooks: ValidationHook[] = [];
  private readonly postValidationHooks: ValidationHook[] = [];
  private cacheTTLMs = 60000; // 1 minute cache by default

  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Configure cache TTL (Time to Live) for validation results
   * @param ttlMs Time to live in milliseconds
   */
  setCacheTTL(ttlMs: number): void {
    this.cacheTTLMs = ttlMs;
  }

  /**
   * Clear the validation cache for a specific tenant or all tenants
   * @param tenantId Optional tenant ID to clear cache for
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.cache.delete(tenantId);
      this.logger.debug(`Cleared validation cache for tenant: ${tenantId}`);
    } else {
      this.cache.clear();
      this.logger.debug('Cleared all tenant validation cache');
    }
  }

  /**
   * Register a pre-validation hook
   * @param hook Function to execute before validation
   */
  registerPreValidationHook(hook: ValidationHook): void {
    this.preValidationHooks.push(hook);
  }

  /**
   * Register a post-validation hook
   * @param hook Function to execute after validation
   */
  registerPostValidationHook(hook: ValidationHook): void {
    this.postValidationHooks.push(hook);
  }

  /**
   * Execute all pre-validation hooks
   * @param tenantId Tenant ID being validated
   * @param result Current validation result
   */
  private async executePreValidationHooks(
    tenantId: string,
    result: TenantValidationResult,
  ): Promise<void> {
    for (const hook of this.preValidationHooks) {
      try {
        await hook(tenantId, result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Pre-validation hook error for tenant ${tenantId}: ${errorMessage}`);
      }
    }
  }

  /**
   * Execute all post-validation hooks
   * @param tenantId Tenant ID being validated
   * @param result Current validation result
   */
  private async executePostValidationHooks(
    tenantId: string,
    result: TenantValidationResult,
  ): Promise<void> {
    for (const hook of this.postValidationHooks) {
      try {
        await hook(tenantId, result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Post-validation hook error for tenant ${tenantId}: ${errorMessage}`);
      }
    }
  }

  /**
   * Get cached validation result if available and not expired
   * @param tenantId Tenant ID to get cache for
   * @returns Cached validation result or null if not in cache or expired
   */
  private getCachedValidation(tenantId: string): TenantValidationResult | null {
    const cachedResult = this.cache.get(tenantId);
    if (!cachedResult) {
      return null;
    }

    // Check if cache has expired
    const now = new Date();
    const cacheAge = now.getTime() - cachedResult.validatedAt.getTime();
    if (cacheAge > this.cacheTTLMs) {
      this.cache.delete(tenantId);
      return null;
    }

    return cachedResult;
  }

  /**
   * Validate that a tenant exists and is active
   * @param tenantId The tenant ID to validate
   * @param skipCache Whether to skip cache and force a fresh validation
   * @returns Promise resolving to true if tenant is valid, throws exception otherwise
   */
  async validateTenantActive(tenantId?: string, skipCache = false): Promise<boolean> {
    const currentTenantId = tenantId || this.tenantContextService.getCurrentTenantId();

    if (!currentTenantId) {
      throw new MissingTenantContextException();
    }

    // Try to get from cache unless skipCache is true
    if (!skipCache) {
      const cachedResult = this.getCachedValidation(currentTenantId);
      if (cachedResult) {
        this.logger.debug(`Using cached validation result for tenant: ${currentTenantId}`);
        if (!cachedResult.isValid) {
          if (!cachedResult.exists) {
            throw new TenantNotFoundException(currentTenantId);
          }
          if (!cachedResult.isActive) {
            throw new InactiveTenantException(currentTenantId);
          }
        }
        return cachedResult.isValid;
      }
    }

    // Prepare initial validation result
    const validationResult: TenantValidationResult = {
      tenantId: currentTenantId,
      isValid: false,
      exists: false,
      isActive: false,
      validatedAt: new Date(),
    };

    // Execute pre-validation hooks
    await this.executePreValidationHooks(currentTenantId, validationResult);

    try {
      const tenant = await this.tenantsService.findById(currentTenantId);
      validationResult.exists = true;
      validationResult.isActive = tenant.isActive;
      validationResult.isValid = tenant.isActive;
      if (!tenant.isActive) {
        validationResult.errorCode = 'TENANT_INACTIVE';
        validationResult.errorMessage = `Tenant ${currentTenantId} is inactive`;
        this.cache.set(currentTenantId, validationResult);
        // Execute post-validation hooks
        await this.executePostValidationHooks(currentTenantId, validationResult);
        throw new InactiveTenantException(currentTenantId);
      }

      // Cache the successful result
      this.cache.set(currentTenantId, validationResult);

      // Execute post-validation hooks
      await this.executePostValidationHooks(currentTenantId, validationResult);

      return true;
    } catch (err) {
      if (err instanceof InactiveTenantException) {
        throw err;
      }
      validationResult.errorCode = 'TENANT_NOT_FOUND';
      validationResult.errorMessage = `Tenant ${currentTenantId} not found`;
      this.cache.set(currentTenantId, validationResult);

      // Execute post-validation hooks
      await this.executePostValidationHooks(currentTenantId, validationResult);

      throw new TenantNotFoundException(currentTenantId);
    }
  }

  /**
   * Validate that a tenant exists
   * @param tenantId The tenant ID to validate
   * @param skipCache Whether to skip cache and force a fresh validation
   * @returns Promise resolving to true if tenant exists, throws exception otherwise
   */
  async validateTenantExists(tenantId?: string, skipCache = false): Promise<boolean> {
    const currentTenantId = tenantId || this.tenantContextService.getCurrentTenantId();

    if (!currentTenantId) {
      throw new MissingTenantContextException();
    }

    // Try to get from cache unless skipCache is true
    if (!skipCache) {
      const cachedResult = this.getCachedValidation(currentTenantId);
      if (cachedResult) {
        this.logger.debug(`Using cached validation result for tenant: ${currentTenantId}`);
        if (!cachedResult.exists) {
          throw new TenantNotFoundException(currentTenantId);
        }
        return cachedResult.exists;
      }
    }

    // Prepare initial validation result
    const validationResult: TenantValidationResult = {
      tenantId: currentTenantId,
      isValid: false,
      exists: false,
      isActive: false,
      validatedAt: new Date(),
    };

    // Execute pre-validation hooks
    await this.executePreValidationHooks(currentTenantId, validationResult);

    try {
      const tenant = await this.tenantsService.findById(currentTenantId);
      validationResult.exists = true;
      validationResult.isActive = tenant.isActive;
      validationResult.isValid = tenant.isActive;

      // Cache the result
      this.cache.set(currentTenantId, validationResult);

      // Execute post-validation hooks
      await this.executePostValidationHooks(currentTenantId, validationResult);

      return true;
    } catch {
      validationResult.errorCode = 'TENANT_NOT_FOUND';
      validationResult.errorMessage = `Tenant ${currentTenantId} not found`;
      this.cache.set(currentTenantId, validationResult);

      // Execute post-validation hooks
      await this.executePostValidationHooks(currentTenantId, validationResult);

      throw new TenantNotFoundException(currentTenantId);
    }
  }

  /**
   * Validate tenant access based on user permissions
   * @param tenantId The tenant ID to check access for
   * @param userId The user ID to check access for
   * @param skipCache Whether to skip cache and force a fresh validation
   * @returns Promise resolving to true if access is allowed, throws exception otherwise
   */
  async validateTenantAccess(
    tenantId: string,
    userId: string,
    skipCache = false,
  ): Promise<boolean> {
    // First check if tenant exists and is active
    await this.validateTenantActive(tenantId, skipCache);

    // Prepare validation metadata for hooks
    const validationResult: TenantValidationResult = {
      tenantId,
      isValid: true,
      exists: true,
      isActive: true,
      validatedAt: new Date(),
      metadata: { userId, accessType: 'standard' },
    };

    // Execute pre-validation hooks - may modify validationResult
    await this.executePreValidationHooks(tenantId, validationResult);

    // TODO: Implement actual permission logic here
    // This would typically check user roles and permissions against the tenant
    // For now, we just return true if the tenant is active

    // If permission check fails, you could set this and throw:
    // validationResult.isValid = false;
    // validationResult.errorCode = 'UNAUTHORIZED_ACCESS';
    // validationResult.errorMessage = `User ${userId} does not have access to tenant ${tenantId}`;
    // throw new UnauthorizedTenantAccessException(tenantId);

    // Execute post-validation hooks
    await this.executePostValidationHooks(tenantId, validationResult);

    return validationResult.isValid;
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

  /**
   * Perform full validation on a tenant and return detailed result
   * @param tenantId The tenant ID to validate
   * @param skipCache Whether to skip cache and force a fresh validation
   * @returns Detailed validation result object
   */
  async getDetailedValidation(
    tenantId: string,
    skipCache = false,
  ): Promise<TenantValidationResult> {
    // Try to get from cache unless skipCache is true
    if (!skipCache) {
      const cachedResult = this.getCachedValidation(tenantId);
      if (cachedResult) {
        this.logger.debug(`Using cached validation result for tenant: ${tenantId}`);
        return { ...cachedResult };
      }
    }

    const validationResult: TenantValidationResult = {
      tenantId,
      isValid: false,
      exists: false,
      isActive: false,
      validatedAt: new Date(),
    };

    // Execute pre-validation hooks
    await this.executePreValidationHooks(tenantId, validationResult);

    try {
      const tenant = await this.tenantsService.findById(tenantId);
      validationResult.exists = true;
      validationResult.isActive = tenant.isActive;
      validationResult.isValid = tenant.isActive;

      if (!tenant.isActive) {
        validationResult.errorCode = 'TENANT_INACTIVE';
        validationResult.errorMessage = `Tenant ${tenantId} is inactive`;
      }
    } catch {
      validationResult.errorCode = 'TENANT_NOT_FOUND';
      validationResult.errorMessage = `Tenant ${tenantId} not found`;
    }

    // Cache the result
    this.cache.set(tenantId, validationResult);

    // Execute post-validation hooks
    await this.executePostValidationHooks(tenantId, validationResult);

    return validationResult;
  }

  /**
   * Batch validate multiple tenants at once
   * @param tenantIds Array of tenant IDs to validate
   * @param skipCache Whether to skip cache and force fresh validation for all tenants
   * @returns Map of tenant IDs to validation results
   */
  async batchValidate(
    tenantIds: string[],
    skipCache = false,
  ): Promise<Map<string, TenantValidationResult>> {
    this.logger.debug(`Performing batch validation for ${tenantIds.length} tenants`);

    const resultMap = new Map<string, TenantValidationResult>();
    const validationPromises: Promise<void>[] = [];

    for (const tenantId of tenantIds) {
      validationPromises.push(
        this.getDetailedValidation(tenantId, skipCache)
          .then((result) => {
            resultMap.set(tenantId, result);
          })
          .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error validating tenant ${tenantId}: ${errorMessage}`);
            resultMap.set(tenantId, {
              tenantId,
              isValid: false,
              exists: false,
              isActive: false,
              errorCode: 'VALIDATION_ERROR',
              errorMessage: errorMessage,
              validatedAt: new Date(),
            });
          }),
      );
    }

    // Use tenant context's promise.all utility to maintain context
    await this.tenantContextService.promiseAllWithContext(validationPromises);

    return resultMap;
  }
}
