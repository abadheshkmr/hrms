import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { IExceptionFilter } from '../interfaces/exception-filter.interface';
import { IErrorResponse } from '../interfaces/error-response.interface';
import { LoggerService } from '../../core/logger/logger.service';

/**
 * Filter to handle HTTP exceptions
 * Formats the response according to our standard error format
 */
@Catch(HttpException)
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter, IExceptionFilter {
  private readonly logger = new LoggerService().setContext('HttpExceptionFilter');

  /**
   * Catches and handles HTTP exceptions
   * @param exception The caught exception
   * @param host The arguments host
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Get exception response
    const exceptionResponse = exception.getResponse();

    // Format the error response
    const errorResponse: IErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
      error: exception.name,
    };

    // Add validation errors if present
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const exceptionResponseObj = exceptionResponse as Record<string, unknown>;
      if ('errors' in exceptionResponseObj) {
        errorResponse.details = {
          validationErrors: exceptionResponseObj.errors,
        };
      }
    }

    // Log the exception
    this.logger.error(
      `Request ${request.method} ${request.url} failed with status ${status}: ${errorResponse.message}`,
      exception.stack,
    );

    // Send the response
    response.status(status).json(errorResponse);
  }
}
