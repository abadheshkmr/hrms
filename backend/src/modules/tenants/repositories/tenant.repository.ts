import { EntityManager, FindOptionsWhere, Like, Raw, In } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationOptions, PaginatedResult } from '../../../common/types/pagination.types';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus, VerificationStatus, BusinessType } from '../enums/tenant.enums';

/**
 * Repository for Tenant entity operations
 * Extends GenericRepository to inherit standard CRUD operations
 */
@Injectable()
export class TenantRepository extends GenericRepository<Tenant> {
  constructor(protected readonly entityManager: EntityManager) {
    super(entityManager, Tenant);
  }

  /**
   * Find tenant by subdomain
   * @param subdomain - Tenant subdomain
   * @returns Promise with tenant or null if not found
   */
  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.findOne({
      where: { subdomain, isDeleted: false },
    });
  }

  /**
   * Find tenant by identifier
   * @param identifier - Tenant unique identifier
   * @returns Promise with tenant or null if not found
   */
  async findByIdentifier(identifier: string): Promise<Tenant | null> {
    return this.findOne({
      where: { identifier, isDeleted: false },
    });
  }

  /**
   * Find tenants by status with pagination support
   * @param status - TenantStatus enum value
   * @param pagination - Optional pagination options
   * @returns Promise with paginated tenants
   */
  async findByStatus(
    status: TenantStatus,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Tenant>> {
    // TODO: [REDIS] HRMS-CACHE-101 - Add cache check for status-based tenant lists
    // const cacheKey = `tenants:status:${status}:page:${pagination?.page || 1}`;

    return this.findWithPagination(
      {
        where: { status, isDeleted: false },
      },
      pagination,
    );

    // TODO: [REDIS] HRMS-CACHE-102 - Cache paginated results
    // if (this.cacheManager) await this.cacheManager.set(cacheKey, result, 300); // 5 minute TTL
  }

  /**
   * Find tenants by verification status with pagination support
   * @param verificationStatus - VerificationStatus enum value
   * @param pagination - Optional pagination options
   * @returns Promise with paginated tenants
   */
  async findByVerificationStatus(
    verificationStatus: VerificationStatus,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Tenant>> {
    // TODO: [REDIS] HRMS-CACHE-103 - Add cache check for verification status-based tenant lists

    return this.findWithPagination(
      {
        where: {
          verification: { verificationStatus },
          isDeleted: false,
        },
      },
      pagination,
    );
  }

  /**
   * Search tenants by name or legal name with pagination support
   * @param searchTerm - Text to search for
   * @param pagination - Optional pagination options
   * @returns Promise with paginated tenants
   */
  async searchByName(
    searchTerm: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Tenant>> {
    return this.findWithPagination(
      {
        where: [
          { name: Like(`%${searchTerm}%`), isDeleted: false },
          { legalName: Like(`%${searchTerm}%`), isDeleted: false },
        ],
      },
      pagination,
    );
  }

  /**
   * Advanced search for tenants with multiple criteria and pagination support
   * @param options - Search options object with various criteria
   * @param pagination - Optional pagination options
   * @returns Promise with paginated tenants
   */
  async advancedSearch(
    options: {
      name?: string;
      industry?: string;
      status?: TenantStatus;
      verificationStatus?: VerificationStatus;
      businessType?: string;
      foundedAfter?: Date;
      foundedBefore?: Date;
    },
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Tenant>> {
    const whereOptions: FindOptionsWhere<Tenant> = { isDeleted: false };

    if (options.name) {
      whereOptions.name = Like(`%${options.name}%`);
    }

    if (options.industry) {
      whereOptions['business.industry'] = Like(`%${options.industry}%`);
    }

    if (options.status) {
      whereOptions.status = options.status;
    }

    if (options.verificationStatus) {
      whereOptions['verification.verificationStatus'] = options.verificationStatus;
    }

    if (options.businessType) {
      whereOptions['business.businessType'] = options.businessType as BusinessType;
    }

    // Use different field for date range if both dates are provided
    if (options.foundedAfter && options.foundedBefore) {
      whereOptions['business.foundedDate'] = Raw(
        (alias) => `${alias} BETWEEN :foundedAfter AND :foundedBefore`,
        {
          foundedAfter: options.foundedAfter,
          foundedBefore: options.foundedBefore,
        },
      );
    } else {
      if (options.foundedAfter) {
        whereOptions['business.foundedDate'] = Raw((alias) => `${alias} >= :foundedAfter`, {
          foundedAfter: options.foundedAfter,
        });
      }

      if (options.foundedBefore) {
        whereOptions['business.foundedDate'] = Raw((alias) => `${alias} <= :foundedBefore`, {
          foundedBefore: options.foundedBefore,
        });
      }
    }

    return this.findWithPagination(
      {
        where: whereOptions,
      },
      pagination,
    );
  }

  /**
   * Count tenants by status
   * @param status - TenantStatus enum value
   * @returns Promise with count of tenants
   */
  async countByStatus(status: TenantStatus): Promise<number> {
    return this.repository.count({
      where: { status, isDeleted: false },
    });
  }

  /**
   * Set tenant status
   * @param id - Tenant ID
   * @param status - New TenantStatus enum value
   * @returns Promise with updated tenant
   * @throws NotFoundException if tenant not found
   */
  async setStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Use the entity's setStatus method to ensure state transition rules are followed
    if (typeof tenant.setStatus === 'function') {
      tenant.setStatus(status);
    } else {
      tenant.status = status;
    }

    const updatedTenant = await this.repository.save(tenant);

    // TODO: [REDIS] HRMS-CACHE-104 - Invalidate tenant cache after status update
    // if (this.cacheManager) {
    //   await this.cacheManager.invalidate(`tenant:${id}`);
    //   await this.cacheManager.invalidatePrefix(`tenants:status`);
    // }

    return updatedTenant;
  }

  /**
   * Set tenant verification status
   * @param id - Tenant ID
   * @param verificationStatus - New VerificationStatus enum value
   * @param verifiedById - ID of user who performed verification
   * @param verificationNotes - Optional notes about verification
   * @returns Promise with updated tenant
   * @throws NotFoundException if tenant not found
   */
  async setVerificationStatus(
    id: string,
    verificationStatus: VerificationStatus,
    verifiedById: string,
    verificationNotes?: string,
  ): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Initialize verification property if not exists
    if (!tenant.verification) {
      tenant.verification = {
        verificationStatus: VerificationStatus.PENDING,
        verificationAttempted: false,
        getVerificationDocuments: () => [],
        addVerificationDocument: () => {},
        isVerificationComplete: () => false,
      };
    }

    // Use the entity's setVerificationStatus method if available
    if (typeof tenant.setVerificationStatus === 'function') {
      tenant.setVerificationStatus(verificationStatus, verifiedById, verificationNotes);
    } else {
      // Fallback to direct property updates if method is not available
      tenant.verification.verificationStatus = verificationStatus;
      tenant.verification.verifiedById = verifiedById;

      if (verificationStatus === VerificationStatus.VERIFIED) {
        tenant.verification.verificationDate = new Date();
      }

      if (verificationNotes) {
        tenant.verification.verificationNotes = verificationNotes;
      }
    }

    const updatedTenant = await this.repository.save(tenant);

    // TODO: [REDIS] HRMS-CACHE-105 - Invalidate tenant cache after verification status update
    // if (this.cacheManager) {
    //   await this.cacheManager.invalidate(`tenant:${id}`);
    //   await this.cacheManager.invalidatePrefix(`tenants:verification`);
    // }

    return updatedTenant;
  }

  /**
   * Bulk update tenant statuses
   * @param updates - Array of tenant ID and status updates
   * @returns Promise with updated tenants
   */
  async bulkUpdateStatuses(
    updates: Array<{ id: string; status: TenantStatus }>,
  ): Promise<Tenant[]> {
    // TODO: [REDIS] HRMS-CACHE-106 - Consider cache strategy for bulk updates

    return this.executeTransaction(async (manager) => {
      const repo = manager.getRepository(Tenant);
      const tenantIds = updates.map((update) => update.id);

      // Find all tenants to update in a single query
      const tenants = await repo.find({
        where: { id: In(tenantIds) },
      });

      if (tenants.length !== updates.length) {
        const foundIds = new Set(tenants.map((t) => t.id));
        const missingIds = tenantIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Tenants with IDs ${missingIds.join(', ')} not found`);
      }

      // Apply status updates
      const updatedTenants = tenants.map((tenant) => {
        const update = updates.find((u) => u.id === tenant.id);
        if (update && typeof tenant.setStatus === 'function') {
          tenant.setStatus(update.status);
        } else if (update) {
          tenant.status = update.status;
        }
        return tenant;
      });

      // Save all updates in a single operation
      return repo.save(updatedTenants);
    });
  }

  /**
   * Find tenants by IDs
   * @param ids - Array of tenant IDs
   * @returns Promise with array of found tenants
   */
  async findByIds(ids: string[]): Promise<Tenant[]> {
    // TODO: [REDIS] HRMS-CACHE-107 - Add cache check for multiple tenant IDs
    // const tenants: Tenant[] = [];
    // const missingIds: string[] = [];
    //
    // if (this.cacheManager) {
    //   for (const id of ids) {
    //     const cached = await this.cacheManager.get<Tenant>(`tenant:${id}`);
    //     if (cached) {
    //       tenants.push(cached);
    //     } else {
    //       missingIds.push(id);
    //     }
    //   }
    // }

    // Query database for all IDs or just missing ones if cache is used
    return this.find({
      where: { id: In(ids) },
    });

    // TODO: [REDIS] HRMS-CACHE-108 - Cache results for future lookups
    // if (this.cacheManager) {
    //   for (const tenant of dbTenants) {
    //     await this.cacheManager.set(`tenant:${tenant.id}`, tenant, 3600);
    //   }
    // }
  }
}
