import { Test } from '@nestjs/testing';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { TenantAwareRepository, TenantRequiredException } from './tenant-aware.repository';
import { TenantContextService } from '../services/tenant-context.service';
import { TenantBaseEntity } from '../entities/tenant-base.entity';
import { NotFoundException } from '@nestjs/common';

// Sample tenant entity class for testing
class TestTenantEntity extends TenantBaseEntity {
  name: string;
}

describe('TenantAwareRepository', () => {
  let tenantAwareRepository: TenantAwareRepository<TestTenantEntity>;
  let tenantContextService: TenantContextService;
  let mockEntityManager: EntityManager;
  let mockRepository: Partial<Repository<TestTenantEntity>> & {
    createQueryBuilder?: jest.Mock;
    find?: jest.Mock;
    findOne?: jest.Mock;
    create?: jest.Mock;
    save?: jest.Mock;
    count?: jest.Mock;
    remove?: jest.Mock;
  };
  let mockQueryBuilder: Partial<SelectQueryBuilder<TestTenantEntity>> & {
    leftJoinAndSelect?: jest.Mock;
    where?: jest.Mock;
    andWhere?: jest.Mock;
    orderBy?: jest.Mock;
    getMany?: jest.Mock;
    getOne?: jest.Mock;
    getManyAndCount?: jest.Mock;
  };

  const TEST_TENANT_ID = 'test-tenant-id';

  beforeEach(async () => {
    // Create mock repository methods
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // Create mock query builder
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };

    // Set up mock entity manager
    mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      transaction: jest.fn(),
    } as unknown as EntityManager;

    // Create module for testing with TenantContextService
    const module = await Test.createTestingModule({
      providers: [
        TenantContextService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    // Get the tenant context service - use resolve() for scoped providers
    tenantContextService = await module.resolve<TenantContextService>(TenantContextService);

    // Set the tenant ID
    tenantContextService.setTenantId(TEST_TENANT_ID);

    // Create repository instance with mocked dependencies
    tenantAwareRepository = new TenantAwareRepository<TestTenantEntity>(
      mockEntityManager,
      TestTenantEntity,
      tenantContextService,
    );

    // Mock implementation of createQueryBuilder
    mockRepository.createQueryBuilder!.mockReturnValue(mockQueryBuilder);
  });

  describe('getCurrentTenantId', () => {
    it('should return the current tenant ID', () => {
      // Act
      const result = (
        tenantAwareRepository as unknown as { getCurrentTenantId(): string }
      ).getCurrentTenantId();

      // Assert
      expect(result).toBe(TEST_TENANT_ID);
    });

    it('should throw TenantRequiredException if tenant ID is not set', () => {
      // Arrange
      tenantContextService.clearTenantId();

      // Act & Assert
      expect(() =>
        (tenantAwareRepository as unknown as { getCurrentTenantId(): string }).getCurrentTenantId(),
      ).toThrow(TenantRequiredException);
    });
  });

  describe('applyTenantFilter', () => {
    it('should add tenantId to where clause when no where exists', () => {
      // Arrange
      const options = { take: 10 };

      // Act
      const result = (
        tenantAwareRepository as unknown as {
          applyTenantFilter(options: any): {
            where: { name: string; tenantId: string };
            take: number;
          };
        }
      ).applyTenantFilter(options);

      // Assert
      expect(result).toEqual({
        take: 10,
        where: { tenantId: TEST_TENANT_ID },
      });
    });

    it('should add tenantId to existing where object', () => {
      // Arrange
      const options = {
        where: { name: 'Test' },
        take: 10,
      };

      // Act
      const result = (
        tenantAwareRepository as unknown as {
          applyTenantFilter(options: any): {
            where: { name: string; tenantId: string };
            take: number;
          };
        }
      ).applyTenantFilter(options);

      // Assert
      expect(result).toEqual({
        where: { name: 'Test', tenantId: TEST_TENANT_ID },
        take: 10,
      });
    });

    it('should not modify the original options object', () => {
      // Arrange
      const options = {
        where: { name: 'Test' },
        take: 10,
      };
      const originalOptions = { ...options };

      // Act
      (
        tenantAwareRepository as unknown as {
          applyTenantFilter(options: any): any;
        }
      ).applyTenantFilter(options);

      // Assert
      expect(options).toEqual(originalOptions);
    });
  });

  describe('find', () => {
    it('should apply tenant filter to find options', async () => {
      // Arrange
      const mockOptions = { where: { name: 'Test' } };
      const mockResult = [
        { id: '1', name: 'Test', tenantId: TEST_TENANT_ID },
      ] as TestTenantEntity[];
      mockRepository.find!.mockResolvedValue(mockResult);

      // Act
      const result = await tenantAwareRepository.find(mockOptions);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { name: 'Test', tenantId: TEST_TENANT_ID },
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw when tenant context is missing', async () => {
      // Arrange
      tenantContextService.clearTenantId();

      // Act & Assert
      await expect(tenantAwareRepository.find()).rejects.toThrow(TenantRequiredException);
    });
  });

  describe('findOne', () => {
    it('should apply tenant filter to findOne options', async () => {
      // Arrange
      const mockOptions = { where: { id: '1' } };
      const mockResult = { id: '1', name: 'Test', tenantId: TEST_TENANT_ID } as TestTenantEntity;
      mockRepository.findOne!.mockResolvedValue(mockResult);

      // Act
      const result = await tenantAwareRepository.findOne(mockOptions);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', tenantId: TEST_TENANT_ID },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findById', () => {
    it('should include tenant ID in where clause', async () => {
      // Arrange
      const id = '1';
      const mockResult = { id: '1', name: 'Test', tenantId: TEST_TENANT_ID } as TestTenantEntity;
      mockRepository.findOne!.mockResolvedValue(mockResult);

      // Act
      const result = await tenantAwareRepository.findById(id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, tenantId: TEST_TENANT_ID },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('should automatically set tenantId on new entity', async () => {
      // Arrange
      const createData = { name: 'New Entity' };
      const createdEntityWithTenant = {
        ...createData,
        tenantId: TEST_TENANT_ID,
      } as TestTenantEntity;

      const savedEntity = {
        id: '1',
        ...createData,
        tenantId: TEST_TENANT_ID,
      } as TestTenantEntity;

      mockRepository.create!.mockReturnValue(createdEntityWithTenant);
      mockRepository.save!.mockResolvedValue(savedEntity);

      // Act
      const result = await tenantAwareRepository.create(createData);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createData,
        tenantId: TEST_TENANT_ID,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdEntityWithTenant);
      expect(result).toEqual(savedEntity);
    });
  });

  describe('update', () => {
    it('should verify entity belongs to current tenant before updating', async () => {
      // Arrange
      const id = '1';
      const updateData = { name: 'Updated Entity' };
      const existingEntity = {
        id,
        name: 'Original Entity',
        tenantId: TEST_TENANT_ID,
      } as TestTenantEntity;

      const updatedEntity = {
        id,
        ...updateData,
        tenantId: TEST_TENANT_ID,
      } as TestTenantEntity;

      jest
        .spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository)
        .mockImplementation(() => Promise.resolve(existingEntity));
      mockRepository.save!.mockResolvedValue(updatedEntity);

      // Act
      const result = await tenantAwareRepository.update(id, updateData);

      // Assert
      // Use type-safe method call verification
      expect(
        jest.spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository),
      ).toHaveBeenCalledWith(id);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingEntity,
        ...updateData,
      });
      expect(result).toEqual(updatedEntity);
    });

    it('should throw NotFoundException if entity not found for current tenant', async () => {
      // Arrange
      const id = 'non-existent-id';
      jest
        .spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository)
        .mockImplementation(() => Promise.resolve(null));

      // Act & Assert
      await expect(tenantAwareRepository.update(id, { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
      // Use type-safe method call verification
      expect(
        jest.spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository),
      ).toHaveBeenCalledWith(id);
    });
  });

  describe('remove', () => {
    it('should verify entity belongs to current tenant before removing', async () => {
      // Arrange
      const id = '1';
      const existingEntity = {
        id,
        name: 'Entity to Delete',
        tenantId: TEST_TENANT_ID,
        isDeleted: false,
      } as TestTenantEntity;

      const deletedEntity = {
        ...existingEntity,
        isDeleted: true,
      } as TestTenantEntity;

      jest
        .spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository)
        .mockImplementation(() => Promise.resolve(existingEntity));
      mockRepository.save!.mockResolvedValue(deletedEntity);

      // Act
      const result = await tenantAwareRepository.remove(id);

      // Assert
      // Use type-safe method call verification
      expect(
        jest.spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository),
      ).toHaveBeenCalledWith(id);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingEntity,
        isDeleted: true,
      });
      expect(result).toEqual(deletedEntity);
    });

    it('should throw NotFoundException if entity not found for current tenant', async () => {
      // Arrange
      const id = 'non-existent-id';
      jest
        .spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository)
        .mockImplementation(() => Promise.resolve(null));

      // Act & Assert
      await expect(tenantAwareRepository.remove(id)).rejects.toThrow(NotFoundException);
      // Use type-safe method call verification
      expect(
        jest.spyOn(tenantAwareRepository, 'findById' as keyof typeof tenantAwareRepository),
      ).toHaveBeenCalledWith(id);
    });
  });

  describe('count', () => {
    it('should apply tenant filter to count options', async () => {
      // Arrange
      const mockOptions = { where: { name: 'Test' } };
      mockRepository.count!.mockResolvedValue(5);

      // Act
      const result = await tenantAwareRepository.count(mockOptions);

      // Assert
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { name: 'Test', tenantId: TEST_TENANT_ID },
      });
      expect(result).toBe(5);
    });
  });

  describe('createQueryBuilder', () => {
    it('should add tenant filter to query builder', () => {
      // Arrange
      const alias = 'testEntity';

      // Act
      tenantAwareRepository.createQueryBuilder(alias);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(alias);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(`${alias}.tenantId = :tenantId`, {
        tenantId: TEST_TENANT_ID,
      });
    });
  });
});
