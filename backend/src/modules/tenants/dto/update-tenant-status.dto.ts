import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '../enums/tenant.enums';

export class UpdateTenantStatusDto {
  @ApiProperty({
    description: 'New status for the tenant',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @IsEnum(TenantStatus)
  status: TenantStatus;

  @ApiProperty({
    description: 'Reason for status change (for audit purposes)',
    example: 'Completed verification process',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    description: 'Actor who initiated the status change (for audit purposes)',
    example: 'admin@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  actor?: string;
}
