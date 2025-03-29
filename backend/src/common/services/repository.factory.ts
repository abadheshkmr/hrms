import { Injectable } from '@nestjs/common';
import { EntityManager, DataSource } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { TenantBaseEntity } from '../entities/tenant-base.entity';
import { GenericRepository } from '../repositories/generic.repository';
import { TenantAwareRepository } from '../repositories/tenant-aware.repository';
import { TenantContextService } from '../../modules/tenants/services/tenant-context.service';

/**
 * Factory service for creating repositories dynamically
 * Abstracts away the creation details and dependency injection
 */
@Injectable()
export class RepositoryFactory {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a generic repository for an entity type
   * @param entityType - Entity class
   * @returns GenericRepository instance for the entity type
   */
  createGenericRepository<T extends BaseEntity>(entityType: new () => T): GenericRepository<T> {
    return new GenericRepository<T>(this.dataSource.manager, entityType);
  }

  /**
   * Create a tenant-aware repository for an entity type
   * @param entityType - Entity class that extends TenantBaseEntity
   * @returns TenantAwareRepository instance for the entity type
   */
  createTenantAwareRepository<T extends TenantBaseEntity>(
    entityType: new () => T,
  ): TenantAwareRepository<T> {
    return new TenantAwareRepository<T>(
      this.dataSource.manager,
      entityType,
      this.tenantContextService,
    );
  }

  /**
   * Create the appropriate repository type based on entity
   * @param entityType - Entity class
   * @returns Generic or TenantAware repository based on entity type
   */
  createRepository<T extends BaseEntity>(
    entityType: new () => T,
  ): GenericRepository<T> | TenantAwareRepository<T extends TenantBaseEntity ? T : never> {
    // Check if entity extends TenantBaseEntity
    const isTenantEntity =
      Object.getPrototypeOf(entityType.prototype) === TenantBaseEntity.prototype;

    if (isTenantEntity) {
      // Use a properly typed approach to avoid 'any' cast
      // First cast to unknown, then to the specific tenant entity type
      const tenantEntityType = entityType as unknown as new () => TenantBaseEntity;
      return this.createTenantAwareRepository(tenantEntityType) as TenantAwareRepository<
        T extends TenantBaseEntity ? T : never
      >;
    } else {
      return this.createGenericRepository(entityType);
    }
  }

  /**
   * Get the entity manager from the data source
   * Useful for custom queries and transactions
   * @returns EntityManager instance
   */
  getEntityManager(): EntityManager {
    return this.dataSource.manager;
  }
}
