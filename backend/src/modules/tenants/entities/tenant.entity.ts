import { Entity, Column, Index, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditBaseEntity } from '../../../common/entities/audit-base.entity';
import { RegistrationInfo } from './embedded/registration-info.entity';
import { BusinessInfo } from './embedded/business-info.entity';
import { VerificationInfo } from './embedded/verification-info.entity';
import { ContactDetails } from './embedded/contact-details.entity';
import { TenantStatus, VerificationStatus } from '../enums/tenant.enums';
import { Address } from '../../../common/entities/address.entity';
import { ContactInfo } from '../../../common/entities/contact-info.entity';

/**
 * Tenant entity representing an organization in the multi-tenant system
 * This is a root entity that doesn't belong to any tenant and serves as the foundation
 * for tenant-specific data
 */
@Entity('tenants')
@Index(['name'], { unique: true })
@Index(['subdomain'], { unique: true })
@Index(['identifier'], { unique: true, where: 'identifier IS NOT NULL' })
@Index(['status', 'isActive'])
@Index(['business.businessType', 'business.businessScale'])
export class Tenant extends AuditBaseEntity {
  /**
   * Override the tenantId from BaseEntity to ensure it's always null for Tenant entities
   * A tenant doesn't belong to a tenant - it IS a tenant
   */
  @Column({ nullable: true, default: null, type: 'varchar' })
  @IsOptional()
  override tenantId: string | null = null;
  /**
   * Name of the tenant (company or organization)
   * Must be unique across all tenants
   */
  @ApiProperty({
    description: 'The name of the tenant (company or organization)',
    example: 'Acme Corporation',
  })
  @Column({ unique: true })
  @IsNotEmpty({ message: 'Tenant name is required' })
  @IsString({ message: 'Tenant name must be a string' })
  @MinLength(2, { message: 'Tenant name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Tenant name cannot exceed 100 characters' })
  name: string;

  /**
   * Subdomain for tenant-specific access to the application
   * Must be unique, lowercase, contain only alphanumeric characters and hyphens
   */
  @ApiProperty({
    description: 'The subdomain for the tenant',
    example: 'acme',
  })
  @Column({ unique: true })
  @IsNotEmpty({ message: 'Subdomain is required' })
  @IsString({ message: 'Subdomain must be a string' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  @MinLength(3, { message: 'Subdomain must be at least 3 characters long' })
  @MaxLength(63, { message: 'Subdomain cannot exceed 63 characters' })
  subdomain: string;

  /**
   * Legal/trade name of the organization
   * May differ from the display name
   */
  @ApiProperty({
    description: 'The legal/trade name of the organization',
    example: 'Acme Corp Ltd.',
  })
  @Column({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Legal name must be a string' })
  @MaxLength(200, { message: 'Legal name cannot exceed 200 characters' })
  legalName: string;

  /**
   * Business information embedded entity
   * Groups related business fields (type, scale, industry, etc.)
   */
  @Column(() => BusinessInfo)
  business: BusinessInfo;

  /**
   * Registration information embedded entity
   * Groups registration-related fields (CIN, PAN, GST, etc.)
   */
  @Column(() => RegistrationInfo)
  registration: RegistrationInfo;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
  })
  @Column({ default: true })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive: boolean;

  @ApiProperty({
    description: 'The tenant status in the system lifecycle',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  @Index()
  @IsEnum(TenantStatus, { message: 'Invalid tenant status' })
  status: TenantStatus;

  /**
   * Verification information embedded entity
   * Groups verification-related fields (status, date, verifiedBy, notes)
   */
  @Column(() => VerificationInfo)
  verification: VerificationInfo;

  /**
   * Contact details embedded entity
   * Groups contact-related fields (website, email, phone)
   */
  @Column(() => ContactDetails)
  contact: ContactDetails;

  /**
   * Unique identifier for the tenant (used in URLs and references)
   * Must be URL-safe and unique if provided
   */
  @ApiProperty({
    description: 'Unique identifier for the tenant (used in URLs and references)',
    example: 'acme-corp',
  })
  @Column({ nullable: true, unique: true })
  @IsOptional()
  @IsString({ message: 'Identifier must be a string' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Identifier can only contain lowercase letters, numbers, and hyphens',
  })
  @MinLength(3, { message: 'Identifier must be at least 3 characters long' })
  @MaxLength(50, { message: 'Identifier cannot exceed 50 characters' })
  identifier: string;

  // Removed foundedDate as it's now in BusinessInfo

  // Moved tanNumber and msmeNumber to RegistrationInfo

  /**
   * One-to-many relationship with Address entities
   * Establishes explicit relationship rather than relying on entityId/entityType pattern
   */
  @OneToMany(() => Address, (address) => address.entityId, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  @JoinColumn()
  @Type(() => Address)
  addresses: Address[];

  /**
   * One-to-many relationship with ContactInfo entities
   * Establishes explicit relationship rather than relying on entityId/entityType pattern
   */
  @OneToMany(() => ContactInfo, (contactInfo) => contactInfo.entityId, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  @JoinColumn()
  @Type(() => ContactInfo)
  contacts: ContactInfo[];

  /**
   * Check if tenant is active and can be used
   * @returns boolean indicating if tenant is active
   */
  isActiveTenant(): boolean {
    return this.isActive && this.status === TenantStatus.ACTIVE;
  }

  /**
   * Check if tenant is verified
   * @returns boolean indicating if tenant is verified
   */
  isVerified(): boolean {
    return this.verification?.verificationStatus === VerificationStatus.VERIFIED;
  }

  /**
   * Sets tenant status with proper validation of allowed transitions
   * Implements a state machine for tenant lifecycle
   * @param status - New status to set
   * @throws Error if transition is invalid
   */
  setStatus(status: TenantStatus): void {
    // Define allowed status transitions
    const allowedTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.PENDING]: [TenantStatus.ACTIVE, TenantStatus.TERMINATED],
      [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.TERMINATED],
      [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.TERMINATED],
      [TenantStatus.TERMINATED]: [], // Terminal state, no transitions allowed
    };

    // Check if transition is allowed
    if (!allowedTransitions[this.status].includes(status)) {
      throw new Error(`Invalid status transition: Cannot change from ${this.status} to ${status}`);
    }

    // Update status if transition is valid
    this.status = status;

    // Update isActive based on status
    this.isActive = status === TenantStatus.ACTIVE;
  }

  /**
   * Sets verification status with validation of allowed transitions
   * @param status - New verification status to set
   * @param userId - ID of the user making the verification
   * @param notes - Optional notes about the verification
   * @throws Error if transition is invalid
   */
  setVerificationStatus(status: VerificationStatus, userId?: string, notes?: string): void {
    // Define allowed verification status transitions
    const allowedTransitions: Record<VerificationStatus, VerificationStatus[]> = {
      [VerificationStatus.PENDING]: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
      [VerificationStatus.VERIFIED]: [VerificationStatus.PENDING],
      [VerificationStatus.REJECTED]: [VerificationStatus.PENDING],
    };

    // Check if transition is allowed
    if (!allowedTransitions[this.verification.verificationStatus].includes(status)) {
      throw new Error(
        `Invalid verification status transition: Cannot change from ${this.verification.verificationStatus} to ${status}`,
      );
    }

    // Update verification status
    this.verification.verificationStatus = status;

    // Set verification metadata for VERIFIED status
    if (status === VerificationStatus.VERIFIED) {
      this.verification.verificationDate = new Date();
      if (userId) {
        this.verification.verifiedById = userId;
      }
      if (notes) {
        this.verification.verificationNotes = notes;
      }
    }
  }

  /**
   * Generates a unique subdomain based on the tenant name if not provided
   * @returns The generated subdomain
   */
  generateSubdomain(): string {
    if (!this.subdomain && this.name) {
      // Convert name to lowercase, replace spaces with hyphens, remove special chars
      const baseSubdomain = this.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Ensure minimum length
      if (baseSubdomain.length < 3) {
        return `t-${baseSubdomain}-${Date.now().toString(36)}`;
      }

      return baseSubdomain;
    }
    return this.subdomain;
  }

  /**
   * Complete business validation of the tenant entity
   * Checks all business rules and constraints
   * @returns Array of validation error messages, empty if valid
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Check required fields based on status
    if (this.status === TenantStatus.ACTIVE) {
      if (!this.isVerified()) {
        errors.push('Tenant must be verified before it can be activated');
      }

      // Business info validations for active tenants
      if (!this.business?.businessType) {
        errors.push('Business type is required for active tenants');
      }

      if (!this.business?.industry) {
        errors.push('Industry is required for active tenants');
      }

      // Registration info validations
      const requiredRegistrationField =
        this.registration?.cinNumber ||
        this.registration?.panNumber ||
        this.registration?.gstNumber;

      if (!requiredRegistrationField) {
        errors.push('At least one registration number (CIN, PAN, or GST) is required');
      }
    }

    return errors;
  }
}
