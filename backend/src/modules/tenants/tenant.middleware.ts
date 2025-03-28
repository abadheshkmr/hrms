import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantContextService } from '../../common/services/tenant-context.service';

// Extend Express Request interface to include tenantId
import 'express';

declare module 'express' {
  interface Request {
    tenantId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private readonly logger = new Logger(TenantMiddleware.name);

  // Helper method to determine if a route is public (no tenant required)
  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/health',
      '/api/docs',
      '/api/tenants',
    ];
    return publicRoutes.some((route) => path.startsWith(route));
  }
  // Helper method to determine if a route requires tenant identification
  private isTenantRequiredRoute(path: string): boolean {
    // All routes require tenant identification except public routes
    return !this.isPublicRoute(path);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenantIdentified = false;
      const requestPath = req.path;
      const isPublicRoute = this.isPublicRoute(requestPath);

      // Skip tenant identification for public routes
      if (isPublicRoute) {
        this.logger.debug(`Public route detected: ${requestPath}, skipping tenant identification`);
        return next();
      }

      // Priority 1: Extract tenant from subdomain (e.g., tenant1.mydomain.com)
      const host = req.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www') {
          try {
            this.logger.debug(`Attempting to identify tenant by subdomain: ${subdomain}`);
            const tenant = await this.tenantsService.findBySubdomain(subdomain);

            if (tenant && tenant.isActive) {
              req.tenantId = tenant.id;
              this.tenantContextService.setTenantId(tenant.id);
              tenantIdentified = true;
              this.logger.debug(`Tenant identified by subdomain: ${subdomain}, ID: ${tenant.id}`);
            } else if (tenant && !tenant.isActive) {
              this.logger.warn(`Tenant with subdomain ${subdomain} exists but is inactive`);
            }
          } catch (error) {
            if (error instanceof NotFoundException) {
              this.logger.debug(
                `Tenant not found by subdomain: ${subdomain}, trying other methods`,
              );
            } else {
              this.logger.error(
                `Error identifying tenant by subdomain: ${(error as Error).message}`,
              );
            }
          }
        }
      }

      // Priority 2: Extract tenant from a custom header (e.g., x-tenant-id)
      const tenantIdHeader = req.headers['x-tenant-id'] as string;
      if (!tenantIdentified && tenantIdHeader) {
        try {
          this.logger.debug(`Attempting to identify tenant by header: ${tenantIdHeader}`);
          const tenant = await this.tenantsService.findById(tenantIdHeader);
          if (tenant && tenant.isActive) {
            req.tenantId = tenant.id;
            this.tenantContextService.setTenantId(tenant.id);
            tenantIdentified = true;
            this.logger.debug(`Tenant identified by header, ID: ${tenant.id}`);
          } else if (tenant && !tenant.isActive) {
            this.logger.warn(`Tenant with ID ${tenantIdHeader} exists but is inactive`);
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            this.logger.debug(
              `Tenant not found by header: ${tenantIdHeader}, trying other methods`,
            );
          } else {
            this.logger.error(`Error identifying tenant by header: ${(error as Error).message}`);
          }
        }
      }

      // Option 3: Extract tenant from path parameter (e.g., /api/tenants/{tenantId}/resources)
      // This is useful for admin operations or cross-tenant operations
      const tenantIdFromPath = req.params.tenantId;
      if (!tenantIdentified && tenantIdFromPath) {
        try {
          this.logger.debug(`Attempting to identify tenant by path parameter: ${tenantIdFromPath}`);
          const tenant = await this.tenantsService.findById(tenantIdFromPath);
          if (tenant && tenant.isActive) {
            req.tenantId = tenant.id;
            this.tenantContextService.setTenantId(tenant.id);
            tenantIdentified = true;
            this.logger.debug(`Tenant identified by path parameter, ID: ${tenant.id}`);
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            this.logger.debug(`Tenant not found by path parameter: ${tenantIdFromPath}`);
          } else {
            this.logger.error(
              `Error identifying tenant by path parameter: ${(error as Error).message}`,
            );
          }
        }
      }

      // If we're accessing tenant management APIs, we don't require a tenant ID
      // Double-check for tenant API paths as they don't require tenant identification
      if (req.path.startsWith('/tenants') || req.path.startsWith('/api/tenants')) {
        this.logger.debug(`Tenant API access - no tenant ID required for path: ${req.path}`);
        // Clear any existing tenant context for tenant management APIs to avoid cross-tenant issues
        this.tenantContextService.clearTenantId();
        return next();
      }

      if (!tenantIdentified) {
        this.logger.debug('No tenant identified for this request');
        // Clear any existing tenant context to avoid security issues
        this.tenantContextService.clearTenantId();

        // If tenant required but not found, handle the error condition
        if (this.isTenantRequiredRoute(requestPath)) {
          this.logger.warn(`Tenant required but not identified for route: ${requestPath}`);
          return res.status(401).json({
            statusCode: 401,
            message: 'Tenant identification required for this resource',
          });
        }
      }

      next();
    } catch (error) {
      this.logger.error(`Error in tenant middleware: ${(error as Error).message}`);
      next(error);
    }
  }
}
