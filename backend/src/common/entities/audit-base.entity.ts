import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class AuditBaseEntity extends BaseEntity {
  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  // Simplified version without full change history tracking for now
  // We can add more comprehensive audit tracking in future phases
}
