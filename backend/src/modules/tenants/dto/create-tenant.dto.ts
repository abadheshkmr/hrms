import {
  IsNotEmpty,
  IsString,
  Matches,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { BusinessType, BusinessScale } from '../entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({
    description: 'The name of the tenant (company or organization)',
    example: 'Acme Corporation',
  })
  @IsNotEmpty()
  @IsString()
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
  subdomain: string;

  @ApiProperty({
    description: 'The legal name of the business',
    example: 'Acme Corporation Pvt Ltd',
  })
  @IsOptional()
  @IsString()
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
  gstNumber?: string;

  @ApiProperty({
    description: 'The PAN number of the business',
    example: 'AAAAA0000A',
  })
  @IsOptional()
  @IsString()
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
