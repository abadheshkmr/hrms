import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Response } from 'express';
import { TenantContextService } from '../services/tenant-context.service';
import { MissingTenantContextException } from '../exceptions/tenant-exceptions';
import { Reflector } from '@nestjs/core';
import { TENANT_OPTIONAL } from '../guards/tenant-auth.guard';

/**
 * Interceptor for tenant-specific request processing
 * Adds tenant information to responses and handles tenant-specific errors
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Get the response object for setting headers
    const response = context.switchToHttp().getResponse<Response>();
    // Check if tenant context is optional for this handler
    const isTenantOptional = this.reflector.get<boolean>(TENANT_OPTIONAL, context.getHandler());

    // Get current tenant ID
    const tenantId = this.tenantContextService.getCurrentTenantId();
    // If tenant is required but not found, throw an exception
    if (!tenantId && !isTenantOptional) {
      return throwError(() => new MissingTenantContextException());
    }
    // Add tenant header to response if available
    if (tenantId) {
      response.setHeader('X-Tenant-ID', tenantId);
    }

    return next.handle().pipe(
      // Handle errors related to tenant operations
      catchError((error: unknown) => {
        // Add tenant information to error response if possible
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          tenantId
        ) {
          (error.response as Record<string, unknown>).tenantId = tenantId;
        }
        // Log tenant-specific errors for debugging
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          'message' in error &&
          error.status !== HttpStatus.NOT_FOUND
        ) {
          console.error(`Tenant error [${tenantId || 'no-tenant'}]:`, error.message);
        }
        return throwError(() => error);
      }),
      // Optionally transform the response to include tenant information
      tap((data: unknown) => {
        if (data && tenantId && typeof data === 'object') {
          // Don't modify the response if it's a stream or buffer
          if (!Buffer.isBuffer(data) && !('pipe' in data)) {
            // Only add tenant info to the response if not already present
            if (!('_tenantInfo' in data)) {
              // Adding tenant info in a non-intrusive way
              Object.defineProperty(data, '_tenantInfo', {
                enumerable: false,
                value: { tenantId },
              });
            }
          }
        }
      }),
    );
  }
}
