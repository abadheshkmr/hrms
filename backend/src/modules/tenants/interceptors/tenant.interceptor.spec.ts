import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantContextService } from '../services/tenant-context.service';
import { Reflector } from '@nestjs/core';
// import { TENANT_OPTIONAL } from '../guards/tenant-auth.guard';
import { MissingTenantContextException } from '../exceptions/tenant-exceptions';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let reflector: jest.Mocked<Reflector>;

  const TEST_TENANT_ID = 'test-tenant-id';
  
  const mockExecutionContext = (): Record<string, unknown> => {
    const mockResponse = {
      setHeader: jest.fn(),
    };
    
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;
  };

  const mockCallHandler = (responseData?: unknown) => {
    return {
      handle: jest.fn(() => {
        return responseData ? of(responseData) : of({});
      }),
    } as CallHandler;
  };

  const mockErrorCallHandler = (error: Error) => {
    return {
      handle: jest.fn(() => throwError(() => error)),
    } as CallHandler;
  };

  beforeEach(async () => {
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
      interceptor.intercept(context, handler).subscribe({
        next: () => {
          // Assert
          const response = context.switchToHttp().getResponse();
          expect(response.setHeader).toHaveBeenCalledWith(
            'X-Tenant-ID',
            TEST_TENANT_ID
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should not add tenant ID to response headers when tenant context is not available', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const handler = mockCallHandler();
      tenantContextService.getCurrentTenantId.mockReturnValue(null);
      reflector.get.mockReturnValue(true); // TenantOptional = true
      
      // Act
      interceptor.intercept(context, handler).subscribe({
        next: () => {
          // Assert
          const response = context.switchToHttp().getResponse();
          expect(response.setHeader).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should throw MissingTenantContextException when tenant is required but not available', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const handler = mockCallHandler();
      tenantContextService.getCurrentTenantId.mockReturnValue(null);
      reflector.get.mockReturnValue(false); // TenantOptional = false
      
      // Act
      interceptor.intercept(context, handler).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (error) => {
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
      interceptor.intercept(context, handler).subscribe({
        next: (result) => {
          // Assert
          // Check if _tenantInfo property was added
          // We can't directly access it since it's non-enumerable
          expect(Object.getOwnPropertyDescriptor(result, '_tenantInfo')).toBeDefined();
          expect(Object.getOwnPropertyDescriptor(result, '_tenantInfo')?.value).toEqual({
            tenantId: TEST_TENANT_ID,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should add tenant info to error responses', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const error = new Error('Test error');
      (error as any).response = {}; // Add response property to simulate HTTP exception
      (error as any).status = HttpStatus.BAD_REQUEST;
      const handler = mockErrorCallHandler(error);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);
      
      // Act
      interceptor.intercept(context, handler).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (caughtError) => {
          // Assert
          expect((caughtError as any).response.tenantId).toBe(TEST_TENANT_ID);
          done();
        },
      });
    });

    it('should log non-404 errors', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const error = new Error('Test error');
      (error as any).status = HttpStatus.BAD_REQUEST;
      (error as any).message = 'Test error message';
      const handler = mockErrorCallHandler(error);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation((): void => {});
      
      // Act
      interceptor.intercept(context, handler).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: () => {
          // Assert
          expect(console.error).toHaveBeenCalledWith(
            `Tenant error [${TEST_TENANT_ID}]:`, 'Test error message'
          );
          done();
        },
      });
    });

    it('should not log 404 errors', (done): void => {
      // Arrange
      const context = mockExecutionContext();
      const error = new Error('Not Found');
      (error as any).status = HttpStatus.NOT_FOUND;
      const handler = mockErrorCallHandler(error);
      tenantContextService.getCurrentTenantId.mockReturnValue(TEST_TENANT_ID);
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation((): void => {});
      
      // Act
      interceptor.intercept(context, handler).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: () => {
          // Assert
          expect(console.error).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
