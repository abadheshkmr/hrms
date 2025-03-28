import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { AddressType } from '../enums/address.enum';

export class AddressDto {
  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsEnum(AddressType)
  addressType: AddressType;

  @IsBoolean()
  isPrimary: boolean;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
