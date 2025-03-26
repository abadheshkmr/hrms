import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { EventsService } from './events.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { TenantEventsSubscriber } from './tenant-events.subscriber';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.getRabbitMQConfig(),
    }),
  ],
  providers: [EventsService, TenantEventsSubscriber],
  exports: [EventsService],
})
export class EventsModule {}
