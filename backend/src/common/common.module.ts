import { Module } from '@nestjs/common';
import { TenantContextService } from './services/tenant-context.service';

@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class CommonModule {}
