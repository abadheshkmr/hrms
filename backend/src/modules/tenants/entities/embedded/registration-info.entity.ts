import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Embedded entity for tenant registration information
 * Groups related registration fields for better organization
 */
export class RegistrationInfo {
  @ApiProperty({
    description: 'Corporate Identity Number (CIN)',
    example: 'U72200TN2021PTC141323',
    required: false,
  })
  @Column({ nullable: true })
  cinNumber?: string;

  @ApiProperty({
    description: 'Permanent Account Number (PAN)',
    example: 'AAAPL1234C',
    required: false,
  })
  @Column({ nullable: true })
  panNumber?: string;

  @ApiProperty({
    description: 'Goods and Services Tax Number (GST)',
    example: '33AAAPL1234C1Z5',
    required: false,
  })
  @Column({ nullable: true })
  gstNumber?: string;

  @ApiProperty({
    description: 'Tax Deduction Account Number (TAN)',
    example: 'CHEM12345A',
    required: false,
  })
  @Column({ nullable: true })
  tanNumber?: string;

  @ApiProperty({
    description: 'MSME Registration Number',
    example: 'UDYAM-TN-01-0000001',
    required: false,
  })
  @Column({ nullable: true })
  msmeNumber?: string;
}
