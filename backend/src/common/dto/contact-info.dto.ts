import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsEmail } from 'class-validator';
import { ContactType } from '../enums/contact.enum';

export class ContactInfoDto {
  @IsOptional()
  @IsString()
  name?: string;
  
  @IsOptional()
  @IsEmail()
  email?: string;
  
  @IsOptional()
  @IsString()
  phone?: string;
  
  @IsEnum(ContactType)
  contactType: ContactType;
  
  @IsBoolean()
  isPrimary: boolean;
  
  @IsOptional()
  @IsString()
  relationship?: string;
}
