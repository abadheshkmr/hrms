import {
  IsNotEmpty,
  IsString,
  Matches,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsEmail,
  IsUrl,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { BusinessType, BusinessScale } from '../enums/tenant.enums';

export class CreateTenantDto {
  @ApiProperty({
    description: 'The name of the tenant (company or organization)',
    example: 'Acme Corporation',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'The subdomain for the tenant (used for accessing tenant-specific resources)',
    example: 'acme',
    pattern: '^[a-z0-9-]+$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  @MaxLength(63, { message: 'Subdomain cannot exceed 63 characters (DNS limitation)' })
  subdomain: string;

  @ApiProperty({
    description: 'The legal name of the business',
    example: 'Acme Corporation Pvt Ltd',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Legal name cannot exceed 200 characters' })
  legalName?: string;

  @ApiProperty({
    description: 'The type of business',
    enum: BusinessType,
    example: BusinessType.PRODUCT,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiProperty({
    description: 'The scale of the business',
    enum: BusinessScale,
    example: BusinessScale.MEDIUM,
  })
  @IsOptional()
  @IsEnum(BusinessScale)
  businessScale?: BusinessScale;

  @ApiProperty({
    description: 'The GST number of the business',
    example: '22AAAAA0000A1Z5',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'GST number cannot exceed 15 characters' })
  gstNumber?: string;

  @ApiProperty({
    description: 'The PAN number of the business',
    example: 'AAAAA0000A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'PAN number cannot exceed 10 characters' })
  panNumber?: string;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Primary email address for the tenant',
    example: 'info@acmecorp.com',
  })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiProperty({
    description: 'Primary phone number for the tenant',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Primary phone cannot exceed 20 characters' })
  primaryPhone?: string;

  @ApiProperty({
    description: 'Website URL of the organization',
    example: 'https://www.acmecorp.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Unique identifier for the tenant (used in URLs and references)',
    example: 'acme-corp',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Identifier can only contain lowercase letters, numbers, and hyphens',
  })
  @MaxLength(50, { message: 'Identifier cannot exceed 50 characters' })
  identifier?: string;

  @ApiProperty({
    description: 'Date when the business was founded',
    example: '2010-01-15',
  })
  @IsOptional()
  @IsDateString()
  foundedDate?: string;

  @ApiProperty({
    description: 'Brief description of the tenant organization',
    example: 'Leading provider of cloud solutions for businesses',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Tax deduction account number',
    example: 'ABCD12345E',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'TAN number cannot exceed 10 characters' })
  tanNumber?: string;

  @ApiProperty({
    description: 'Micro, small, and medium enterprises registration number',
    example: 'UDYAM-XX-XX-0000000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'MSME number cannot exceed 20 characters' })
  msmeNumber?: string;

  @ApiProperty({
    description: 'Number of employees in the organization',
    example: 250,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  employeeCount?: number;

  @ApiProperty({
    description: 'Address information for the tenant',
    type: [AddressDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiProperty({
    description: 'Contact information for the tenant',
    type: [ContactInfoDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto[];
}
