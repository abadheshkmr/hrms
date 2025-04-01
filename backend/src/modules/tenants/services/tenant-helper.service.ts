import { Injectable } from '@nestjs/common';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus, VerificationStatus, BusinessType, BusinessScale } from '../enums/tenant.enums';
import { BusinessInfo } from '../entities/embedded/business-info.entity';
import { RegistrationInfo } from '../entities/embedded/registration-info.entity';
import { VerificationInfo } from '../entities/embedded/verification-info.entity';
import { ContactDetails } from '../entities/embedded/contact-details.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Address } from '../../../common/entities/address.entity';
import { ContactInfo } from '../../../common/entities/contact-info.entity';
import { TenantWithRelations } from '../../../common/interfaces/tenant-result.interface';
import { TenantData } from '../../../common/interfaces/tenant.interface';

/**
 * Helper service for tenant-related operations to reduce code duplication
 * and centralize common functionality.
 */
@Injectable()
export class TenantHelperService {
  /**
   * Sanitize string inputs by trimming whitespace
   * @param dto - Any data transfer object
   * @returns The sanitized object with trimmed string fields
   */
  sanitizeStringInputs<T>(dto: T): T {
    if (!dto || typeof dto !== 'object') return dto;

    // Create a safe copy with the same type
    const sanitized = { ...dto } as Record<string, unknown>;

    // Loop through all properties of the object
    Object.keys(sanitized).forEach((key: string) => {
      const value = sanitized[key];

      // Trim string values
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      }
      // Recursively sanitize nested objects, but not arrays or null values
      else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeStringInputs(value as Record<string, unknown>);
      }
    });

    return sanitized as unknown as T;
  }

  /**
   * Type guard to check if an error is a Postgres unique violation error
   * @param error - The error to check
   * @returns Whether the error is a Postgres unique violation error
   */
  isPostgresUniqueViolationError(error: unknown): boolean {
    return (
      error !== null && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code === '23505' && 'detail' in error
    );
  }

  /**
   * Get the error detail from a Postgres error
   * @param error - The error object
   * @returns The error detail string
   */
  getErrorDetail(error: unknown): string {
    if (error !== null && typeof error === 'object' && 'detail' in error && typeof error.detail === 'string') {
      return error.detail;
    }
    return '';
  }

  /**
   * Extract field name from PostgreSQL error message detail
   * @param errorDetail - Error detail message from PostgreSQL
   * @returns Field name that caused the error
   */
  extractFieldFromErrorMessage(errorDetail: string): string {
    if (!errorDetail) return 'value';
    // Example format: 'Key (subdomain)=(xyz) already exists.'
    const match = errorDetail.match(/Key \(([^)]+)\)=/i);
    return match ? match[1] : 'value';
  }

  /**
   * Check if a status transition is valid based on business rules
   * @param currentStatus - Current tenant status
   * @param newStatus - Target tenant status
   * @returns Whether the transition is valid
   */
  isValidStatusTransition(currentStatus: TenantStatus, newStatus: TenantStatus): boolean {
    // Define valid transitions map based on existing TenantStatus enum values
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.PENDING]: [TenantStatus.ACTIVE, TenantStatus.SUSPENDED, TenantStatus.TERMINATED],
      [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.TERMINATED],
      [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.TERMINATED],
      [TenantStatus.TERMINATED]: [], // Cannot transition from TERMINATED status
    };

    // Check if the transition is valid
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Check if a verification status transition is valid based on business rules
   * @param currentStatus - Current verification status
   * @param newStatus - Target verification status
   * @returns Whether the transition is valid
   */
  isValidVerificationStatusTransition(currentStatus: VerificationStatus, newStatus: VerificationStatus): boolean {
    // Define valid transitions map based on existing VerificationStatus enum values
    const validTransitions: Record<VerificationStatus, VerificationStatus[]> = {
      [VerificationStatus.PENDING]: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
      [VerificationStatus.VERIFIED]: [VerificationStatus.REJECTED], // Can revert from verified to rejected
      [VerificationStatus.REJECTED]: [VerificationStatus.PENDING], // Can retry verification after rejection
    };

    // Check if the transition is valid
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Initialize a tenant entity with data from DTO
   * @param tenant - Tenant entity to initialize
   * @param dto - DTO with tenant data
   * @returns Initialized tenant entity
   */
  initializeTenantFromDto(tenant: Tenant, dto: CreateTenantDto | UpdateTenantDto): Tenant {
    // Extract embedded entity fields from the DTO
    // Use a type for the extraction to avoid 'any'
    type TenantDtoFields = {
      businessType?: BusinessType;
      businessScale?: BusinessScale;
      industry?: string;
      gstNumber?: string;
      panNumber?: string;
      primaryEmail?: string;
      subdomain?: string;
      [key: string]: unknown;
    };

    const { businessType, businessScale, industry, gstNumber, panNumber, primaryEmail, ...restOfDto } = dto as TenantDtoFields;

    // Set basic properties
    Object.assign(tenant, {
      ...restOfDto,
      subdomain: typeof restOfDto.subdomain === 'string' ? restOfDto.subdomain.toLowerCase() : restOfDto.subdomain,
      tenantId: null, // Explicitly set to null since a tenant doesn't belong to another tenant
    });

    // Set embedded business info if provided
    if (businessType || businessScale || industry) {
      if (!tenant.business) {
        tenant.business = new BusinessInfo();
      }
      if (businessType) tenant.business.businessType = businessType;
      if (businessScale) tenant.business.businessScale = businessScale;
      if (industry) tenant.business.industry = industry;
    }

    // Set embedded registration info if provided
    if (gstNumber || panNumber) {
      if (!tenant.registration) {
        tenant.registration = new RegistrationInfo();
      }
      if (gstNumber) tenant.registration.gstNumber = gstNumber;
      if (panNumber) tenant.registration.panNumber = panNumber;
    }

    // Set embedded contact details if provided
    if (primaryEmail) {
      if (!tenant.contact) {
        tenant.contact = new ContactDetails();
      }
      tenant.contact.primaryEmail = primaryEmail;
    }

    return tenant;
  }

  /**
   * Prepare tenant entity for creation with default values
   * @param dto - DTO with tenant data
   * @returns Prepared tenant entity
   */
  prepareTenantForCreation(dto: CreateTenantDto): Tenant {
    const tenant = new Tenant();

    // Initialize with data from DTO
    this.initializeTenantFromDto(tenant, dto);

    // Set default values for new tenants
    tenant.status = TenantStatus.PENDING;
    tenant.isActive = true;

    // Initialize verification info
    tenant.verification = new VerificationInfo();
    tenant.verification.verificationStatus = VerificationStatus.PENDING;
    tenant.verification.verificationAttempted = false;

    return tenant;
  }

  /**
   * Prepare tenant data for event publishing
   * @param tenant - Tenant entity
   * @returns Structured tenant data for events
   */
  prepareTenantDataForEvent(tenant: Tenant): TenantData {
    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.subdomain,
      status: tenant.isActive ? 'active' : 'inactive',
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  /**
   * Format tenant data with related entities for API response
   * @param tenant - Tenant entity
   * @param addresses - Related addresses
   * @param contacts - Related contact information
   * @returns Formatted tenant data with relationships
   */
  prepareResponseData(tenant: Tenant, addresses: Address[] = [], contacts: ContactInfo[] = []): TenantWithRelations {
    return {
      id: tenant.id,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      isDeleted: tenant.isDeleted,
      version: tenant.version,
      tenantId: tenant.tenantId,
      name: tenant.name,
      subdomain: tenant.subdomain,
      legalName: tenant.legalName,
      isActive: tenant.isActive,
      status: tenant.status,
      identifier: tenant.identifier,
      foundedDate: tenant.business?.foundedDate,
      business: tenant.business,
      registration: tenant.registration,
      verification: tenant.verification,
      contact: tenant.contact,
      // Include addresses and contacts
      addresses,
      contactInfo: contacts,
    };
  }
}
