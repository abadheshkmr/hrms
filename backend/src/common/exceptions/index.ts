/**
 * Index file to re-export all custom exception classes
 */

// Data Access Exceptions
export * from './entity-not-found.exception';
export * from './duplicate-resource.exception';
export * from './database-operation.exception';

// Business Logic Exceptions
export * from './validation.exception';
export * from './business-rule-violation.exception';

// Authorization Exceptions
export * from './insufficient-permissions.exception';
export * from './unauthorized-access.exception';

// Multi-tenant Specific Exceptions
export * from './tenant-inactive.exception';
export * from './cross-tenant-operation.exception';

// System Exceptions
export * from './external-service.exception';
export * from './configuration.exception';
