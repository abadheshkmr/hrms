import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service';
import { TenantContextService } from '../../common/services/tenant-context.service';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Option 1: Extract tenant from subdomain (e.g., tenant1.mydomain.com)
      const host = req.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www') {
          try {
            const tenant = await this.tenantsService.findBySubdomain(subdomain);
            if (tenant.isActive) {
              req.tenantId = tenant.id;
              this.tenantContextService.setTenantId(tenant.id);
            }
          } catch (error) {
            // Tenant not found by subdomain, continue to other methods
          }
        }
      }

      // Option 2: Extract tenant from a custom header (e.g., x-tenant-id)
      const tenantIdHeader = req.headers['x-tenant-id'] as string;
      if (!req.tenantId && tenantIdHeader) {
        try {
          const tenant = await this.tenantsService.findById(tenantIdHeader);
          if (tenant.isActive) {
            req.tenantId = tenant.id;
            this.tenantContextService.setTenantId(tenant.id);
          }
        } catch (error) {
          // Tenant not found by header, continue to other methods
        }
      }

      // Option 3: Extract tenant from path parameter (e.g., /api/tenants/{tenantId}/resources)
      // This is useful for admin operations or cross-tenant operations
      const tenantIdFromPath = req.params.tenantId;
      if (!req.tenantId && tenantIdFromPath) {
        try {
          const tenant = await this.tenantsService.findById(tenantIdFromPath);
          if (tenant.isActive) {
            req.tenantId = tenant.id;
            this.tenantContextService.setTenantId(tenant.id);
          }
        } catch (error) {
          // Tenant not found in path, continue
        }
      }

      // If we're accessing tenant management APIs, we don't require a tenant ID
      if (req.path.startsWith('/tenants') || req.path.startsWith('/api/tenants')) {
        return next();
      }

      // For all other APIs, require a tenant ID
      if (!req.tenantId) {
        throw new NotFoundException('Tenant not found or inactive');
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
