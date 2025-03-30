import { Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { BaseEntity } from './base.entity';

/**
 * Base entity for all tenant-specific entities
 * Enforces the requirement for a tenantId and provides tenant-specific functionality
 */
export abstract class TenantBaseEntity extends BaseEntity {
  /**
   * Required tenant ID - enforces multi-tenancy
   * This overrides the optional tenantId in BaseEntity to make it required
   */
  @IsNotEmpty({ message: 'Tenant ID is required for tenant-specific entities' })
  @IsUUID(4, { message: 'Tenant ID must be a valid UUID' })
  @Column()
  declare tenantId: string;

  /**
   * Ensures tenant ID is never null or undefined
   * @throws Error if tenantId is missing
   */
  @BeforeInsert()
  @BeforeUpdate()
  protected validateTenantId(): void {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required for tenant-specific entities');
    }
  }

  /**
   * Checks if this entity belongs to the specified tenant
   * @param tenantId - The tenant ID to check against
   * @returns true if the entity belongs to the specified tenant, false otherwise
   */
  belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }
}
