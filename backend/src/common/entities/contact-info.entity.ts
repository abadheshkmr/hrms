import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ContactType } from '../enums/contact.enum';

@Entity('contact_info')
@Index(['entityId', 'entityType', 'tenantId'])
export class ContactInfo extends BaseEntity {
  @Column({ nullable: true })
  entityId: string; // ID of the related entity (employee, tenant, etc.)

  @Column({ nullable: true })
  entityType: string; // Type of the related entity ('EMPLOYEE', 'TENANT', etc.)

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: ContactType,
    default: ContactType.PRIMARY,
  })
  contactType: ContactType;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ nullable: true })
  relationship?: string; // For emergency contacts
}
