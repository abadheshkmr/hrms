import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, IsolationLevel } from 'typeorm';

/**
 * Service for managing database transactions with various isolation levels
 */
@Injectable()
export class TenantTransactionService {
  private readonly logger = new Logger(TenantTransactionService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Execute a function within a transaction with specified isolation level
   * @param operation - Function to execute within the transaction
   * @param isolationLevel - Optional isolation level (default: READ COMMITTED)
   * @param timeoutMs - Optional transaction timeout in milliseconds
   * @returns Promise with result of the operation
   */
  async executeInTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
    isolationLevel: IsolationLevel = 'READ COMMITTED',
    timeoutMs?: number
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    let timeoutId: NodeJS.Timeout | undefined;

    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);

    try {
      // Set transaction timeout if specified
      if (timeoutMs) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Transaction timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        });

        // Race between operation and timeout
        const result = await Promise.race([
          operation(queryRunner),
          timeoutPromise
        ]) as T;

        await queryRunner.commitTransaction();
        return result;
      } else {
        // No timeout specified
        const result = await operation(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      }
    } catch (error) {
      this.logger.error(
        `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      await queryRunner.release();
    }
  }

  /**
   * Execute a read-only operation with REPEATABLE READ isolation
   * Suitable for consistent reads within a transaction
   * @param operation - Function to execute
   * @returns Promise with result of the operation
   */
  async executeConsistentRead<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>
  ): Promise<T> {
    return this.executeInTransaction(operation, 'REPEATABLE READ');
  }

  /**
   * Execute a critical operation with SERIALIZABLE isolation
   * Suitable for operations requiring highest isolation but with lowest concurrency
   * @param operation - Function to execute
   * @returns Promise with result of the operation
   */
  async executeCriticalOperation<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>
  ): Promise<T> {
    return this.executeInTransaction(operation, 'SERIALIZABLE');
  }
}
