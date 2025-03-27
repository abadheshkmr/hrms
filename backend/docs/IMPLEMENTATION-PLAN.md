# HRMS SaaS Implementation Plan - Phase 1

This document outlines the immediate implementation steps for creating common/shared entities in the HRMS SaaS application. We'll focus on the most critical shared components first and defer more complex implementations for later phases.

## Current Focus

We will implement the following core shared entities:

1. Base entities
2. Address structure  
3. Contact information
4. Basic enumerations

These components represent the foundation for standardizing data across the application and will provide immediate benefits with less complexity.

## Implementation Steps

### Step 1: Create Feature Branch
```bash
git checkout -b feature/common-entities
```

### Step 2: Create Base Entities

1. Create `/backend/src/common/entities/base.entity.ts`
   ```typescript
   import { 
     BaseEntity,
     CreateDateColumn,
     UpdateDateColumn,
     PrimaryGeneratedColumn,
     Column
   } from 'typeorm';
   
   export abstract class EntityBase extends BaseEntity {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @CreateDateColumn()
     createdAt: Date;
   
     @UpdateDateColumn()
     updatedAt: Date;
   
     @Column({ default: false })
     isDeleted: boolean;
   
     @Column({ nullable: true })
     tenantId: string;
   }
   ```

2. Create `/backend/src/common/entities/audit-base.entity.ts` (simplified version)
   ```typescript
   import { 
     Column,
     BeforeInsert,
     BeforeUpdate
   } from 'typeorm';
   import { EntityBase } from './base.entity';
   
   export abstract class AuditBaseEntity extends EntityBase {
     @Column({ nullable: true })
     createdBy?: string;
   
     @Column({ nullable: true })
     updatedBy?: string;
     
     // Simplified version without full change history tracking
   }
   ```

3. Test the base entities:
   ```bash
   npm run test -- --testPathPattern=common
   ```

### Step 3: Create Common Enumerations

1. Create `/backend/src/common/enums/address.enum.ts`
   ```typescript
   export enum AddressType {
     PERMANENT = 'PERMANENT',
     CURRENT = 'CURRENT',
     WORK = 'WORK',
     CORPORATE = 'CORPORATE',
     REGISTERED = 'REGISTERED',
     SHIPPING = 'SHIPPING',
     BILLING = 'BILLING'
   }
   ```

2. Create `/backend/src/common/enums/contact.enum.ts`
   ```typescript
   export enum ContactType {
     PRIMARY = 'PRIMARY',
     SECONDARY = 'SECONDARY',
     EMERGENCY = 'EMERGENCY',
     WORK = 'WORK',
     PERSONAL = 'PERSONAL'
   }
   ```

3. Create `/backend/src/common/enums/person.enum.ts`
   ```typescript
   export enum Gender {
     MALE = 'MALE',
     FEMALE = 'FEMALE',
     OTHER = 'OTHER'
   }
   
   export enum MaritalStatus {
     SINGLE = 'SINGLE',
     MARRIED = 'MARRIED',
     DIVORCED = 'DIVORCED',
     WIDOWED = 'WIDOWED',
     OTHER = 'OTHER'
   }
   ```

### Step 4: Create Address Entity

1. Create `/backend/src/common/entities/address.entity.ts`
   ```typescript
   import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
   import { EntityBase } from './base.entity';
   import { AddressType } from '../enums/address.enum';
   
   @Entity('addresses')
   export class Address extends EntityBase {
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
   ```

2. Create simple DTO for Address:
   ```bash
   mkdir -p /backend/src/common/dto
   ```

3. Create `/backend/src/common/dto/address.dto.ts`
   ```typescript
   import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
   import { AddressType } from '../enums/address.enum';
   
   export class AddressDto {
     @IsNotEmpty()
     @IsString()
     addressLine1: string;
     
     @IsOptional()
     @IsString()
     addressLine2?: string;
     
     @IsNotEmpty()
     @IsString()
     city: string;
     
     @IsNotEmpty()
     @IsString()
     state: string;
     
     @IsNotEmpty()
     @IsString()
     country: string;
     
     @IsNotEmpty()
     @IsString()
     postalCode: string;
     
     @IsOptional()
     @IsString()
     landmark?: string;
     
     @IsEnum(AddressType)
     addressType: AddressType;
     
     @IsBoolean()
     isPrimary: boolean;
     
     @IsOptional()
     @IsNumber()
     latitude?: number;
     
     @IsOptional()
     @IsNumber()
     longitude?: number;
   }
   ```

4. Test the Address entity:
   ```bash
   npm run test -- --testPathPattern=address
   ```

### Step 5: Create Contact Information Entity

1. Create `/backend/src/common/entities/contact-info.entity.ts`
   ```typescript
   import { Entity, Column } from 'typeorm';
   import { EntityBase } from './base.entity';
   import { ContactType } from '../enums/contact.enum';
   
   @Entity('contact_info')
   export class ContactInfo extends EntityBase {
     @Column({ nullable: true })
     entityId: string;  // ID of the related entity (employee, tenant, etc.)
     
     @Column({ nullable: true })
     entityType: string;  // Type of the related entity ('EMPLOYEE', 'TENANT', etc.)
     
     @Column({ nullable: true })
     name?: string;
     
     @Column({ nullable: true })
     email?: string;
     
     @Column({ nullable: true })
     phone?: string;
     
     @Column({
       type: 'enum',
       enum: ContactType,
       default: ContactType.PRIMARY
     })
     contactType: ContactType;
     
     @Column({ default: false })
     isPrimary: boolean;
     
     @Column({ nullable: true })
     relationship?: string;  // For emergency contacts
   }
   ```

2. Create simple DTO for ContactInfo:
   ```bash
   mkdir -p /backend/src/common/dto
   ```

3. Create `/backend/src/common/dto/contact-info.dto.ts`
   ```typescript
   import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsEmail } from 'class-validator';
   import { ContactType } from '../enums/contact.enum';
   
   export class ContactInfoDto {
     @IsOptional()
     @IsString()
     name?: string;
     
     @IsOptional()
     @IsEmail()
     email?: string;
     
     @IsOptional()
     @IsString()
     phone?: string;
     
     @IsEnum(ContactType)
     contactType: ContactType;
     
     @IsBoolean()
     isPrimary: boolean;
     
     @IsOptional()
     @IsString()
     relationship?: string;
   }
   ```

4. Test the ContactInfo entity:
   ```bash
   npm run test -- --testPathPattern=contact
   ```

### Step 6: Build and Deploy

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy with Docker:
   ```bash
   docker-compose up -d --build
   ```

## Deferred for Later Phases

The following components will be implemented in future phases:

1. **Banking Information Entity**: 
   - Complete implementation of bank account data structure
   - Validation rules for banking data

2. **Document Management System**:
   - Document entity structure
   - Document upload/download service
   - Verification workflow

3. **Custom Validators**:
   - PAN, Aadhar, and other India-specific validators
   - Complex validation rules

4. **Base Repository Pattern**:
   - Common CRUD operations
   - Advanced filtering and pagination
   - Audit logging integration

5. **Comprehensive Change History**:
   - Detailed tracking of all entity changes
   - Diff generation between versions

## Next Steps After Phase 1

After successfully implementing and testing these core shared entities, we'll:

1. Refactor the Tenant module to use these entities
2. Refactor the Employee module to use these entities
3. Begin implementing the next phase of shared components

This focused approach allows us to make meaningful progress quickly while deferring more complex implementations until the foundation is proven.
