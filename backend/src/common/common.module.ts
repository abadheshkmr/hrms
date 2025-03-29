import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContextService } from '../modules/tenants/services/tenant-context.service';
import { RepositoryFactory } from './services/repository.factory';

@Module({
  providers: [TenantContextService, RepositoryFactory],
  exports: [TenantContextService, RepositoryFactory],
})
export class CommonModule {
  /**
   * Create a dynamic module for common functionality
   * @returns Dynamic module configuration
   */
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: CommonModule,
      imports: [],
      providers: [TenantContextService, RepositoryFactory],
      exports: [TenantContextService, RepositoryFactory],
    };
  }

  /**
   * Create a feature module with specific entity repositories
   * @param entities - Entity classes to register repositories for
   * @returns Dynamic module configuration
   */
  static forFeature(entities: any[]): DynamicModule {
    return {
      module: CommonModule,
      imports: [TypeOrmModule.forFeature(entities)],
      providers: [TenantContextService, RepositoryFactory],
      exports: [TenantContextService, RepositoryFactory, TypeOrmModule],
    };
  }
}
