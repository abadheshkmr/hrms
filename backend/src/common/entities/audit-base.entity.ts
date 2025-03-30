import { Column, DeleteDateColumn, BeforeInsert, BeforeUpdate, BeforeSoftRemove } from 'typeorm';
import { IsDate, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseEntity } from './base.entity';

/**
 * Represents a change record in the entity audit trail
 */
export class ChangeRecord {
  @IsDate()
  timestamp: Date;

  @IsUUID(4)
  @IsOptional()
  userId?: string;

  changedFields: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

/**
 * Base entity with audit capabilities
 * Extends BaseEntity to add audit-related fields for tracking changes
 * Automatically manages audit fields during entity lifecycle events
 */
export abstract class AuditBaseEntity extends BaseEntity {
  /**
   * ID of the user who created this entity
   */
  @IsUUID(4)
  @IsOptional()
  @Column({ nullable: true })
  createdBy?: string;

  /**
   * ID of the user who last updated this entity
   */
  @IsUUID(4)
  @IsOptional()
  @Column({ nullable: true })
  updatedBy?: string;

  /**
   * ID of the user who deleted this entity
   */
  @IsUUID(4)
  @IsOptional()
  @Column({ nullable: true })
  deletedBy?: string;

  /**
   * Timestamp when this entity was soft-deleted
   */
  @IsDate()
  @IsOptional()
  @DeleteDateColumn()
  deletedAt?: Date;

  /**
   * History of changes made to this entity
   * Stores a record of field changes, who made them and when
   */
  @ValidateNested({ each: true })
  @Type(() => ChangeRecord)
  @IsOptional()
  @Column({ type: 'jsonb', nullable: true })
  changeHistory?: ChangeRecord[];

  /**
   * Current user ID for audit operations
   * Should be set before save/update operations
   * Not persisted to database
   */
  currentUserId?: string;

  /**
   * Sets the createdBy field on entity creation if currentUserId is provided
   */
  @BeforeInsert()
  protected setCreatedBy(): void {
    if (this.currentUserId) {
      this.createdBy = this.currentUserId;
    }
  }

  /**
   * Sets the updatedBy field on entity update if currentUserId is provided
   */
  @BeforeUpdate()
  protected setUpdatedBy(): void {
    if (this.currentUserId) {
      this.updatedBy = this.currentUserId;
    }
  }

  /**
   * Sets the deletedBy field on entity soft removal if currentUserId is provided
   */
  @BeforeSoftRemove()
  protected setDeletedBy(): void {
    if (this.currentUserId) {
      this.deletedBy = this.currentUserId;
    }
  }

  /**
   * Adds a change record to the entity's change history
   * @param userId - ID of the user making the change
   * @param changedFields - Array of field names that were changed
   * @param oldValues - Record of previous field values
   * @param newValues - Record of new field values
   */
  addChangeRecord(
    userId: string,
    changedFields: string[],
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
  ): void {
    const changeRecord: ChangeRecord = {
      timestamp: new Date(),
      userId,
      changedFields,
      oldValues,
      newValues,
    };

    if (!this.changeHistory) {
      this.changeHistory = [];
    }

    this.changeHistory.push(changeRecord);
  }
}
