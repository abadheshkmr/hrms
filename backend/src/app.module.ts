import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { TenantMiddleware } from './tenants/tenant.middleware';
import { EventsModule } from './events/events.module';

@Module({
  imports: [ConfigModule, DatabaseModule, TenantsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'tenants', method: RequestMethod.ALL }
      )
      .forRoutes('*'); // Apply to all routes except excluded ones
  }
}
