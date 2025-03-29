import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TenantMiddleware } from './modules/tenants/middleware/tenant.middleware';
import { EventsModule } from './core/events/events.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ConfigModule, CommonModule, DatabaseModule, TenantsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'tenants', method: RequestMethod.ALL },
      )
      .forRoutes('*'); // Apply to all routes except excluded ones
  }
}
