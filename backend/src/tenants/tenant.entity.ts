import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tenants')
export class Tenant {
  @ApiProperty({
    description: 'The unique identifier of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The name of the tenant (company or organization)',
    example: 'Acme Corporation',
  })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'The subdomain for the tenant',
    example: 'acme',
  })
  @Column({ unique: true })
  subdomain: string;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'The date and time when the tenant was created',
    example: '2025-03-26T16:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the tenant was last updated',
    example: '2025-03-26T16:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
