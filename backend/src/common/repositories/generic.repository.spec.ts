/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { GenericRepository } from './generic.repository';
import { BaseEntity } from '../entities/base.entity';

// Sample entity class for testing
class TestEntity extends BaseEntity {
  name: string;
}

describe('GenericRepository', () => {
  let genericRepository: GenericRepository<TestEntity>;
  let mockEntityManager: EntityManager;
  let mockRepository: jest.Mocked<Repository<TestEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<TestEntity>>;

  beforeEach(async () => {
    // Create mock repository methods with proper typing
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<TestEntity>>;

    // Create mock query builder with proper typing
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<TestEntity>>;

    // Set up mock entity manager
    mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      transaction: jest.fn(),
    } as unknown as EntityManager;

    // Need to cast transaction to a jest.Mock to use mockImplementation
    (mockEntityManager.transaction as jest.Mock).mockImplementation(
      async <T>(cb: (entityManager: EntityManager) => Promise<T>): Promise<T> => {
        return cb(mockEntityManager);
      },
    );

    // Create module for testing
    await Test.createTestingModule({
      providers: [
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    // Create repository instance with mocked dependencies
    genericRepository = new GenericRepository<TestEntity>(mockEntityManager, TestEntity);

    // Mock implementation of createQueryBuilder
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('find', () => {
    it('should call repository.find with the provided options', async () => {
      // Arrange
      const mockOptions = { where: { name: 'Test' } };
      const mockResult = [{ id: '1', name: 'Test' }] as TestEntity[];
      mockRepository.find.mockResolvedValue(mockResult);

      // Act
      const result = await genericRepository.find(mockOptions);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith(mockOptions);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call repository.findOne with the provided options', async () => {
      // Arrange
      const mockOptions = { where: { id: '1' } };
      const mockResult = { id: '1', name: 'Test' } as TestEntity;
      mockRepository.findOne.mockResolvedValue(mockResult);

      // Act
      const result = await genericRepository.findOne(mockOptions);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith(mockOptions);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findById', () => {
    it('should call repository.findOne with the id in where clause', async () => {
      // Arrange
      const id = '1';
      const mockResult = { id: '1', name: 'Test' } as TestEntity;
      mockRepository.findOne.mockResolvedValue(mockResult);

      // Act
      const result = await genericRepository.findById(id);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('should create and save the entity', async () => {
      // Arrange
      const createData = { name: 'New Entity' };
      const createdEntity = { ...createData } as TestEntity;
      const savedEntity = { id: '1', ...createData } as TestEntity;

      mockRepository.create.mockReturnValue(createdEntity);
      mockRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await genericRepository.create(createData);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(savedEntity);
    });
  });

  describe('update', () => {
    it('should find, update, and save the entity', async () => {
      // Arrange
      const id = '1';
      const updateData = { name: 'Updated Entity' };
      const existingEntity = { id, name: 'Original Entity' } as TestEntity;
      const updatedEntity = { id, ...updateData } as TestEntity;

      jest.spyOn(genericRepository, 'findById').mockResolvedValue(existingEntity);
      mockRepository.save.mockResolvedValue(updatedEntity);

      // Act
      const result = await genericRepository.update(id, updateData);

      // Assert
      expect(genericRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.save).toHaveBeenCalledWith({ ...existingEntity, ...updateData });
      expect(result).toEqual(updatedEntity);
    });

    it('should throw error if entity not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      jest.spyOn(genericRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(genericRepository.update(id, { name: 'Updated' })).rejects.toThrow(
        `Entity with ID ${id} not found`,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete the entity if isDeleted field exists', async () => {
      // Arrange
      const id = '1';
      const existingEntity = {
        id,
        name: 'Entity to Delete',
        isDeleted: false,
      } as TestEntity;

      const deletedEntity = {
        ...existingEntity,
        isDeleted: true,
      } as TestEntity;

      jest.spyOn(genericRepository, 'findById').mockResolvedValue(existingEntity);
      mockRepository.save.mockResolvedValue(deletedEntity);

      // Act
      const result = await genericRepository.remove(id);

      // Assert
      expect(genericRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.save).toHaveBeenCalledWith({ ...existingEntity, isDeleted: true });
      expect(result).toEqual(deletedEntity);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should hard delete the entity if isDeleted field does not exist', async () => {
      // Arrange
      const id = '1';
      const existingEntity = {
        id,
        name: 'Entity to Delete',
      } as unknown as TestEntity;

      // Create a properly typed object without the isDeleted property
      const { ...entityWithoutIsDeleted } = existingEntity as TestEntity & {
        isDeleted?: boolean;
      };
      const cleanEntity = entityWithoutIsDeleted as TestEntity;

      jest.spyOn(genericRepository, 'findById').mockResolvedValue(cleanEntity);
      mockRepository.remove.mockResolvedValue(cleanEntity);

      // Act
      const result = await genericRepository.remove(id);

      // Assert
      expect(genericRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.remove).toHaveBeenCalledWith(cleanEntity);
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(cleanEntity);
    });

    it('should throw error if entity not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      jest.spyOn(genericRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(genericRepository.remove(id)).rejects.toThrow(`Entity with ID ${id} not found`);
    });
  });

  describe('count', () => {
    it('should call repository.count with the provided options', async () => {
      // Arrange
      const mockOptions = { where: { name: 'Test' } };
      mockRepository.count.mockResolvedValue(5);

      // Act
      const result = await genericRepository.count(mockOptions);

      // Assert
      expect(mockRepository.count).toHaveBeenCalledWith(mockOptions);
      expect(result).toBe(5);
    });
  });

  describe('createQueryBuilder', () => {
    it('should call repository.createQueryBuilder with the provided alias', () => {
      // Arrange
      const alias = 'testEntity';

      // Act
      genericRepository.createQueryBuilder(alias);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(alias);
    });
  });

  describe('executeTransaction', () => {
    it('should execute callback within transaction', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue('result');
      // Transaction is already mocked in the beforeEach block

      // Act
      const result = await genericRepository.executeTransaction(mockCallback);

      // Assert
      expect(mockEntityManager.transaction).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockEntityManager);
      expect(result).toBe('result');
    });
  });
});
