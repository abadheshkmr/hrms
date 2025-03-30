import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationStatus } from '../../enums/tenant.enums';

/**
 * Embedded entity for tenant verification information
 * Groups related verification fields for better organization
 * Used to track the verification process and status of a tenant
 */
export class VerificationInfo {
  constructor() {
    // Set default values when instantiated
    this.verificationStatus = VerificationStatus.PENDING;
    this.verificationAttempted = false;
  }
  /**
   * Current verification status of the tenant
   * Controls tenant capabilities and access to certain features
   */
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
  @IsEnum(VerificationStatus, { message: 'Verification status must be a valid status' })
  verificationStatus: VerificationStatus;

  /**
   * Date when the tenant was last verified or verification status was updated
   * Used for reporting and compliance tracking
   */
  @ApiProperty({
    description: 'Date when the tenant was verified',
    example: '2023-03-15T12:00:00Z',
    required: false,
  })
  @Column({ nullable: true })
  @IsDate({ message: 'Verification date must be a valid date' })
  @IsOptional()
  @Type(() => Date)
  verificationDate?: Date;

  /**
   * ID of the user who performed the verification
   * Used for audit trail and accountability
   */
  @ApiProperty({
    description: 'ID of the user who verified the tenant',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @Column({ nullable: true })
  @IsUUID('4', { message: 'Verified by ID must be a valid UUID' })
  @IsOptional()
  verifiedById?: string;

  /**
   * Notes related to the verification process
   * Can include reasons for approval/rejection or required additional information
   */
  @ApiProperty({
    description: 'Notes related to the verification process',
    example: 'All documents verified and found to be authentic',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  @IsString({ message: 'Verification notes must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Verification notes cannot exceed 1000 characters' })
  verificationNotes?: string;

  /**
   * Documents provided for verification
   * Comma-separated list of document IDs that were submitted for verification
   */
  @ApiProperty({
    description: 'List of document IDs submitted for verification',
    example: 'doc-001,doc-002,doc-003',
    required: false,
  })
  @Column({ nullable: true })
  @IsString({ message: 'Verification documents must be a string' })
  @IsOptional()
  verificationDocuments?: string;

  /**
   * Flag indicating if verification has been attempted at least once
   * Used to differentiate between new tenants and those who've gone through verification
   */
  @ApiProperty({
    description: 'Whether verification has been attempted',
    example: true,
  })
  @Column({ default: false })
  verificationAttempted: boolean;

  /**
   * Get a list of document IDs that were submitted for verification
   * @returns Array of document IDs or empty array if none
   */
  getVerificationDocuments(): string[] {
    if (!this.verificationDocuments) return [];
    return this.verificationDocuments
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  /**
   * Add a document ID to the verification documents list
   * @param documentId - ID of document to add to verification list
   */
  addVerificationDocument(documentId: string): void {
    const documents = this.getVerificationDocuments();
    if (!documents.includes(documentId)) {
      documents.push(documentId);
      this.verificationDocuments = documents.join(',');
    }
  }

  /**
   * Check if verification is complete based on status
   * @returns Boolean indicating if verification process is complete
   */
  isVerificationComplete(): boolean {
    return this.verificationStatus === VerificationStatus.VERIFIED;
  }
}
