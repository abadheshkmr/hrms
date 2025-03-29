import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator that extracts the current tenant ID from the request
 * Can be used in controller methods to access the current tenant context
 *
 * @example
 * @Get('resources')
 * getResources(@CurrentTenant() tenantId: string) {
 *   return this.resourceService.findByTenant(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const tenantId = request['tenantId'] as string | undefined;
    return tenantId || null;
  },
);
