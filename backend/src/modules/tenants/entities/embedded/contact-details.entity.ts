import { Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Embedded entity for tenant contact details
 * Groups related contact fields for better organization
 */
export class ContactDetails {
  @ApiProperty({
    description: 'Website URL of the tenant',
    example: 'https://example.com',
    required: false,
  })
  @Column({ nullable: true })
  website?: string;

  @ApiProperty({
    description: 'Primary email address for the tenant',
    example: 'contact@example.com',
  })
  @Column({ nullable: true })
  primaryEmail?: string;

  @ApiProperty({
    description: 'Primary phone number for the tenant',
    example: '+91 9876543210',
  })
  @Column({ nullable: true })
  primaryPhone?: string;

  @ApiProperty({
    description: 'Support email address for the tenant',
    example: 'support@example.com',
    required: false,
  })
  @Column({ nullable: true })
  supportEmail?: string;

  @ApiProperty({
    description: 'Support phone number for the tenant',
    example: '+91 8765432109',
    required: false,
  })
  @Column({ nullable: true })
  supportPhone?: string;
}
