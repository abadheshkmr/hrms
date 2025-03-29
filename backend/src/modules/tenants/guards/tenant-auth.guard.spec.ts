import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantAuthGuard, TENANT_OPTIONAL } from './tenant-auth.guard';
import { TenantValidationService } from '../services/tenant-validation.service';

describe('TenantAuthGuard', () => {
  let guard: TenantAuthGuard;
  let tenantValidationService: { validateTenantActive: jest.Mock };

  const mockExecutionContext = () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          tenantId: 'test-tenant-id',
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    return mockContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantAuthGuard,
        {
          provide: TenantValidationService,
          useFactory: () => ({
            validateTenantActive: jest.fn().mockImplementation(() => Promise.resolve(true)),
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

    guard = module.get<TenantAuthGuard>(TenantAuthGuard);
    tenantValidationService = module.get(TenantValidationService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when tenant is active', async () => {
      // Arrange
      const context = mockExecutionContext();
      tenantValidationService.validateTenantActive.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(tenantValidationService.validateTenantActive).toHaveBeenCalledWith('test-tenant-id');
    });

    it('should deny access when tenant is not active', async (): Promise<void> => {
      // Arrange
      const context = mockExecutionContext();
      tenantValidationService.validateTenantActive.mockResolvedValue(false);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should pass through validation errors from tenant service', async (): Promise<void> => {
      // Arrange
      const context = mockExecutionContext();
      tenantValidationService.validateTenantActive.mockRejectedValue(new Error('Validation error'));

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow('Validation error');
    });
  });

  describe('TenantOptional decorator', () => {
    // Note: We can't easily test the decorator directly in a unit test since it sets metadata,
    // but we can test how the guard uses the metadata
    it('should be defined', () => {
      expect(TENANT_OPTIONAL).toBeDefined();
    });
    // In a real implementation, we would add tests for how the guard respects the TenantOptional flag
    // This would involve mocking Reflector.get to return true for TENANT_OPTIONAL
  });
});
