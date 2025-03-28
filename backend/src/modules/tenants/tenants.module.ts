import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { EventsModule } from '../../core/events/events.module';
import { CommonModule } from '../../common/common.module';
import { Address } from '../../common/entities/address.entity';
import { ContactInfo } from '../../common/entities/contact-info.entity';
import { TenantRepository } from './repositories/tenant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Address, ContactInfo]), EventsModule, CommonModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
