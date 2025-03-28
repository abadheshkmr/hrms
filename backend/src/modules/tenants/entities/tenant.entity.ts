import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditBaseEntity } from '../../../common/entities/audit-base.entity';

export enum BusinessType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  OTHER = 'OTHER',
}

export enum BusinessScale {
  STARTUP = 'STARTUP',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE',
}

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

  @ApiProperty({
    description: 'The type of business',
    enum: BusinessType,
    example: BusinessType.SERVICE,
  })
  @Column({
    type: 'enum',
    enum: BusinessType,
    nullable: true,
  })
  businessType: BusinessType;

  @ApiProperty({
    description: 'The scale/size of the business',
    enum: BusinessScale,
    example: BusinessScale.MEDIUM,
  })
  @Column({
    type: 'enum',
    enum: BusinessScale,
    nullable: true,
  })
  businessScale: BusinessScale;

  @ApiProperty({
    description: 'The main industry or business category',
    example: 'Information Technology',
  })
  @Column({ nullable: true })
  industry: string;

  // Registration Information
  @ApiProperty({
    description: 'Company Identification Number',
    example: 'U72200MH2010PTC123456',
  })
  @Column({ nullable: true })
  cinNumber: string;

  @ApiProperty({
    description: 'Permanent Account Number',
    example: 'ABCDE1234F',
  })
  @Column({ nullable: true })
  panNumber: string;

  @ApiProperty({
    description: 'GST Identification Number',
    example: '27AAPFU0939F1ZV',
  })
  @Column({ nullable: true })
  gstNumber: string;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
  })
  @Column({ default: true })
  isActive: boolean;

  // Note: Instead of embedding address and contact info directly,
  // we use the relationship with our standardized entities
  // The addresses and contactInfo will be retrieved using the tenant's id as entityId
  // and 'TENANT' as entityType
}
