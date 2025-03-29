import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

/**
 * Thrown when attempting to access a tenant that doesn't exist
 */
export class TenantNotFoundException extends NotFoundException {
  constructor(id?: string) {
    super(id ? `Tenant with ID ${id} not found` : 'Tenant not found');
  }
}

/**
 * Thrown when attempting to access a tenant that is inactive
 */
export class InactiveTenantException extends HttpException {
  constructor(id?: string) {
    super(id ? `Tenant with ID ${id} is inactive` : 'Tenant is inactive', HttpStatus.FORBIDDEN);
  }
}

/**
 * Thrown when attempting unauthorized access to a tenant
 */
export class UnauthorizedTenantAccessException extends HttpException {
  constructor(id?: string) {
    super(
      id ? `Unauthorized access to tenant with ID ${id}` : 'Unauthorized tenant access',
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Thrown when missing tenant context in a multi-tenant operation
 */
export class MissingTenantContextException extends HttpException {
  constructor() {
    super('Tenant context is required for this operation', HttpStatus.BAD_REQUEST);
  }
}
