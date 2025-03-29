import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { TenantValidationService } from '../services/tenant-validation.service';

/**
 * Guard that validates tenant existence, status, and permissions
 * Can be applied to controllers or individual routes to protect tenant-specific endpoints
 */
@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantValidationService: TenantValidationService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // Get the tenant ID from the request (set by the TenantMiddleware)
    const tenantId = request['tenantId'] as string | undefined;
    // TODO: Get the user ID from the auth context when auth is implemented
    // For now, we just validate that the tenant exists and is active
    return this.tenantValidationService.validateTenantActive(tenantId);
  }
}

/**
 * Metadata key for optional tenant validation
 */
export const TENANT_OPTIONAL = 'tenant_optional';

/**
 * Decorator that marks a controller or route as not requiring tenant context
 * This is useful for routes that should be accessible outside of tenant context
 */
/**
 * Import the required metadata API
 */
import 'reflect-metadata';

export const TenantOptional = () => {
  // Use more specific types for the decorator
  return (
    target: Record<string, unknown>,
    key?: string,
    descriptor?: PropertyDescriptor,
  ): PropertyDescriptor => {
    // Ensure descriptor exists before using it
    if (!descriptor) {
      throw new Error('Cannot apply TenantOptional decorator to a property without a descriptor');
    }
    // Use the Reflect metadata API directly instead of Reflector which is meant for dependency injection
    Reflect.defineMetadata(TENANT_OPTIONAL, true, descriptor.value as object);
    return descriptor;
  };
};
