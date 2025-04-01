import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './controllers/tenants.controller';
import { TenantsService } from './services/tenants.service';
import { Tenant } from './entities/tenant.entity';
import { EventsModule } from '../../core/events/events.module';
import { CommonModule } from '../../common/common.module';
import { Address } from '../../common/entities/address.entity';
import { ContactInfo } from '../../common/entities/contact-info.entity';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantContextService } from './services/tenant-context.service';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { TenantHelperService } from './services/tenant-helper.service';
import { TenantMetricsService } from './services/tenant-metrics.service';
import { TenantTransactionService } from './services/tenant-transaction.service';
import { TenantLifecycleService } from './services/tenant-lifecycle.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Address, ContactInfo]), EventsModule, CommonModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    TenantHelperService,
    TenantMetricsService,
    TenantTransactionService,
    TenantLifecycleService,
    TenantRepository,
    TenantContextService,
  ],
  exports: [TenantsService, TenantContextService],
})
export class TenantsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes
    consumer.apply(TenantMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
