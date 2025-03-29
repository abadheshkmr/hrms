import { IsBoolean, IsOptional, IsString, Matches, IsEnum, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { BusinessType, BusinessScale } from '../enums/tenant.enums';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'The name of the tenant (company or organization)',
    example: 'Acme Corporation Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'The subdomain for the tenant (used for accessing tenant-specific resources)',
    example: 'acme-updated',
    pattern: '^[a-z0-9-]+$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  subdomain?: string;

  @ApiPropertyOptional({
    description: 'The legal name of the business',
    example: 'Acme Corporation Pvt Ltd',
  })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({
    description: 'The type of business',
    enum: BusinessType,
    example: BusinessType.PRODUCT,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({
    description: 'The scale of the business',
    enum: BusinessScale,
    example: BusinessScale.MEDIUM,
  })
  @IsOptional()
  @IsEnum(BusinessScale)
  businessScale?: BusinessScale;

  @ApiPropertyOptional({
    description: 'The GST number of the business',
    example: '22AAAAA0000A1Z5',
  })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'The PAN number of the business',
    example: 'AAAAA0000A',
  })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional({
    description: 'Whether the tenant is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Address information for the tenant',
    type: [AddressDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiPropertyOptional({
    description: 'Contact information for the tenant',
    type: [ContactInfoDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto[];
}
