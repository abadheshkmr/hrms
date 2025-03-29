import { Injectable, Scope } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Specialized logger for security-related events
 * Provides enhanced logging for authentication, authorization, and other security concerns
 */
@Injectable({ scope: Scope.TRANSIENT })
export class SecurityLoggerService extends LoggerService {
  constructor() {
    super();
    this.setContext('Security');
  }

  /**
   * Log an authentication event
   * @param userId The user ID attempting authentication
   * @param success Whether authentication was successful
   * @param ipAddress The IP address of the request
   * @param details Additional details about the event
   */
  logAuthEvent(
    userId: string,
    success: boolean,
    ipAddress: string,
    details?: Record<string, unknown>,
  ): void {
    const status = success ? 'SUCCESS' : 'FAILURE';
    this.log(`Authentication ${status} | User: ${userId} | IP: ${ipAddress}`, details || {});
  }

  /**
   * Log an authorization event
   * @param userId The user ID involved
   * @param resource The resource being accessed
   * @param permission The permission being checked
   * @param granted Whether permission was granted
   * @param details Additional details about the event
   */
  logAuthorizationEvent(
    userId: string,
    resource: string,
    permission: string,
    granted: boolean,
    details?: Record<string, unknown>,
  ): void {
    const status = granted ? 'GRANTED' : 'DENIED';
    this.log(
      `Authorization ${status} | User: ${userId} | Resource: ${resource} | Permission: ${permission}`,
      details || {},
    );
  }

  /**
   * Log a security violation
   * @param type The type of violation
   * @param userId The user ID involved (if any)
   * @param ipAddress The IP address of the request
   * @param details Additional details about the violation
   */
  logSecurityViolation(
    type: string,
    userId?: string,
    ipAddress?: string,
    details?: Record<string, unknown>,
  ): void {
    const userStr = userId ? `User: ${userId} | ` : '';
    const ipStr = ipAddress ? `IP: ${ipAddress} | ` : '';

    this.warn(`Security Violation: ${type} | ${userStr}${ipStr}`, details || {});
  }
}
