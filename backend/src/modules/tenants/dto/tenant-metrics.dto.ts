import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TenantStatus } from '../enums/tenant.enums';

/**
 * DTO for tenant metrics data
 */
export class TenantMetricsDto {
  @ApiProperty({ description: 'Count of active users in the tenant' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  activeUsersCount?: number;

  @ApiProperty({ description: 'Total API requests made by the tenant' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalApiRequests?: number;

  @ApiProperty({ description: 'Average requests per day' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  avgRequestsPerDay?: number;

  @ApiProperty({ description: 'Storage usage in MB' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  storageUsageMb?: number;

  @ApiProperty({ description: 'Last activity timestamp' })
  @IsDate()
  @IsOptional()
  lastActivityAt?: Date;

  @ApiProperty({ enum: TenantStatus, description: 'Current tenant status' })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;
}

/**
 * DTO for tenant configuration
 */
export class TenantConfigurationDto {
  @ApiProperty({ description: 'Configuration key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

/**
 * Request DTO for idempotent operations
 */
export class IdempotencyRequestDto {
  @ApiProperty({ description: 'Idempotency key (client-generated UUID)' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
