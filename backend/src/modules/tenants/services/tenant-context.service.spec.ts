import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;
  const TEST_TENANT_ID = 'test-tenant-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    service = module.get<TenantContextService>(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null when no tenant context is set', () => {
    // Act
    const result = service.getCurrentTenantId();

    // Assert
    expect(result).toBeNull();
  });

  it('should maintain tenant context within runWithTenantId callback', () => {
    // Act
    const result = service.runWithTenantId(TEST_TENANT_ID, () => {
      // Check tenant ID inside the callback
      const tenantId = service.getCurrentTenantId();
      return tenantId;
    });

    // Assert
    expect(result).toBe(TEST_TENANT_ID);
  });

  it('should not persist tenant context after runWithTenantId completes', () => {
    // Arrange
    service.runWithTenantId(TEST_TENANT_ID, () => {
      // This is just to set the context
      return true;
    });

    // Act
    const result = service.getCurrentTenantId();

    // Assert - context should be cleared after callback completes
    expect(result).toBeNull();
  });

  it('should maintain tenant context across async operations', async () => {
    // Act
    const result = await service.runWithTenantId(TEST_TENANT_ID, async () => {
      // Simulate an async operation
      await new Promise((resolve) => setTimeout(resolve, 10));
      return service.getCurrentTenantId();
    });

    // Assert
    expect(result).toBe(TEST_TENANT_ID);
  });

  it('should support nested tenant contexts with proper isolation', () => {
    // Arrange
    const OUTER_TENANT = 'outer-tenant';
    const INNER_TENANT = 'inner-tenant';

    // Act
    const result = service.runWithTenantId(OUTER_TENANT, () => {
      // Outer context should be OUTER_TENANT
      const outerTenantId = service.getCurrentTenantId();

      // Run an inner context
      const innerResult = service.runWithTenantId(INNER_TENANT, () => {
        // Inner context should be INNER_TENANT
        return service.getCurrentTenantId();
      });

      // After inner context, should revert to outer context
      const afterInnerTenantId = service.getCurrentTenantId();

      return {
        outerTenantId,
        innerResult,
        afterInnerTenantId,
      };
    });

    // Assert
    expect(result.outerTenantId).toBe(OUTER_TENANT);
    expect(result.innerResult).toBe(INNER_TENANT);
    expect(result.afterInnerTenantId).toBe(OUTER_TENANT);
  });

  it('should handle null tenant ID in runWithTenantId', () => {
    // Arrange - first set a tenant ID
    const result = service.runWithTenantId(TEST_TENANT_ID, () => {
      // Then clear it with null
      return service.runWithTenantId(null, () => {
        return service.getCurrentTenantId();
      });
    });

    // Assert
    expect(result).toBeNull();
  });
});
