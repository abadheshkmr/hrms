import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  SelectQueryBuilder,
} from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantBaseEntity } from '../entities/tenant-base.entity';
import { GenericRepository } from './generic.repository';

/**
 * Exception thrown when attempting to access tenant-specific data without a tenant context
 */
export class TenantRequiredException extends Error {
  constructor() {
    super('Tenant context is required for this operation');
    this.name = 'TenantRequiredException';
  }
}

/**
 * Repository that automatically filters entities by the current tenant
 * All operations are scoped to the current tenant from TenantContextService
 * @template T - Entity type extending TenantBaseEntity
 */
@Injectable()
export class TenantAwareRepository<T extends TenantBaseEntity> extends GenericRepository<T> {
  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly entityType: new () => T,
    private readonly tenantContextService: TenantContextService,
  ) {
    super(entityManager, entityType);
  }

  /**
   * Get the current tenant ID or throw an exception if not set
   * @private
   * @returns Current tenant ID
   * @throws TenantRequiredException if tenant context is not set
   */
  private getCurrentTenantId(): string {
    const tenantId = this.tenantContextService.getTenantId();
    if (!tenantId) {
      throw new TenantRequiredException();
    }
    return tenantId;
  }

  /**
   * Apply tenant filtering to query options
   * @private
   * @param options - Query options to modify
   * @returns Modified query options with tenant filter
   */
  private applyTenantFilter<O extends FindManyOptions<T> | FindOneOptions<T>>(options: O): O {
    const tenantId = this.getCurrentTenantId();

    // Clone options to avoid modifying the original
    const newOptions = { ...options };

    // Initialize where if it doesn't exist
    if (!newOptions.where) {
      // Create a properly typed initial where clause
      newOptions.where = { tenantId } as FindOptionsWhere<T>;
    }

    // Add tenantId filter
    if (typeof newOptions.where === 'object' && !Array.isArray(newOptions.where)) {
      // Use type assertion with the constraint that T extends TenantBaseEntity
      // This ensures tenantId is valid for this entity type
      // TypeORM's typing system requires this pattern in some places
      type WhereClause = { tenantId: string } & Record<string, unknown>;
      Object.assign(newOptions.where, { tenantId } as WhereClause);
    }

    return newOptions;
  }

  /**
   * Override find method to apply tenant filtering
   * @param options - FindManyOptions for filtering
   * @returns Promise with array of entities for the current tenant
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const tenantOptions = this.applyTenantFilter(options || {});
    return super.find(tenantOptions);
  }

  /**
   * Override findOne method to apply tenant filtering
   * @param options - FindOneOptions for filtering
   * @returns Promise with entity or null if not found
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const tenantOptions = this.applyTenantFilter(options);
    return super.findOne(tenantOptions);
  }

  /**
   * Override findById method to apply tenant filtering
   * @param id - Entity ID
   * @returns Promise with entity or null if not found
   */
  async findById(id: string): Promise<T | null> {
    const tenantId = this.getCurrentTenantId();
    return this.repository.findOne({
      where: {
        id,
        tenantId,
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * Override create method to set tenant ID automatically
   * @param data - Entity data
   * @returns Promise with created entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const tenantId = this.getCurrentTenantId();
    const entityData = {
      ...data,
      tenantId,
    } as DeepPartial<T>;

    return super.create(entityData);
  }

  /**
   * Override update method to ensure entity belongs to current tenant
   * @param id - Entity ID
   * @param data - Entity data to update
   * @returns Promise with updated entity
   * @throws NotFoundException if entity doesn't exist for current tenant
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found for current tenant`);
    }

    // Update entity properties (preserving tenantId)
    Object.assign(entity, data);

    return this.repository.save(entity);
  }

  /**
   * Override remove method to ensure entity belongs to current tenant
   * @param id - Entity ID
   * @returns Promise with removed entity
   * @throws NotFoundException if entity doesn't exist for current tenant
   */
  async remove(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found for current tenant`);
    }

    if ('isDeleted' in entity) {
      entity.isDeleted = true;
      return this.repository.save(entity);
    } else {
      // Cast to unknown first, then to the correct promise type
      // This prevents TypeScript error with arrays vs single entities
      return this.repository.remove(entity) as unknown as Promise<T>;
    }
  }

  /**
   * Override count method to apply tenant filtering
   * @param options - FindManyOptions for filtering
   * @returns Promise with count for current tenant
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    const tenantOptions = this.applyTenantFilter(options || {});
    return super.count(tenantOptions);
  }

  /**
   * Override createQueryBuilder to apply tenant filtering
   * @param alias - Entity alias for query
   * @returns QueryBuilder instance with tenant filter
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const tenantId = this.getCurrentTenantId();
    return super.createQueryBuilder(alias).andWhere(`${alias}.tenantId = :tenantId`, { tenantId });
  }
}
