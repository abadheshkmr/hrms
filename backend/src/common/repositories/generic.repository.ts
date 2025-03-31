import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  DeepPartial,
  SelectQueryBuilder,
  In,
} from 'typeorm';

// Define IsolationLevel as it's missing from typeorm (will be used for transaction management)
type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
import { BaseEntity } from '../entities/base.entity';
import {
  EntityNotFoundException,
  BulkOperationException,
} from '../exceptions/repository.exceptions';
import {
  PaginationOptions,
  PaginatedResult,
  CursorPaginatedResult,
  BulkOperationOptions,
  BulkOperationResult,
} from '../types/pagination.types';
// TODO: [REDIS] HRMS-CACHE-003 - Import ICacheManager for caching support when Redis is implemented

/**
 * Generic repository for basic CRUD operations
 * Provides standard repository functionality with type safety
 *
 * Features:
 * - Standard CRUD operations
 * - Pagination support (offset and cursor-based)
 * - Bulk operations
 * - Transaction support
 * - Error handling
 * - Soft delete support
 *
 * TODO: [REDIS] HRMS-CACHE-004 - Add caching features when Redis is implemented
 * - Implement cache key generation strategy
 * - Add cache TTL configuration per entity type
 * - Add cache invalidation on entity changes
 *
 * @template T - Entity type extending BaseEntity
 */
export class GenericRepository<T extends BaseEntity> {
  protected repository: Repository<T>;
  protected entityName: string;

  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly entityType: new () => T,
    // TODO: [REDIS] HRMS-CACHE-005 - Add optional cacheManager parameter when Redis is implemented
  ) {
    this.repository = entityManager.getRepository(entityType);
    this.entityName = entityType.name;
  }

  /**
   * Find all entities with optional filtering
   * @param options - FindManyOptions for filtering, pagination, etc.
   * @returns Promise with array of entities
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Find one entity by criteria
   * @param options - FindOneOptions for filtering
   * @returns Promise with entity or null if not found
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @returns Promise with entity or null if not found
   */
  async findById(id: string | undefined | null): Promise<T | null> {
    // Return null if id is undefined or null
    if (id === undefined || id === null) {
      return null;
    }

    // TODO: [REDIS] HRMS-CACHE-006 - Add cache check here before database query
    // Example: const cacheKey = `${this.entityName}:${id}`;

    // Use FindOptionsWhere<T> for type-safe queries
    const whereClause: FindOptionsWhere<T> = { id } as FindOptionsWhere<T>;
    const entity = await this.repository.findOne({ where: whereClause });

    // TODO: [REDIS] HRMS-CACHE-007 - Cache entity if found
    // Example: if (entity && this.cacheManager) await this.cacheManager.set(cacheKey, entity, 3600);

    return entity;
  }

  /**
   * Create a new entity
   * @param data - Entity data
   * @returns Promise with created entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Update an entity
   * @param id - Entity ID
   * @param data - Entity data to update
   * @returns Promise with updated entity
   * @throws EntityNotFoundException if entity not found
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    // First find the entity to ensure it exists
    const entity = await this.findById(id);
    if (!entity) {
      throw new EntityNotFoundException(this.entityName, id);
    }

    // Update entity properties
    Object.assign(entity, data);
    const updatedEntity = await this.repository.save(entity);

    // TODO: [REDIS] HRMS-CACHE-008 - Invalidate entity cache after update
    // Example: if (this.cacheManager) await this.cacheManager.invalidate(`${this.entityName}:${id}`);

    return updatedEntity;
  }

  /**
   * Remove an entity (soft delete if entity has isDeleted property)
   * @param id - Entity ID
   * @returns Promise with removed entity
   * @throws EntityNotFoundException if entity not found
   */
  async remove(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new EntityNotFoundException(this.entityName, id);
    }

    if ('isDeleted' in entity) {
      entity.isDeleted = true;
      const softDeletedEntity = await this.repository.save(entity);

      // TODO: [REDIS] HRMS-CACHE-009 - Invalidate entity cache after soft delete
      // Example: if (this.cacheManager) await this.cacheManager.invalidate(`${this.entityName}:${id}`);

      return softDeletedEntity;
    } else {
      // TypeORM's remove method returns a different type than we need
      // Need to cast through unknown first to avoid TypeScript errors
      const removedEntity = (await this.repository.remove(entity)) as unknown as Promise<T>;

      // TODO: [REDIS] HRMS-CACHE-010 - Invalidate entity cache after hard delete
      // Example: if (this.cacheManager) await this.cacheManager.invalidate(`${this.entityName}:${id}`);

      return removedEntity;
    }
  }

  /**
   * Hard delete an entity regardless of soft delete capability
   * @param id - Entity ID
   * @returns Promise with boolean indicating success
   * @throws EntityNotFoundException if entity not found
   */
  async hardDelete(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new EntityNotFoundException(this.entityName, id);
    }

    await this.repository.remove(entity);

    // TODO: [REDIS] HRMS-CACHE-011 - Invalidate entity cache after hard delete
    // Example: if (this.cacheManager) await this.cacheManager.invalidate(`${this.entityName}:${id}`);

    return true;
  }

  /**
   * Count entities with optional filtering
   * @param options - FindManyOptions for filtering
   * @returns Promise with count
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  /**
   * Find entities with offset-based pagination support
   * @param options - FindManyOptions for filtering
   * @param pagination - Pagination options
   * @returns Promise with paginated result
   */
  async findWithPagination(
    options?: FindManyOptions<T>,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const { page = 1, take = 10, orderBy, direction = 'ASC' } = pagination;
    const skip = (page - 1) * take;

    // TODO: [REDIS] HRMS-CACHE-012 - Add cache check for paginated results
    // Example: const cacheKey = `${this.entityName}:page:${page}:take:${take}:${JSON.stringify(options)}`;

    const findOptions: FindManyOptions<T> = {
      ...options,
      skip,
      take,
    };

    if (orderBy) {
      // Type assertion is necessary here due to TypeORM's typing complexity
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      findOptions.order = { [orderBy]: direction } as any;
    }

    const [items, total] = await this.repository.findAndCount(findOptions);
    const pages = Math.ceil(total / take);

    const result: PaginatedResult<T> = {
      items,
      total,
      page,
      limit: take,
      pages,
      hasNext: page < pages,
      hasPrevious: page > 1,
    };

    // TODO: [REDIS] HRMS-CACHE-013 - Cache paginated results
    // Example: if (this.cacheManager) await this.cacheManager.set(cacheKey, result, 300); // 5 minute TTL

    return result;
  }

  /**
   * Find entities with cursor-based pagination
   * More efficient for large datasets and prevents issues with inserts during pagination
   *
   * @param options - FindManyOptions for filtering
   * @param pagination - Cursor pagination options
   * @returns Promise with cursor-paginated result
   */
  async findWithCursorPagination(
    options?: FindManyOptions<T>,
    pagination: PaginationOptions = {},
  ): Promise<CursorPaginatedResult<T>> {
    const { take = 10, cursor, orderBy = 'id', direction = 'ASC' } = pagination;

    // TODO: [REDIS] HRMS-CACHE-014 - Add cache check for cursor-based results
    // Example: const cacheKey = `${this.entityName}:cursor:${cursor}:take:${take}:${JSON.stringify(options)}`;

    const queryBuilder = this.repository.createQueryBuilder('entity');

    // Apply where conditions from options if provided
    if (options?.where) {
      queryBuilder.where(options.where);
    }

    // Add cursor condition if provided
    if (cursor) {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [field, value] = decoded.split(':');

      if (direction === 'ASC') {
        queryBuilder.andWhere(`entity.${field} > :value`, { value });
      } else {
        queryBuilder.andWhere(`entity.${field} < :value`, { value });
      }
    }

    // Add ordering
    queryBuilder.orderBy(`entity.${orderBy}`, direction);

    // Add limit
    queryBuilder.take(take + 1); // Take one more to check if there are more items

    // Execute query
    const items = await queryBuilder.getMany();

    // Check if there are more items
    const hasMore = items.length > take;
    if (hasMore) {
      items.pop(); // Remove the extra item
    }

    // Generate next cursor
    let nextCursor: string | undefined = undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      // Use type assertion to handle the dynamic property access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const value = (lastItem as any)[orderBy];
      nextCursor = Buffer.from(`${orderBy}:${String(value)}`).toString('base64');
    }

    // Generate previous cursor (first item for backwards pagination)
    let prevCursor: string | undefined = undefined;
    if (items.length > 0 && cursor) {
      const firstItem = items[0];
      // Use type assertion to handle the dynamic property access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const value = (firstItem as any)[orderBy];
      prevCursor = Buffer.from(`${orderBy}:${String(value)}`).toString('base64');
    }

    const result: CursorPaginatedResult<T> = {
      items,
      hasMore,
      nextCursor,
      prevCursor,
    };

    // TODO: [REDIS] HRMS-CACHE-015 - Cache cursor-based results
    // Example: if (this.cacheManager) await this.cacheManager.set(cacheKey, result, 300); // 5 minute TTL

    return result;
  }

  /**
   * Get query builder for creating custom queries
   * @param alias - Entity alias for the query
   * @returns SelectQueryBuilder instance
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * Execute a callback within a transaction
   * @param callback - Function to execute within transaction
   * @param isolationLevel - Optional transaction isolation level
   * @returns Promise with result of callback
   */
  async executeTransaction<R>(
    callback: (entityManager: EntityManager) => Promise<R>,
    isolationLevel?: IsolationLevel,
  ): Promise<R> {
    if (isolationLevel) {
      return this.entityManager.transaction(isolationLevel, callback);
    }
    return this.entityManager.transaction(callback);
  }

  /**
   * Bulk create entities
   * @param entities - Array of entity data
   * @param options - Bulk operation options
   * @returns Promise with bulk operation result
   */
  async bulkCreate(
    entities: DeepPartial<T>[],
    options: BulkOperationOptions = {},
  ): Promise<BulkOperationResult<T>> {
    const { continueOnError = false } = options;
    const result: BulkOperationResult<T> = {
      successful: [],
      failed: [],
      successCount: 0,
      failCount: 0,
    };

    // Execute in transaction for atomicity unless continueOnError is true
    if (!continueOnError) {
      try {
        await this.executeTransaction(async (manager) => {
          const repo = manager.getRepository(this.entityType);
          // No need for type assertion when DeepPartial<T>[] is expected
          const createdEntities = await repo.save(entities);
          result.successful = createdEntities;
          result.successCount = createdEntities.length;
        });
      } catch (error: unknown) {
        // If transaction fails, all entities failed
        result.failed = entities.map((entity, index) => ({
          entity: entity as unknown as Partial<T>,
          error: error instanceof Error ? error.message : String(error),
          index,
        }));
        result.failCount = entities.length;

        // Throw exception with details if transaction failed
        throw new BulkOperationException('create', result.failed);
      }
    } else {
      // Process entities individually if continueOnError is true
      for (let i = 0; i < entities.length; i++) {
        try {
          const entity = this.repository.create(entities[i]);
          const savedEntity = await this.repository.save(entity);
          result.successful.push(savedEntity);
          result.successCount++;
        } catch (error: unknown) {
          result.failed.push({
            entity: entities[i] as unknown as Partial<T>,
            error: error instanceof Error ? error.message : String(error),
            index: i,
          });
          result.failCount++;
        }
      }
    }

    // TODO: [REDIS] HRMS-CACHE-016 - Invalidate collection cache after bulk create
    // Example: if (this.cacheManager) await this.cacheManager.invalidatePrefix(`${this.entityName}:page`);

    return result;
  }

  /**
   * Bulk update entities
   * @param entities - Array of entities with IDs and update data
   * @param options - Bulk operation options
   * @returns Promise with bulk operation result
   */
  async bulkUpdate(
    entities: Array<{ id: string } & DeepPartial<T>>,
    options: BulkOperationOptions = {},
  ): Promise<BulkOperationResult<T>> {
    const { continueOnError = false } = options;
    const result: BulkOperationResult<T> = {
      successful: [],
      failed: [],
      successCount: 0,
      failCount: 0,
    };

    // Execute in transaction for atomicity unless continueOnError is true
    if (!continueOnError) {
      try {
        await this.executeTransaction(async (manager) => {
          const repo = manager.getRepository(this.entityType);

          // Fetch all entities to update
          const ids = entities.map((e) => e.id);
          const existingEntities = await repo.find({
            where: { id: In(ids) } as FindOptionsWhere<T>,
          });

          // Check if all entities exist
          if (existingEntities.length !== entities.length) {
            const existingIds = new Set(existingEntities.map((e) => e.id));
            const missingIds = ids.filter((id) => !existingIds.has(id));
            throw new Error(`Entities with IDs ${missingIds.join(', ')} not found`);
          }

          // Update entities
          const entitiesToSave = entities.map((update) => {
            const existing = existingEntities.find((e) => e.id === update.id);
            return Object.assign({}, existing, update);
          });

          const updatedEntities = await repo.save(entitiesToSave);
          result.successful = updatedEntities;
          result.successCount = updatedEntities.length;
        });
      } catch (error: unknown) {
        // If transaction fails, all entities failed
        result.failed = entities.map((entity, index) => ({
          entity: entity as unknown as Partial<T>,
          error: error instanceof Error ? error.message : String(error),
          index,
        }));
        result.failCount = entities.length;

        // Throw exception with details if transaction failed
        throw new BulkOperationException('update', result.failed);
      }
    } else {
      // Process entities individually if continueOnError is true
      for (let i = 0; i < entities.length; i++) {
        try {
          const { id, ...updateData } = entities[i];
          const updated = await this.update(id, updateData as DeepPartial<T>);
          result.successful.push(updated);
          result.successCount++;
        } catch (error: unknown) {
          result.failed.push({
            entity: entities[i] as unknown as Partial<T>,
            error: error instanceof Error ? error.message : String(error),
            index: i,
          });
          result.failCount++;
        }
      }
    }

    // TODO: [REDIS] HRMS-CACHE-017 - Invalidate entity and collection caches after bulk update
    // Example:
    // if (this.cacheManager) {
    //   for (const entity of entities) {
    //     await this.cacheManager.invalidate(`${this.entityName}:${entity.id}`);
    //   }
    //   await this.cacheManager.invalidatePrefix(`${this.entityName}:page`);
    // }

    return result;
  }

  /**
   * Bulk remove entities (supports soft delete if entities have isDeleted property)
   * @param ids - Array of entity IDs to remove
   * @param options - Bulk operation options
   * @returns Promise with bulk operation result
   */
  async bulkRemove(
    ids: string[],
    options: BulkOperationOptions & { hardDelete?: boolean } = {},
  ): Promise<BulkOperationResult<{ id: string }>> {
    const { continueOnError = false, hardDelete = false } = options;
    const result: BulkOperationResult<{ id: string }> = {
      successful: [],
      failed: [],
      successCount: 0,
      failCount: 0,
    };

    // Execute in transaction for atomicity unless continueOnError is true
    if (!continueOnError) {
      try {
        await this.executeTransaction(async (manager) => {
          const repo = manager.getRepository(this.entityType);

          // Fetch all entities to remove
          const existingEntities = await repo.find({
            where: { id: In(ids) } as FindOptionsWhere<T>,
          });

          // Check if all entities exist
          if (existingEntities.length !== ids.length) {
            const existingIds = new Set(existingEntities.map((e) => e.id));
            const missingIds = ids.filter((id) => !existingIds.has(id));
            throw new Error(`Entities with IDs ${missingIds.join(', ')} not found`);
          }

          if (!hardDelete && 'isDeleted' in existingEntities[0]) {
            // Soft delete - use type assertion to BaseEntity which has isDeleted
            const entitiesToSave = existingEntities.map((entity) => {
              const baseEntity = entity as unknown as BaseEntity;
              baseEntity.isDeleted = true;
              return entity;
            });

            await repo.save(entitiesToSave);
          } else {
            // Hard delete
            await repo.remove(existingEntities);
          }

          result.successful = ids.map((id) => ({ id }));
          result.successCount = ids.length;
        });
      } catch (error: unknown) {
        // If transaction fails, all entities failed
        result.failed = ids.map((id, index) => ({
          entity: { id } as Partial<T>,
          error: error instanceof Error ? error.message : String(error),
          index,
        }));
        result.failCount = ids.length;

        // Throw exception with details if transaction failed
        throw new BulkOperationException('delete', result.failed);
      }
    } else {
      // Process entities individually if continueOnError is true
      for (let i = 0; i < ids.length; i++) {
        try {
          if (hardDelete) {
            await this.hardDelete(ids[i]);
          } else {
            await this.remove(ids[i]);
          }
          result.successful.push({ id: ids[i] });
          result.successCount++;
        } catch (error: unknown) {
          result.failed.push({
            entity: { id: ids[i] } as Partial<T>,
            error: error instanceof Error ? error.message : String(error),
            index: i,
          });
          result.failCount++;
        }
      }
    }

    // TODO: [REDIS] HRMS-CACHE-018 - Invalidate entity and collection caches after bulk delete
    // Example:
    // if (this.cacheManager) {
    //   for (const id of ids) {
    //     await this.cacheManager.invalidate(`${this.entityName}:${id}`);
    //   }
    //   await this.cacheManager.invalidatePrefix(`${this.entityName}:page`);
    // }

    return result;
  }
}
