/**
 * THIS IS AN EXAMPLE FILE - NOT FOR PRODUCTION USE
 *
 * This file demonstrates how to use the repository patterns in a real feature module.
 * It shows a typical implementation of an employee entity, repository, and service
 * using the tenant-aware repository pattern.
 */

import { Injectable } from '@nestjs/common';
import { TenantBaseEntity } from '../entities/tenant-base.entity';
import {
  Column,
  Entity,
  FindOptionsWhere,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
} from 'typeorm';
import { TenantAwareRepository } from '../repositories/tenant-aware.repository';
import { RepositoryFactory } from '../services/repository.factory';
import {
  FilterQuery,
  PaginatedResult,
  getPaginationParams,
} from '../interfaces/filter-query.interface';

/**
 * Example employee entity extending TenantBaseEntity
 * This ensures that employees are always associated with a tenant
 */
@Entity('employee')
export class Employee extends TenantBaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'date', nullable: true })
  hireDate?: Date;

  @Column({ default: true })
  isActive: boolean;
}

/**
 * Employee-specific filter options
 */
export interface EmployeeFilter extends FilterQuery<Employee> {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  isActive?: boolean;
  hireDateStart?: Date;
  hireDateEnd?: Date;
}

/**
 * Example employee service using the tenant-aware repository
 */
@Injectable()
export class EmployeeService {
  private employeeRepository: TenantAwareRepository<Employee>;

  constructor(private repositoryFactory: RepositoryFactory) {
    // Get a tenant-aware repository for the Employee entity
    this.employeeRepository = repositoryFactory.createTenantAwareRepository(Employee);
  }

  /**
   * Find all employees with filtering, pagination, and sorting
   */
  async findAll(filter: EmployeeFilter = {}): Promise<PaginatedResult<Employee>> {
    // Extract pagination parameters
    const { skip, take } = getPaginationParams(filter);

    // Build query conditions
    const where: FindOptionsWhere<Employee> = {};

    if (filter.firstName) {
      where.firstName = filter.firstName;
    }

    if (filter.lastName) {
      where.lastName = filter.lastName;
    }

    if (filter.email) {
      where.email = filter.email;
    }

    if (filter.department) {
      where.department = filter.department;
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    // Date range conditions
    if (filter.hireDateStart && filter.hireDateEnd) {
      where.hireDate = Between(filter.hireDateStart, filter.hireDateEnd);
    } else if (filter.hireDateStart) {
      where.hireDate = MoreThanOrEqual(filter.hireDateStart);
    } else if (filter.hireDateEnd) {
      where.hireDate = LessThanOrEqual(filter.hireDateEnd);
    }

    // Execute query
    const [items, totalCount] = await Promise.all([
      this.employeeRepository.find({
        where,
        skip,
        take,
        order: {
          lastName: 'ASC',
          firstName: 'ASC',
        },
      }),
      filter.withTotalCount ? this.employeeRepository.count({ where }) : Promise.resolve(undefined),
    ]);

    // Return paginated result
    return {
      items,
      meta: {
        page: filter.page || 0,
        limit: take,
        totalCount,
        totalPages: totalCount !== undefined ? Math.ceil(totalCount / take) : undefined,
      },
    };
  }

  /**
   * Find employee by ID (automatically filtered by current tenant)
   */
  async findById(id: string): Promise<Employee | null> {
    return this.employeeRepository.findById(id);
  }

  /**
   * Create a new employee
   * The tenant ID is automatically set by the repository
   */
  async create(data: Partial<Employee>): Promise<Employee> {
    return this.employeeRepository.create(data);
  }

  /**
   * Update an employee
   * The repository ensures the employee belongs to the current tenant
   */
  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return this.employeeRepository.update(id, data);
  }

  /**
   * Remove an employee (soft delete)
   * The repository ensures the employee belongs to the current tenant
   */
  async remove(id: string): Promise<Employee> {
    return this.employeeRepository.remove(id);
  }

  /**
   * Example of a more complex query using the query builder
   * Still automatically filtered by tenant
   */
  async findByDepartmentWithCustomSort(department: string): Promise<Employee[]> {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.department = :department', { department })
      .orderBy('employee.hireDate', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Example of using transactions
   * Create an employee and update department count in a transaction
   */
  async createWithTransaction(data: Partial<Employee>): Promise<Employee> {
    // We use the executeTransaction method which provides a transaction manager
    return this.employeeRepository.executeTransaction(async () => {
      // Create employee
      const employeeRepo = this.repositoryFactory.createTenantAwareRepository(Employee);
      const employee = await employeeRepo.create(data);

      // Here you could update other related entities within the same transaction
      // For example, update department employee count

      return employee;
    });
  }
}
