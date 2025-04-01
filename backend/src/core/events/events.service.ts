import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { TenantData } from '../../common/interfaces/tenant.interface';

@Injectable()
export class EventsService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishTenantCreated(tenantData: TenantData): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.created', // routing key
      {
        tenant: tenantData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  async publishTenantUpdated(tenantData: TenantData): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.updated', // routing key
      {
        tenant: tenantData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  async publishTenantDeleted(tenantId: string): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.deleted', // routing key
      {
        tenantId,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Publish event when a tenant has been provisioned
   * @param tenantData - Data about the provisioned tenant
   */
  async publishTenantProvisioned(tenantData: TenantData): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.provisioned', // routing key
      {
        tenant: tenantData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Publish event when a tenant has been deprovisioned
   * @param tenantData - Data about the deprovisioned tenant
   */
  async publishTenantDeprovisioned(tenantData: TenantData): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.deprovisioned', // routing key
      {
        tenant: tenantData,
        timestamp: new Date().toISOString(),
      }
    );
  }
}
