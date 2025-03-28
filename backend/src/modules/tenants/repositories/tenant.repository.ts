import { EntityManager, FindOptionsWhere, Like, Raw } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Tenant, TenantStatus, VerificationStatus, BusinessType } from '../entities/tenant.entity';

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
   * Find tenants by status
   * @param status - TenantStatus enum value
   * @returns Promise with array of tenants
   */
  async findByStatus(status: TenantStatus): Promise<Tenant[]> {
    return this.find({
      where: { status, isDeleted: false },
    });
  }

  /**
   * Find tenants by verification status
   * @param verificationStatus - VerificationStatus enum value
   * @returns Promise with array of tenants
   */
  async findByVerificationStatus(verificationStatus: VerificationStatus): Promise<Tenant[]> {
    return this.find({
      where: { verificationStatus, isDeleted: false },
    });
  }

  /**
   * Search tenants by name or legal name
   * @param searchTerm - Text to search for
   * @returns Promise with array of matching tenants
   */
  async searchByName(searchTerm: string): Promise<Tenant[]> {
    return this.find({
      where: [
        { name: Like(`%${searchTerm}%`), isDeleted: false },
        { legalName: Like(`%${searchTerm}%`), isDeleted: false },
      ],
    });
  }

  /**
   * Advanced search for tenants with multiple criteria
   * @param options - Search options object with various criteria
   * @returns Promise with array of matching tenants
   */
  async advancedSearch(options: {
    name?: string;
    industry?: string;
    status?: TenantStatus;
    verificationStatus?: VerificationStatus;
    businessType?: string;
    foundedAfter?: Date;
    foundedBefore?: Date;
  }): Promise<Tenant[]> {
    const whereOptions: FindOptionsWhere<Tenant> = { isDeleted: false };

    if (options.name) {
      whereOptions.name = Like(`%${options.name}%`);
    }

    if (options.industry) {
      whereOptions.industry = Like(`%${options.industry}%`);
    }

    if (options.status) {
      whereOptions.status = options.status;
    }

    if (options.verificationStatus) {
      whereOptions.verificationStatus = options.verificationStatus;
    }

    if (options.businessType) {
      whereOptions.businessType = options.businessType as BusinessType;
    }

    if (options.foundedAfter) {
      whereOptions.foundedDate = Raw((alias) => `${alias} >= :foundedAfter`, {
        foundedAfter: options.foundedAfter,
      });
    }

    if (options.foundedBefore) {
      whereOptions.foundedDate = Raw((alias) => `${alias} <= :foundedBefore`, {
        foundedBefore: options.foundedBefore,
      });
    }

    return this.find({
      where: whereOptions,
    });
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
   */
  async setStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
    const tenant = await this.findById(id);
    if (!tenant) {
      return null;
    }

    tenant.status = status;
    return this.repository.save(tenant);
  }

  /**
   * Set tenant verification status
   * @param id - Tenant ID
   * @param verificationStatus - New VerificationStatus enum value
   * @param verifiedById - ID of user who performed verification
   * @param verificationNotes - Optional notes about verification
   * @returns Promise with updated tenant
   */
  async setVerificationStatus(
    id: string,
    verificationStatus: VerificationStatus,
    verifiedById: string,
    verificationNotes?: string,
  ): Promise<Tenant | null> {
    const tenant = await this.findById(id);
    if (!tenant) {
      return null;
    }

    tenant.verificationStatus = verificationStatus;
    tenant.verifiedById = verifiedById;

    if (verificationStatus === VerificationStatus.VERIFIED) {
      tenant.verificationDate = new Date();
    }

    if (verificationNotes) {
      tenant.verificationNotes = verificationNotes;
    }
    return this.repository.save(tenant);
  }
}
