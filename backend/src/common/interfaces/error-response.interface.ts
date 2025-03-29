/**
 * Interface for standardized error responses across the application
 */
export interface IErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}
