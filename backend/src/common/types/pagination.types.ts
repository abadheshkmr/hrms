/**
 * Pagination options for repository queries
 * Supports both offset-based and cursor-based pagination
 */
export interface PaginationOptions {
  /** Number of items to take (limit) */
  take?: number;

  /** Page number for offset-based pagination (starts at 1) */
  page?: number;

  /** Cursor for cursor-based pagination */
  cursor?: string;

  /** Field to order by */
  orderBy?: string;

  /** Sort direction */
  direction?: 'ASC' | 'DESC';
}

/**
 * Result of a paginated query with offset-based pagination
 * @template T - Type of items in the result
 */
export interface PaginatedResult<T> {
  /** Items for the current page */
  items: T[];

  /** Total count of items matching the query */
  total: number;

  /** Current page number */
  page: number;

  /** Number of items per page */
  limit: number;

  /** Total number of pages */
  pages: number;

  /** Whether there are more items after this page */
  hasNext: boolean;

  /** Whether there are items before this page */
  hasPrevious: boolean;
}

/**
 * Result of a paginated query with cursor-based pagination
 * @template T - Type of items in the result
 */
export interface CursorPaginatedResult<T> {
  /** Items for the current page */
  items: T[];

  /** Whether there are more items after this page */
  hasMore: boolean;

  /** Next cursor for fetching the next page */
  nextCursor?: string;

  /** Previous cursor for fetching the previous page */
  prevCursor?: string;
}

/**
 * Options for bulk operations
 */
export interface BulkOperationOptions {
  /** Whether to continue on error */
  continueOnError?: boolean;
}

/**
 * Result of a bulk operation
 * @template T - Type of entities in the result
 */
export interface BulkOperationResult<T> {
  /** Successfully processed entities */
  successful: T[];

  /** Failed entities with error information */
  failed: Array<{
    /** Entity data that failed */
    entity: Partial<T>;

    /** Error message */
    error: string;

    /** Index in the original array */
    index: number;
  }>;

  /** Total number of successful operations */
  successCount: number;

  /** Total number of failed operations */
  failCount: number;
}
