import { Injectable, Scope } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { TenantContextService } from '../../modules/tenants/services/tenant-context.service';

/**
 * Specialized logger that includes tenant context information in log messages
 */
@Injectable({ scope: Scope.TRANSIENT })
export class TenantLoggerService extends LoggerService {
  constructor(private readonly tenantContextService: TenantContextService) {
    super();
  }

  /**
   * @override
   * Log an informational message with tenant context
   */
  log(message: string, ...optionalParams: unknown[]): void {
    super.log(this.addTenantContext(message), ...optionalParams);
  }

  /**
   * @override
   * Log an error message with tenant context
   */
  error(message: string, trace?: string, ...optionalParams: unknown[]): void {
    super.error(this.addTenantContext(message), trace, ...optionalParams);
  }

  /**
   * @override
   * Log a warning message with tenant context
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    super.warn(this.addTenantContext(message), ...optionalParams);
  }

  /**
   * @override
   * Log a debug message with tenant context
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    super.debug(this.addTenantContext(message), ...optionalParams);
  }

  /**
   * @override
   * Log a verbose message with tenant context
   */
  verbose(message: string, ...optionalParams: unknown[]): void {
    super.verbose(this.addTenantContext(message), ...optionalParams);
  }

  /**
   * Add tenant context information to a log message
   * @param message The original message
   * @returns Message with tenant context
   */
  private addTenantContext(message: string): string {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    return tenantId ? `[Tenant: ${tenantId}] ${message}` : message;
  }
}
