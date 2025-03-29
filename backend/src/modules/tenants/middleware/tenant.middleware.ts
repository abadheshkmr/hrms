import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantsService } from '../services/tenants.service';

/**
 * Middleware to extract and set tenant context for the current request
 * Extracts tenant ID from subdomain, header, or path parameter
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantsService: TenantsService,
  ) {}

  /**
   * Process the request and set tenant context
   * @param req Express request object
   * @param res Express response object
   * @param next Next function
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tenant ID using different strategies
      const tenantId = await this.extractTenantId(req);

      // Store tenant ID in request for easy access by controllers
      req['tenantId'] = tenantId || undefined;

      // Set tenant context using the service
      this.tenantContextService.runWithTenantId(tenantId, () => {
        next();
      });
    } catch {
      // If tenant extraction fails, continue without tenant context
      req['tenantId'] = undefined;
      this.tenantContextService.runWithTenantId(null, () => {
        next();
      });
    }
  }

  /**
   * Extract tenant ID from various sources in the request
   * @param req Express request object
   * @returns Extracted tenant ID or null
   */
  private async extractTenantId(req: Request): Promise<string | null> {
    // Priority 1: Check for X-Tenant-ID header
    const headerTenantId = req.header('X-Tenant-ID');
    if (headerTenantId) {
      const tenant = await this.validateTenantId(headerTenantId);
      if (tenant) return tenant.id;
    }

    // Priority 2: Extract from subdomain (e.g., tenant1.app.com)
    const host = req.get('host');
    if (host && host.includes('.') && !host.startsWith('www.')) {
      const subdomain = host.split('.')[0];
      const tenant = await this.tenantsService.findBySubdomain(subdomain);
      if (tenant) return tenant.id;
    }

    // Priority 3: Check path parameter (e.g., /api/tenants/tenant1/resources)
    const tenantIdParam = this.extractTenantIdFromPath(req.path);
    if (tenantIdParam) {
      const tenant = await this.validateTenantId(tenantIdParam);
      if (tenant) return tenant.id;
    }

    return null;
  }

  /**
   * Extract tenant ID from URL path if it follows expected pattern
   * @param path Request path
   * @returns Extracted tenant ID or null
   */
  private extractTenantIdFromPath(path: string): string | null {
    // Match paths like /api/tenants/:tenantId/xxx
    const match = path.match(/\/tenants\/([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate that a tenant ID exists and is active
   * @param tenantId Tenant ID to validate
   * @returns Tenant entity if valid, null otherwise
   */
  private async validateTenantId(tenantId: string) {
    try {
      const tenant = await this.tenantsService.findById(tenantId);
      return tenant?.isActive ? tenant : null;
    } catch {
      return null;
    }
  }
}
