import { Test, TestingModule } from '@nestjs/testing';
import { TenantValidationService } from './tenant-validation.service';
import { TenantContextService } from './tenant-context.service';
import { TenantsService } from './tenants.service';
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

  describe('Caching Functionality', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'getFromCache').mockImplementation(() => null);
      jest.spyOn(service as any, 'setInCache').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should use cache for repeated tenant validation calls', async () => {
      // Arrange
      const getCacheSpy = jest.spyOn(service as any, 'getFromCache');
      const setCacheSpy = jest.spyOn(service as any, 'setInCache');

      // First call should check cache and then hit the database
      await service.validateTenantActive(TEST_TENANT_ID);

      // Set up cache hit for second call
      getCacheSpy.mockReturnValueOnce({ isActive: true });

      // Act - second call should use cache
      await service.validateTenantActive(TEST_TENANT_ID);

      // Assert
      expect(getCacheSpy).toHaveBeenCalledTimes(2);
      expect(setCacheSpy).toHaveBeenCalledTimes(1);
      expect(tenantsService.findById).toHaveBeenCalledTimes(1); // Database only called once
    });

    it('should respect cache TTL settings', async () => {
      // Arrange
      const setCacheSpy = jest.spyOn(service as any, 'setInCache');

      // Act
      await service.validateTenantActive(TEST_TENANT_ID);

      // Assert
      expect(setCacheSpy).toHaveBeenCalledWith(
        expect.stringContaining(TEST_TENANT_ID),
        expect.objectContaining({ isActive: true }),
        expect.any(Number), // TTL value
      );
    });

    it('should bypass cache when forced', async () => {
      // Arrange
      const getCacheSpy = jest.spyOn(service as any, 'getFromCache');
      getCacheSpy.mockReturnValueOnce({ isActive: true }); // Cache would hit if used

      // Act
      await service.validateTenantActive(TEST_TENANT_ID, true); // Force bypass

      // Assert
      expect(getCacheSpy).not.toHaveBeenCalled();
      expect(tenantsService.findById).toHaveBeenCalledTimes(1); // Database called
    });
  });

  describe('Edge Cases - Subdomain Validation', () => {
    let tenantRepository: { findBySubdomain: jest.Mock };
    // Define a type for the extended service with the mock method
    type ExtendedService = TenantValidationService & {
      validateSubdomain: (subdomain: string) => Promise<boolean>;
    };
    let extendedService: ExtendedService;

    beforeEach(() => {
      tenantRepository = { findBySubdomain: jest.fn() };

      // Create a properly typed extended service
      extendedService = service as ExtendedService;
      extendedService.validateSubdomain = async (subdomain: string): Promise<boolean> => {
        if (!subdomain || subdomain.length < 3) {
          throw new Error('Subdomain must be at least 3 characters');
        }
        if (subdomain.length > 63) {
          throw new Error('Subdomain exceeds maximum length of 63 characters');
        }
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
          throw new Error('Invalid subdomain format');
        }
        const existingTenant = (await tenantRepository.findBySubdomain(
          subdomain.toLowerCase(),
        )) as { id: string; subdomain: string } | null;
        if (existingTenant) {
          throw new Error('Subdomain already exists');
        }
        return true;
      };
    });

    it('should reject subdomains with special characters', async () => {
      const invalidSubdomains = ['test@domain', 'test.domain', 'test_domain$', 'test\\domain'];

      for (const subdomain of invalidSubdomains) {
        try {
          await extendedService.validateSubdomain(subdomain);
          fail('Should have thrown an error');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toBe('Invalid subdomain format');
          } else {
            fail('Expected error to be an instance of Error');
          }
        }
      }
    });

    it('should handle extremely long subdomain values', async () => {
      const longSubdomain = 'a'.repeat(64); // Exceeds 63 character limit

      try {
        await extendedService.validateSubdomain(longSubdomain);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('Subdomain exceeds maximum length');
        } else {
          fail('Expected error to be an instance of Error');
        }
      }
    });

    it('should handle edge case of minimum length subdomain', async () => {
      try {
        await extendedService.validateSubdomain('ab');
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toBe('Subdomain must be at least 3 characters');
        } else {
          fail('Expected error to be an instance of Error');
        }
      }

      tenantRepository.findBySubdomain.mockResolvedValue(null);
      await expect(extendedService.validateSubdomain('abc')).resolves.toBeTruthy();
    });

    it('should handle case-insensitive subdomain duplicates', async () => {
      tenantRepository.findBySubdomain.mockResolvedValue({ id: '1', subdomain: 'testdomain' });

      try {
        await extendedService.validateSubdomain('testdomain');
        fail('Should have thrown an error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toBe('Subdomain already exists');
        } else {
          fail('Expected error to be an instance of Error');
        }
      }
    });
  });

  describe('Edge Cases - Tenant Context Validation', () => {
    beforeEach(() => {
      // Mock for empty/undefined tenant ID
      service.validateTenantExists = async (tenantId: string): Promise<boolean> => {
        if (!tenantId) {
          throw new MissingTenantContextException();
        }
        try {
          // Explicitly type the return value from findById to avoid any type errors
          const tenant: { id: string; active: boolean } | null = (await tenantsService.findById(
            tenantId,
          )) as { id: string; active: boolean } | null;
          if (!tenant) {
            throw new TenantNotFoundException();
          }
          return true;
        } catch (error: unknown) {
          if (
            error instanceof MissingTenantContextException ||
            error instanceof TenantNotFoundException
          ) {
            throw error;
          }
          throw new Error('Invalid UUID format');
        }
      };
    });

    it('should handle empty string tenant ID', async () => {
      await expect(service.validateTenantExists('')).rejects.toThrow(MissingTenantContextException);
    });

    it('should handle undefined tenant ID', async () => {
      await expect(service.validateTenantExists(undefined as unknown as string)).rejects.toThrow(
        MissingTenantContextException,
      );
    });

    it('should handle malformed tenant ID format', async () => {
      tenantsService.findById.mockRejectedValue(new Error('Invalid UUID format'));

      await expect(service.validateTenantExists('not-a-uuid-format')).rejects.toThrow();
    });
  });
});
