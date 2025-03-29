import { InternalServerErrorException } from '@nestjs/common';

/**
 * Exception thrown when there's an issue with application configuration
 * Extends NestJS's built-in InternalServerErrorException
 */
export class ConfigurationException extends InternalServerErrorException {
  /**
   * Creates a new ConfigurationException
   * @param configKey The configuration key that has an issue
   * @param details Additional details about the configuration issue
   */
  constructor(configKey: string, details: string) {
    super(`Configuration error for '${configKey}': ${details}`);
  }
}
