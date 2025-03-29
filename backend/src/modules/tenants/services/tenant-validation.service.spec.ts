import { Test, TestingModule } from '@nestjs/testing';
import { TenantValidationService } from './tenant-validation.service';
import { TenantContextService } from './tenant-context.service';
import { TenantsService } from '../tenants.service';
import {
  TenantNotFoundException,
  InactiveTenantException,
  MissingTenantContextException,
} from '../exceptions/tenant-exceptions';

describe('TenantValidationService', () => {
  let service: TenantValidationService;
  let tenantsService: { findById: jest.Mock };
  let tenantContextService: { getCurrentTenantId: jest.Mock };

  const mockTenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    isActive: true,
  };

  const TEST_TENANT_ID = 'test-tenant-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantValidationService,
        {
          provide: TenantsService,
          useFactory: () => ({
            findById: jest.fn().mockImplementation(() => Promise.resolve(mockTenant)),
          }),
        },
        {
          provide: TenantContextService,
          useFactory: () => ({
            getCurrentTenantId: jest.fn().mockReturnValue(TEST_TENANT_ID),
          }),
        },
      ],
    }).compile();

    service = module.get<TenantValidationService>(TenantValidationService);
    tenantsService = module.get(TenantsService);
    tenantContextService = module.get(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateTenantExists', () => {
    it('should not throw when tenant exists', async (): Promise<void> => {
      // Arrange
      tenantsService.findById.mockResolvedValue(mockTenant);

      // Act & Assert
      await expect(service.validateTenantExists(TEST_TENANT_ID)).resolves.not.toThrow();
    });

    it('should throw TenantNotFoundException when tenant does not exist', async (): Promise<void> => {
      // Arrange
      tenantsService.findById.mockRejectedValue(new Error('Tenant not found'));

      // Act & Assert
      await expect(service.validateTenantExists('non-existent')).rejects.toThrow(
        TenantNotFoundException,
      );
    });

    it('should throw MissingTenantContextException when tenantId is null', async (): Promise<void> => {
      // Arrange
      tenantContextService.getCurrentTenantId.mockReturnValue(null);

      // Act & Assert
      await expect(service.validateTenantExists('' as unknown as string)).rejects.toThrow(
        MissingTenantContextException,
      );
      expect(tenantsService.findById).not.toHaveBeenCalled();
    });
  });

  describe('validateTenantActive', () => {
    it('should return true when tenant exists and is active', async (): Promise<void> => {
      // Arrange
      tenantsService.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.validateTenantActive(TEST_TENANT_ID);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw InactiveTenantException when tenant is not active', async (): Promise<void> => {
      // Arrange
      const inactiveTenant = { ...mockTenant, isActive: false };
      tenantsService.findById.mockResolvedValue(inactiveTenant);

      // Act & Assert
      await expect(service.validateTenantActive(TEST_TENANT_ID)).rejects.toThrow(
        InactiveTenantException,
      );
    });

    it('should throw TenantNotFoundException when tenant does not exist', async (): Promise<void> => {
      // Arrange
      tenantsService.findById.mockRejectedValue(new Error('Tenant not found'));

      // Act & Assert
      await expect(service.validateTenantActive('non-existent')).rejects.toThrow(
        TenantNotFoundException,
      );
    });

    it('should throw MissingTenantContextException when tenantId is not provided and context is empty', async (): Promise<void> => {
      // Arrange
      tenantContextService.getCurrentTenantId.mockReturnValue(null);

      // Act & Assert
      await expect(service.validateTenantActive()).rejects.toThrow(MissingTenantContextException);
    });
  });

  describe('validateTenantAccess', () => {
    it('should return true when user has access to tenant', async (): Promise<void> => {
      // Arrange
      tenantsService.findById.mockResolvedValue(mockTenant);

      // Act
      const result = await service.validateTenantAccess(TEST_TENANT_ID, 'user-id');

      // Assert
      expect(result).toBe(true);
    });

    it('should throw TenantNotFoundException when tenant does not exist', async (): Promise<void> => {
      // Arrange
      tenantsService.findById.mockRejectedValue(new Error('Tenant not found'));

      // Act & Assert
      await expect(service.validateTenantAccess('non-existent', 'user-id')).rejects.toThrow(
        TenantNotFoundException,
      );
    });
  });
});
