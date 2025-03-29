import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  DeepPartial,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

/**
 * Generic repository for basic CRUD operations
 * Provides standard repository functionality with type safety
 * @template T - Entity type extending BaseEntity
 */
export class GenericRepository<T extends BaseEntity> {
  protected repository: Repository<T>;

  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly entityType: new () => T,
  ) {
    this.repository = entityManager.getRepository(entityType);
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
  async findById(id: string): Promise<T | null> {
    // Use FindOptionsWhere<T> for type-safe queries
    const whereClause: FindOptionsWhere<T> = { id } as FindOptionsWhere<T>;
    return this.repository.findOne({ where: whereClause });
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
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    // First find the entity to ensure it exists
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    // Update entity properties
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  /**
   * Remove an entity (soft delete if entity has isDeleted property)
   * @param id - Entity ID
   * @returns Promise with removed entity
   */
  async remove(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    if ('isDeleted' in entity) {
      entity.isDeleted = true;
      return this.repository.save(entity);
    } else {
      // TypeORM's remove method returns a different type than we need
      // Need to cast through unknown first to avoid TypeScript errors
      return this.repository.remove(entity) as unknown as Promise<T>;
    }
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
   * Find entities with pagination support
   * @param options - FindManyOptions for filtering
   * @param page - Page number (starting from 1)
   * @param limit - Number of items per page
   * @returns Promise with paginated result containing items, total count, and pagination metadata
   */
  async findPaginated(
    options?: FindManyOptions<T>,
    page = 1,
    limit = 10,
  ): Promise<{ items: T[]; total: number; page: number; limit: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
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
   * @returns Promise with result of callback
   */
  async executeTransaction<R>(callback: (entityManager: EntityManager) => Promise<R>): Promise<R> {
    return this.entityManager.transaction(callback);
  }
}
