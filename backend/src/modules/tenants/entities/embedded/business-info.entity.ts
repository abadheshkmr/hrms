import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDate,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType, BusinessScale } from '../../enums/tenant.enums';

/**
 * Embedded entity for tenant business information
 * Groups related business fields for better organization
 */
export class BusinessInfo {
  /**
   * Type of business operation (service, product, manufacturing, etc.)
   */
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
  @IsEnum(BusinessType, { message: 'Business type must be a valid type' })
  @IsOptional()
  businessType?: BusinessType;

  /**
   * Scale of business operations (startup, small, medium, etc.)
   */
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
  @IsEnum(BusinessScale, { message: 'Business scale must be a valid scale' })
  @IsOptional()
  businessScale?: BusinessScale;

  /**
   * Industry or sector the business operates in
   */
  @ApiProperty({
    description: 'Industry or sector the business operates in',
    example: 'Information Technology',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'Industry must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Industry name must be at least 2 characters' })
  @MaxLength(100, { message: 'Industry name cannot exceed 100 characters' })
  industry?: string;

  /**
   * Brief description of the business activities
   */
  @ApiProperty({
    description: 'Brief description of the business',
    example: 'Software development and IT consulting services',
    required: false,
  })
  @Column({ nullable: true, type: 'text' })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  /**
   * Number of employees in the organization
   */
  @ApiProperty({
    description: 'Number of employees',
    example: 50,
    required: false,
  })
  @Column({ nullable: true })
  @IsNumber({}, { message: 'Employee count must be a number' })
  @IsOptional()
  @IsPositive({ message: 'Employee count must be a positive number' })
  @Min(1, { message: 'Employee count must be at least 1' })
  @Max(1000000, { message: 'Employee count is too large' })
  employeeCount?: number;

  /**
   * Date when the business was founded
   * Used for calculating business age and reporting
   */
  @ApiProperty({
    description: 'Date when the business was founded',
    example: '2020-01-15',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  @IsDate({ message: 'Founded date must be a valid date' })
  @IsOptional()
  @Type(() => Date)
  foundedDate?: Date;
}
