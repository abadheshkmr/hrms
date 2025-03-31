import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  TenantContextService,
  TenantContextExpiredException,
  SerializedTenantContext,
} from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;
  const TEST_TENANT_ID = 'test-tenant-123';

  // Mock Logger to prevent console output during tests
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

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

  it('should properly implement clearCurrentTenant', () => {
    // Arrange - set a tenant ID
    service.runWithTenantId(TEST_TENANT_ID, () => {
      // Act - clear it explicitly
      service.clearCurrentTenant();
      // Assert - should be cleared within this context
      expect(service.getCurrentTenantId()).toBeNull();
      return true;
    });
  });

  it('should handle context with metadata', () => {
    // Arrange - metadata to include
    const metadata = { userId: 'user-123', permissions: ['read', 'write'] };

    // Act
    const result = service.runWithTenantId(
      TEST_TENANT_ID,
      () => {
        // Get metadata inside context
        const userId = service.getContextMetadata<string>('userId');
        const permissions = service.getContextMetadata<string[]>('permissions');
        return { userId, permissions };
      },
      metadata,
    );

    // Assert
    expect(result.userId).toBe('user-123');
    expect(result.permissions).toEqual(['read', 'write']);
  });

  it('should serialize and restore context', () => {
    // Arrange - set a tenant ID with metadata
    const metadata: Record<string, unknown> = { userId: 'user-123' };
    let serialized: SerializedTenantContext | null = null;

    // First serialize the context
    service.runWithTenantId(
      TEST_TENANT_ID,
      () => {
        serialized = service.serializeCurrentContext();
        return true;
      },
      metadata,
    );

    // Act - restore the serialized context
    if (serialized) {
      const result = service.restoreContext(serialized, () => {
        return service.getCurrentTenantId();
      });

      // Assert
      expect(result).toBe(TEST_TENANT_ID);
      // Use type assertion to help TypeScript recognize the metadata property
      expect((serialized as SerializedTenantContext).metadata).toEqual(metadata);
    } else {
      fail('Failed to serialize context');
    }
  });

  it('should handle expired context', () => {
    // Arrange - create a context with an already expired date
    const pastDate = new Date();
    pastDate.setTime(pastDate.getTime() - 1000); // 1 second in the past

    // Create our own TenantContext with expired date and manually set it
    // Import the interface from the service file
    const expiredContext = {
      tenantId: TEST_TENANT_ID,
      createdAt: new Date(),
      expiresAt: pastDate, // Already expired
    };

    // Use a spy to force the storage to return our expired context
    jest.spyOn(service['storage'], 'getStore').mockReturnValue(expiredContext);

    // Assert - getting context should throw, but getCurrentTenantId shouldn't
    expect(() => service.getCurrentContext()).toThrow(TenantContextExpiredException);
    expect(service.getCurrentTenantId()).toBeNull();

    // Restore the original implementation
    jest.restoreAllMocks();
  });

  it('should wrap functions with current context', () => {
    // Arrange - create a wrapped function while inside a specific tenant context
    let wrapped: (param: string) => string;

    // First set up a tenant context
    service.runWithTenantId(TEST_TENANT_ID, () => {
      // Create wrapped function inside this tenant context
      const testFn = (param: string) => `${service.getCurrentTenantId()}-${param}`;
      wrapped = service.wrapWithCurrentContext(testFn);
    });

    // Act - call wrapped function outside of the original tenant context
    // The wrapped function should still maintain the original tenant context
    const result = wrapped!('test');

    // Assert - wrapped function should preserve the context from when it was created
    expect(result).toBe(`${TEST_TENANT_ID}-test`);
  });

  it('should maintain context with promiseAllWithContext', async () => {
    // Arrange
    const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];

    // Act
    const result = await service.runWithTenantId(TEST_TENANT_ID, async () => {
      // This should preserve tenant context across all promises
      return service.promiseAllWithContext(promises);
    });
    // Assert
    expect(result).toEqual([1, 2, 3]);
  });
});
