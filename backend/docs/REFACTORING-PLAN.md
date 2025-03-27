# HRMS SaaS Refactoring Plan

This document outlines a step-by-step plan to incrementally implement shared/common entities and improve the architecture of the HRMS SaaS application. Each step includes testing and deployment to ensure everything works correctly.

## Initial Setup

### Step 1: Create Feature Branch
```bash
git checkout -b feature/common-entities
```

### Step 2: Set Up Testing Framework
- Configure Jest for backend testing
- Set up test data fixtures
- Create basic test scripts for each module

## Phase 1: Core Base Entities

### Step 3: Create Base Entities
1. Create `/backend/src/common/entities/base.entity.ts`
   - Implement common fields (id, createdAt, updatedAt, isDeleted, tenantId)
   - Add appropriate TypeORM decorators

2. Create `/backend/src/common/entities/audit-base.entity.ts`
   - Extend base entity with audit fields
   - Add change history tracking

3. Test and build:
```bash
npm run test -- --testPathPattern=common
npm run build
docker-compose up -d --build
```

## Phase 2: Common Value Objects

### Step 4: Address Entity
1. Create `/backend/src/common/entities/address.entity.ts`
   - Implement structured address pattern with standard fields
   - Support both embedded and relational approaches
   - Add validation decorators
   
2. Create address DTO and interfaces
   - Input/output DTOs
   - Validation rules
   
3. Test and build:
```bash
npm run test -- --testPathPattern=address
npm run build
docker-compose up -d --build
```

### Step 5: Contact Information Entity
1. Create `/backend/src/common/entities/contact-info.entity.ts`
   - Implementation for email, phone, alternate contact details
   - Add validation for phone numbers, emails
   
2. Create contact info DTOs
   - Standard validation rules
   
3. Test and build:
```bash
npm run test -- --testPathPattern=contact
npm run build
docker-compose up -d --build
```

### Step 6: Banking Information Entity
1. Create `/backend/src/common/entities/bank-account.entity.ts`
   - Standard banking fields (account, IFSC, type)
   - Validation rules for banking data
   
2. Test and build:
```bash
npm run test -- --testPathPattern=bank
npm run build
docker-compose up -d --build
```

## Phase 3: Document Management System

### Step 7: Document Entity and Service
1. Create `/backend/src/common/entities/document.entity.ts`
   - Standardized document structure
   - Metadata fields (name, type, issuance, expiry)
   - Verification status tracking
   
2. Create document service
   - Upload/download handling
   - Verification workflow
   
3. Test and build:
```bash
npm run test -- --testPathPattern=document
npm run build
docker-compose up -d --build
```

## Phase 4: Common Enumerations and Constants

### Step 8: Centralized Enums
1. Create `/backend/src/common/enums/` directory
   - Gender, MaritalStatus, etc.
   - Address types
   - Employment status, etc.
   - Document types
   
2. Test and build:
```bash
npm run test -- --testPathPattern=enums
npm run build
docker-compose up -d --build
```

## Phase 5: Validation Framework

### Step 9: Custom Validators
1. Create `/backend/src/common/validators/`
   - PAN validator
   - Aadhar validator
   - Phone/email validators
   - Address validators
   
2. Test and build:
```bash
npm run test -- --testPathPattern=validators
npm run build
docker-compose up -d --build
```

## Phase 6: Refactor Tenant Module

### Step 10: Refactor Tenant Entity
1. Update tenant entity to use common entities:
   - Replace embedded address with Address entity
   - Replace contact info with ContactInfo entity
   - Update banking with BankAccount entity
   
2. Update controllers and services
   
3. Test and build:
```bash
npm run test -- --testPathPattern=tenant
npm run build
docker-compose up -d --build
```

## Phase 7: Refactor Employee Module

### Step 11: Refactor Employee Entity
1. Update employee entity to use common entities
   - Replace custom address with Address entity
   - Replace contact info with ContactInfo entity
   - Update banking with BankAccount entity
   
2. Update controllers and services
   
3. Test and build:
```bash
npm run test -- --testPathPattern=employee
npm run build
docker-compose up -d --build
```

## Phase 8: Shared Repository Pattern

### Step 12: Implement Base Repository
1. Create `/backend/src/common/repositories/base.repository.ts`
   - Common CRUD operations
   - Audit logging
   - Tenant filtering
   
2. Refactor existing repositories to extend base repository
   
3. Test and build:
```bash
npm run test -- --testPathPattern=repository
npm run build
docker-compose up -d --build
```

## Phase 9: API Standards and Documentation

### Step 13: Standardize API Responses
1. Create consistent response structure
   - Standard success/error formats
   - Pagination support
   
2. Update Swagger documentation
   - Reflect all new entities and standards
   
3. Test and build:
```bash
npm run test -- --testPathPattern=api
npm run build
docker-compose up -d --build
```

## Phase 10: Final Integration and Testing

### Step 14: End-to-End Testing
1. Create integration test suite
   - Test common flows across modules
   - Verify tenant isolation
   
2. Run full test suite:
```bash
npm run test
npm run build
docker-compose up -d --build
```

### Step 15: Merge Feature Branch
1. Prepare PR with comprehensive documentation
2. Address review comments
3. Merge to main branch
```bash
git checkout main
git merge feature/common-entities
git push origin main
```

## Common Shared Objects Identified

Based on analysis of the existing codebase, we've identified these common entities that will be standardized:

### 1. Address Structure
- Street, locality, city, state, pincode
- Different address types (permanent, current, etc.)
- Geocoding support

### 2. Contact Information
- Email(s) and phone number(s)
- Emergency contacts
- Social media handles

### 3. Banking Information
- Account numbers, IFSC codes
- Bank names, branch details
- Account types

### 4. Document Management
- Document metadata
- Verification status
- Document types by business context

## Implementation Guidelines

- All entities should implement soft delete
- All changes must include proper audit logging
- Multi-tenancy should be respected at all layers
- Services should validate against the proper DTOs
- Use class-validator for consistent validation
- Add appropriate indexes for performance
- Write comprehensive tests for each entity
