import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import { TenantContextService } from '../../common/services/tenant-context.service';

@Injectable()
export class TenantEventsSubscriber {
  private readonly logger = new Logger(TenantEventsSubscriber.name);

  constructor(private readonly tenantContextService: TenantContextService) {}

  @RabbitSubscribe({
    exchange: 'hrms-events',
    routingKey: 'tenant.created',
    queue: 'tenant-created-handler',
  })
  handleTenantCreated(msg: any) {
    this.logger.log(`Tenant created event received: ${JSON.stringify(msg)}`);
    // Here you could initialize tenant-specific resources
    // For example:
    // - Create tenant-specific database schema
    // - Set up default data for the tenant
    // - Provision resources for the tenant

    // Set tenant context if needed for operations
    if (msg.tenant && msg.tenant.id) {
      this.tenantContextService.setTenantId(msg.tenant.id);
    }
  }

  @RabbitSubscribe({
    exchange: 'hrms-events',
    routingKey: 'tenant.updated',
    queue: 'tenant-updated-handler',
  })
  handleTenantUpdated(msg: any) {
    this.logger.log(`Tenant updated event received: ${JSON.stringify(msg)}`);
    // Handle tenant update logic
    // For example:
    // - Update cache
    // - Update related services

    // Set tenant context if needed for operations
    if (msg.tenant && msg.tenant.id) {
      this.tenantContextService.setTenantId(msg.tenant.id);
    }
  }

  @RabbitSubscribe({
    exchange: 'hrms-events',
    routingKey: 'tenant.deleted',
    queue: 'tenant-deleted-handler',
  })
  handleTenantDeleted(msg: any) {
    this.logger.log(`Tenant deleted event received: ${JSON.stringify(msg)}`);
    // Clean up tenant resources
    // For example:
    // - Archive tenant data
    // - Release resources
    // - Update system metrics

    // Set tenant context if needed for operations
    if (msg.tenantId) {
      this.tenantContextService.setTenantId(msg.tenantId);
    }
  }
}
