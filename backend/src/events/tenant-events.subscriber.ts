import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';

@Injectable()
export class TenantEventsSubscriber {
  private readonly logger = new Logger(TenantEventsSubscriber.name);

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
  }
}
