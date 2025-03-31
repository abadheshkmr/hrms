import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  VersionColumn,
  BeforeInsert,
} from 'typeorm';
import { IsUUID, IsDate, IsBoolean, IsOptional, ValidateIf } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base entity with common fields for all entities
 * Provides standard fields and functionality for all entities in the system
 */
export abstract class BaseEntity {
  /**
   * Primary key using UUID v4
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @IsUUID(4)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Creation timestamp, automatically set by TypeORM
   */
  @IsDate()
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Last update timestamp, automatically updated by TypeORM
   */
  @IsDate()
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft delete flag, used to mark an entity as deleted without physically removing it
   * @default false
   */
  @IsBoolean()
  @Column({ default: false })
  isDeleted: boolean;

  /**
   * Version number for optimistic locking
   * Automatically incremented on each entity update
   * @default 1
   */
  @VersionColumn({ default: 1 })
  version: number;

  /**
   * Optional tenant ID - this should be null for Tenant entities
   * For tenant-specific entities, use TenantBaseEntity instead
   */
  @IsOptional()
  @ValidateIf((o: BaseEntity) => o.tenantId !== null)
  @IsUUID(4)
  @Column({ nullable: true, type: 'uuid' })
  tenantId?: string | null;

  /**
   * Generates a UUID for new entities if not already set
   */
  @BeforeInsert()
  protected generateUuid(): void {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
