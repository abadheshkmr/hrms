import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditBaseEntity } from '../../../common/entities/audit-base.entity';
import { RegistrationInfo } from './embedded/registration-info.entity';
import { BusinessInfo } from './embedded/business-info.entity';
import { VerificationInfo } from './embedded/verification-info.entity';
import { ContactDetails } from './embedded/contact-details.entity';
import { TenantStatus } from '../enums/tenant.enums';

@Entity('tenants')
export class Tenant extends AuditBaseEntity {
  /**
   * Override the tenantId from BaseEntity to ensure it's always null for Tenant entities
   * A tenant doesn't belong to a tenant - it IS a tenant
   */
  @Column({ nullable: true, default: null, type: 'varchar' })
  override tenantId: string | null = null;
  @ApiProperty({
    description: 'The name of the tenant (company or organization)',
    example: 'Acme Corporation',
  })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'The subdomain for the tenant',
    example: 'acme',
  })
  @Column({ unique: true })
  subdomain: string;

  @ApiProperty({
    description: 'The legal/trade name of the organization',
    example: 'Acme Corp Ltd.',
  })
  @Column({ nullable: true })
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

  @ApiProperty({
    description: 'Unique identifier for the tenant (used in URLs and references)',
    example: 'acme-corp',
  })
  @Column({ nullable: true, unique: true })
  identifier: string;

  @ApiProperty({
    description: 'Date when the business was founded',
    example: '2010-01-15',
  })
  @Column({ nullable: true, type: 'date' })
  foundedDate: Date;

  @ApiProperty({
    description: 'Tax deduction account number',
    example: 'ABCD12345E',
  })
  @Column({ nullable: true })
  tanNumber: string;

  @ApiProperty({
    description: 'Micro, small, and medium enterprises registration number',
    example: 'UDYAM-XX-XX-0000000',
  })
  @Column({ nullable: true })
  msmeNumber: string;

  // Note: Instead of embedding address and contact info directly,
  // we use the relationship with our standardized entities
  // The addresses and contactInfo will be retrieved using the tenant's id as entityId
  // and 'TENANT' as entityType
}
