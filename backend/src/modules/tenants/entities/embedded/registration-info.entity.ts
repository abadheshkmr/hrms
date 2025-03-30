import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';

/**
 * Embedded entity for tenant registration information
 * Groups related registration fields for better organization
 */
export class RegistrationInfo {
  /**
   * Corporate Identity Number (CIN) - official company registration number
   */
  @ApiProperty({
    description: 'Corporate Identity Number (CIN)',
    example: 'U72200TN2021PTC141323',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'CIN number must be a string' })
  @IsOptional()
  @Matches(/^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, {
    message: 'CIN number must be in a valid format (e.g., U72200TN2021PTC141323)',
  })
  cinNumber?: string;

  /**
   * Permanent Account Number (PAN) - tax identification number
   */
  @ApiProperty({
    description: 'Permanent Account Number (PAN)',
    example: 'AAAPL1234C',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'PAN number must be a string' })
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'PAN number must be in a valid format (e.g., AAAPL1234C)',
  })
  panNumber?: string;

  /**
   * Goods and Services Tax Number (GST) - tax registration number
   */
  @ApiProperty({
    description: 'Goods and Services Tax Number (GST)',
    example: '33AAAPL1234C1Z5',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'GST number must be a string' })
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, {
    message: 'GST number must be in a valid format (e.g., 33AAAPL1234C1Z5)',
  })
  gstNumber?: string;

  /**
   * Tax Deduction Account Number (TAN) - for tax deduction at source
   */
  @ApiProperty({
    description: 'Tax Deduction Account Number (TAN)',
    example: 'CHEM12345A',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'TAN number must be a string' })
  @IsOptional()
  @Matches(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, {
    message: 'TAN number must be in a valid format (e.g., CHEM12345A)',
  })
  tanNumber?: string;

  /**
   * Micro, Small, and Medium Enterprises (MSME) registration number
   */
  @ApiProperty({
    description: 'MSME Registration Number',
    example: 'UDYAM-TN-01-0000001',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'MSME number must be a string' })
  @IsOptional()
  @Matches(/^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/, {
    message: 'MSME number must be in a valid format (e.g., UDYAM-TN-01-0000001)',
  })
  msmeNumber?: string;

  /**
   * Legal Entity Identifier (LEI) - global identifier for legal entities
   */
  @ApiProperty({
    description: 'Legal Entity Identifier (LEI)',
    example: '549300MLUDYVRQOOXS22',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'LEI must be a string' })
  @IsOptional()
  @Matches(/^[0-9A-Z]{20}$/, {
    message: 'LEI must be a 20-character alphanumeric code',
  })
  leiNumber?: string;

  /**
   * Registration date of the company
   */
  @ApiProperty({
    description: 'Company registration date',
    example: '2020-01-01',
    required: false,
  })
  @Column({ type: 'date', nullable: true })
  @IsOptional()
  registrationDate?: Date;

  /**
   * Validates if the registration information is complete for legal compliance
   * @returns boolean indicating if required registration info is present
   */
  isRegistrationComplete(): boolean {
    // At least one primary registration number should be present
    return Boolean(this.cinNumber || this.panNumber || this.gstNumber);
  }

  /**
   * Formats a registration number for display with proper formatting
   * @param type - Type of registration number to format
   * @returns Formatted registration number or null if not available
   */
  getFormattedRegistrationNumber(type: 'CIN' | 'PAN' | 'GST' | 'TAN' | 'MSME'): string | null {
    switch (type) {
      case 'CIN':
        return this.cinNumber || null;
      case 'PAN':
        return this.panNumber ? this.panNumber.toUpperCase() : null;
      case 'GST':
        return this.gstNumber ? this.gstNumber.toUpperCase() : null;
      case 'TAN':
        return this.tanNumber ? this.tanNumber.toUpperCase() : null;
      case 'MSME':
        return this.msmeNumber || null;
      default:
        return null;
    }
  }
}
