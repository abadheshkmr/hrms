import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EventsService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishTenantCreated(tenantData: any): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.created', // routing key
      {
        tenant: tenantData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  async publishTenantUpdated(tenantData: any): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.updated', // routing key
      {
        tenant: tenantData,
        timestamp: new Date().toISOString(),
      },
    );
  }

  async publishTenantDeleted(tenantId: string): Promise<void> {
    await this.amqpConnection.publish(
      'hrms-events', // exchange
      'tenant.deleted', // routing key
      {
        tenantId,
        timestamp: new Date().toISOString(),
      },
    );
  }
}
