import { Column, DeleteDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Base entity with audit capabilities
 * Extends BaseEntity to add audit-related fields for tracking changes
 */
export abstract class AuditBaseEntity extends BaseEntity {
  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @Column({ nullable: true })
  deletedBy?: string;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  changeHistory?: Record<string, unknown>[];
}
