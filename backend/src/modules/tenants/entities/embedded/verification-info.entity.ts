import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '../../enums/tenant.enums';

/**
 * Embedded entity for tenant verification information
 * Groups related verification fields for better organization
 */
export class VerificationInfo {
  @ApiProperty({
    description: 'Verification status of the tenant',
    enum: VerificationStatus,
    example: VerificationStatus.VERIFIED,
  })
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({
    description: 'Date when the tenant was verified',
    example: '2023-03-15T12:00:00Z',
    required: false,
  })
  @Column({ nullable: true })
  verificationDate?: Date;

  @ApiProperty({
    description: 'ID of the user who verified the tenant',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @Column({ nullable: true })
  verifiedById?: string;

  @ApiProperty({
    description: 'Notes related to the verification process',
    example: 'All documents verified and found to be authentic',
    required: false,
  })
  @Column({ nullable: true })
  verificationNotes?: string;
}
