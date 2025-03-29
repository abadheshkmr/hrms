import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './http-exception.filter';
import { FallbackExceptionFilter } from './fallback-exception.filter';

/**
 * Module to provide exception filters to the application
 * Uses the APP_FILTER token to apply filters globally
 */
@Module({
  providers: [
    // Order matters - FallbackExceptionFilter must be registered first
    // to catch exceptions not handled by more specific filters
    {
      provide: APP_FILTER,
      useClass: FallbackExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class ExceptionFiltersModule {}
