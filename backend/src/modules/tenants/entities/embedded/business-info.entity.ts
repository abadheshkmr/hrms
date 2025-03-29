import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType, BusinessScale } from '../../enums/tenant.enums';

/**
 * Embedded entity for tenant business information
 * Groups related business fields for better organization
 */
export class BusinessInfo {
  @ApiProperty({
    description: 'Type of business',
    enum: BusinessType,
    example: BusinessType.SERVICE,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.OTHER,
    nullable: true,
  })
  businessType?: BusinessType;

  @ApiProperty({
    description: 'Scale of business operations',
    enum: BusinessScale,
    example: BusinessScale.SMALL,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: BusinessScale,
    default: BusinessScale.SMALL,
    nullable: true,
  })
  businessScale?: BusinessScale;

  @ApiProperty({
    description: 'Industry or sector the business operates in',
    example: 'Information Technology',
    required: false,
  })
  @Column({ nullable: true })
  industry?: string;

  @ApiProperty({
    description: 'Brief description of the business',
    example: 'Software development and IT consulting services',
    required: false,
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Number of employees',
    example: 50,
    required: false,
  })
  @Column({ nullable: true })
  employeeCount?: number;

  @ApiProperty({
    description: 'Date when the business was founded',
    example: '2020-01-15',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  foundedDate?: Date;
}
