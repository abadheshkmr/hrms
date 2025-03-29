import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { IExceptionFilter } from '../interfaces/exception-filter.interface';
import { IErrorResponse } from '../interfaces/error-response.interface';
import { LoggerService } from '../../core/logger/logger.service';

/**
 * Filter to handle all exceptions not caught by more specific filters
 * This is a fallback to ensure all exceptions get properly formatted
 */
@Catch()
@Injectable()
export class FallbackExceptionFilter implements ExceptionFilter, IExceptionFilter {
  private readonly logger = new LoggerService().setContext('FallbackExceptionFilter');

  /**
   * Catches and handles all exceptions
   * @param exception The caught exception
   * @param host The arguments host
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine error details
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName = 'InternalServerError';

    // If the exception is an Error object, extract message
    if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name || errorName;
    }

    // Format the error response
    const errorResponse: IErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: errorName,
    };

    // In development, include the stack trace
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorResponse.details = { stack: exception.stack };
    }

    // Log the exception
    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send the response
    response.status(status).json(errorResponse);
  }
}
