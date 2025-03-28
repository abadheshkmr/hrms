/**
 * Standard sorting direction options
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Sorting configuration for queries
 */
export interface SortOption {
  field: string;
  direction: SortDirection;
}

/**
 * Base pagination parameters
 */
export interface PaginationOptions {
  // Zero-based page number
  page?: number;
  // Number of items per page
  limit?: number;
  // Whether to include total count in response
  withTotalCount?: boolean;
}

/**
 * Base filter interface that can be extended for specific entity types
 * Includes common filtering patterns and pagination
 */
export interface FilterQuery<T = any> extends PaginationOptions {
  // Sorting options
  sort?: SortOption | SortOption[];
  // Simple search term that can be applied to multiple fields
  search?: string;
  // Fields to search in when search is provided
  searchFields?: (keyof T)[];
  // Filter by creation date range
  createdAtStart?: Date | string;
  createdAtEnd?: Date | string;
  // Filter by update date range
  updatedAtStart?: Date | string;
  updatedAtEnd?: Date | string;
  // Include deleted items (default: false)
  includeDeleted?: boolean;
}

/**
 * Extended filter query with tenant-specific options
 */
export interface TenantFilterQuery<T = any> extends FilterQuery<T> {
  // Filter by specific tenant (admin functionality)
  // This is separate from the automatic tenant filtering
  tenantId?: string;
  // Include items with null tenant (global items)
  includeGlobal?: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalCount?: number;
    totalPages?: number;
  };
}

/**
 * Helper function to apply pagination to a filter query
 * @param filter - Filter query with potential pagination options
 * @returns Object with skip and take parameters for TypeORM
 */
export function getPaginationParams(filter: PaginationOptions): { skip: number; take: number } {
  const page = Math.max(0, filter.page || 0);
  const limit = Math.max(1, Math.min(filter.limit || 10, 100)); // Default: 10, Max: 100
  return {
    skip: page * limit,
    take: limit,
  };
}

/**
 * Helper function to build TypeORM order object from sort options
 * @param sort - Sort option or array of sort options
 * @returns Order object for TypeORM
 */
export function buildOrderParams(sort?: SortOption | SortOption[]): Record<string, 'ASC' | 'DESC'> {
  const order: Record<string, 'ASC' | 'DESC'> = {};
  if (!sort) {
    return order;
  }
  const sortOptions = Array.isArray(sort) ? sort : [sort];
  for (const option of sortOptions) {
    order[option.field] = option.direction;
  }
  return order;
}
