/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantContextService } from '../services/tenant-context.service';
import { Reflector } from '@nestjs/core';
import { MissingTenantContextException } from '../exceptions/tenant-exceptions';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let reflector: jest.Mocked<Reflector>;

  const TEST_TENANT_ID = 'test-tenant-id';

  interface MockResponse {
    setHeader: jest.Mock;
  }

  interface HttpContext {
    getRequest(): Record<string, unknown>;
    getResponse(): MockResponse;
  }

  interface HttpError extends Error {
    response: { tenantId?: string };
    status: HttpStatus;
  }

  // Factory function for mocking ExecutionContext for tests
  const mockExecutionContext = (): ExecutionContext => {
    const mockResponse: MockResponse = {
      setHeader: jest.fn(),
    };

    const mockExecutionContext: ExecutionContext = {
      switchToHttp: jest.fn().mockImplementation(
        (): HttpContext => ({
          getRequest: jest.fn().mockReturnValue({}),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      ),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(null),
      switchToRpc: jest.fn().mockReturnValue({}),
      switchToWs: jest.fn().mockReturnValue({}),
    };

    return mockExecutionContext;
  };

  const mockCallHandler = (responseData?: unknown): CallHandler => {
    return {
      // Use a type assertion for the entire Jest mock function to avoid 'any' returns
      handle: jest.fn().mockImplementation((): Observable<Record<string, unknown>> => {
        // Use type assertions to ensure return type safety
        return responseData
          ? of(responseData as Record<string, unknown>)
          : of({} as Record<string, unknown>);
      }) as jest.Mock<Observable<Record<string, unknown>>, []>,
    };
  };

  const mockErrorCallHandler = (error: HttpError): CallHandler => {
    return {
      // Use a type assertion for the entire Jest mock function to avoid 'any' returns
      handle: jest.fn().mockImplementation((): Observable<never> => {
        return throwError((): HttpError => error);
      }) as jest.Mock<Observable<never>, []>,
    };
  };

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantInterceptor,
        {
          provide: TenantContextService,
          useFactory: () => ({
            getCurrentTenantId: jest.fn(),
          }),
        },
        {
          provide: Reflector,
          useFactory: () => ({
            get: jest.fn(),
          }),
        },
      ],
    }).compile();

    interceptor = module.get<TenantInterceptor>(TenantInterceptor);
    tenantContextService = module.get(TenantContextService);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should add tenant ID to response headers when tenant context is available', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const handler = mockCallHandler();
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (): void => {
          // Assert
          const http = context.switchToHttp() as unknown as HttpContext;
          const response = http.getResponse();
          expect(response.setHeader).toHaveBeenCalledWith('X-Tenant-ID', TEST_TENANT_ID);
          done();
        },
        error: (err: Error): void => done.fail(err.message),
      });
    });

    it('should not add tenant ID to response headers when tenant context is not available', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const handler = mockCallHandler();
      tenantContextService.getCurrentTenantId.mockReturnValue(null);
      reflector.get.mockReturnValue(true); // TenantOptional = true

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (): void => {
          // Assert
          // Use type casting with unknown intermediate to ensure type safety
          const http = context.switchToHttp() as unknown as HttpContext;
          const response = http.getResponse();
          expect(response.setHeader).not.toHaveBeenCalled();
          done();
        },
        error: (err: Error): void => done.fail(err.message),
      });
    });

    it('should throw MissingTenantContextException when tenant is required but not available', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const handler = mockCallHandler();
      tenantContextService.getCurrentTenantId.mockReturnValue(null);
      reflector.get.mockReturnValue(false); // TenantOptional = false

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (): void => done.fail('Should have thrown an error'),
        error: (error: unknown): void => {
          // Assert
          expect(error).toBeInstanceOf(MissingTenantContextException);
          done();
        },
      });
    });

    it('should add tenant info to response objects', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const responseData = { id: 1, name: 'Test Entity' };
      const handler = mockCallHandler(responseData);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (result: Record<string, unknown>): void => {
          // Assert
          // Check if _tenantInfo property was added
          // We can't directly access it since it's non-enumerable
          expect(Object.getOwnPropertyDescriptor(result, '_tenantInfo')).toBeDefined();
          expect(Object.getOwnPropertyDescriptor(result, '_tenantInfo')?.value).toEqual({
            tenantId: TEST_TENANT_ID,
          });
          done();
        },
        error: (err: Error): void => done.fail(err.message),
      });
    });

    it('should add tenant info to error responses', (done): void => {
      // Arrange
      const context = mockExecutionContext();

      const error: HttpError = Object.assign(new Error('Test error'), {
        response: {},
        status: HttpStatus.BAD_REQUEST,
      });
      const handler = mockErrorCallHandler(error);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);

      // Prevent console.error from actually logging during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation((): void => {});

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (): void => done.fail('Should have thrown an error'),
        error: (caughtError: HttpError): void => {
          // Assert
          expect(caughtError.response.tenantId).toBe(TEST_TENANT_ID);
          // Clean up the mock
          consoleSpy.mockRestore();
          done();
        },
      });
    });

    it('should log non-404 errors', (done): void => {
      // Arrange
      const context = mockExecutionContext();

      const error: HttpError = Object.assign(new Error('Test error message'), {
        response: {},
        status: HttpStatus.BAD_REQUEST,
      });
      const handler = mockErrorCallHandler(error);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation((): void => {});

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (): void => done.fail('Should have thrown an error'),
        error: (/* err */): void => {
          // Assert
          expect(consoleSpy).toHaveBeenCalledWith(
            `Tenant error [${TEST_TENANT_ID}]:`,
            'Test error message',
          );
          consoleSpy.mockRestore();
          done();
        },
      });
    });

    it('should not log 404 errors', (done): void => {
      // Arrange
      const context = mockExecutionContext();

      // Reset any previous mocks
      jest.clearAllMocks();

      const error: HttpError = Object.assign(new Error('Not Found'), {
        response: {},
        status: HttpStatus.NOT_FOUND,
      });
      const handler = mockErrorCallHandler(error);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation((): void => {});

      // Act
      const observable = interceptor.intercept(context, handler);
      observable.subscribe({
        next: (): void => done.fail('Should have thrown an error'),
        error: (/* err */): void => {
          // Assert
          expect(consoleSpy).not.toHaveBeenCalled();
          consoleSpy.mockRestore();
          done();
        },
      });
    });
  });
});
