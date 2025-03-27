import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AddressType } from '../enums/address.enum';

@Entity('addresses')
@Index(['entityId', 'entityType', 'tenantId'])
export class Address extends BaseEntity {
  @Column({ nullable: true })
  entityId: string;  // ID of the related entity (employee, tenant, etc.)
  
  @Column({ nullable: true })
  entityType: string;  // Type of the related entity ('EMPLOYEE', 'TENANT', etc.)
  
  @Column()
  addressLine1: string;
  
  @Column({ nullable: true })
  addressLine2?: string;
  
  @Column()
  city: string;
  
  @Column()
  state: string;
  
  @Column()
  country: string;
  
  @Column()
  postalCode: string;
  
  @Column({ nullable: true })
  landmark?: string;
  
  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.CURRENT
  })
  addressType: AddressType;
  
  @Column({ default: false })
  isPrimary: boolean;
  
  @Column({ nullable: true, type: 'float' })
  latitude?: number;
  
  @Column({ nullable: true, type: 'float' })
  longitude?: number;
}
