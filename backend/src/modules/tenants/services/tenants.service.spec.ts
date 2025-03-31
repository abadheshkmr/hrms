import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantStatus, VerificationStatus } from '../enums/tenant.enums';
import { Address } from '../../../common/entities/address.entity';
import { ContactInfo } from '../../../common/entities/contact-info.entity';
import { EventsService } from '../../../core/events/events.service';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { Tenant } from '../entities/tenant.entity';
import { AddressType } from '../../../common/enums/address.enum';
import { ContactType } from '../../../common/enums/contact.enum';
import { TenantRepository } from '../repositories/tenant.repository';

// Create a mock type for our TenantRepository
type MockTenantRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findBySubdomain: jest.Mock;
  findByIdentifier: jest.Mock;
  findByStatus: jest.Mock;
  findByVerificationStatus: jest.Mock;
  searchByName: jest.Mock;
  findWithPagination: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  setStatus: jest.Mock;
  setVerificationStatus: jest.Mock;
  softRemove: jest.Mock;
  remove: jest.Mock;
};

// Standard repository mocks for Address and ContactInfo
const createMockRepository = <T extends object>(): Partial<Repository<T>> & {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
} => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

// Create a mock for our TenantRepository
const createMockTenantRepository = (): MockTenantRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findBySubdomain: jest.fn(),
  findByIdentifier: jest.fn(),
  findByStatus: jest.fn(),
  findByVerificationStatus: jest.fn(),
  searchByName: jest.fn(),
  findWithPagination: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  setStatus: jest.fn(),
  setVerificationStatus: jest.fn(),
  softRemove: jest.fn(),
  remove: jest.fn(),
});

const mockEventsService = {
  publishTenantCreated: jest.fn(),
  publishTenantUpdated: jest.fn(),
  publishTenantDeleted: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      remove: jest.fn(),
    },
  })),
};

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: MockTenantRepository;
  let addressRepository: ReturnType<typeof createMockRepository<Address>>;
  let contactInfoRepository: ReturnType<typeof createMockRepository<ContactInfo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: TenantRepository,
          useValue: createMockTenantRepository(),
        },
        {
          provide: getRepositoryToken(Address),
          useValue: createMockRepository<Address>(),
        },
        {
          provide: getRepositoryToken(ContactInfo),
          useValue: createMockRepository<ContactInfo>(),
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    // Get service and repositories instances
    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get(TenantRepository);
    addressRepository = module.get(getRepositoryToken(Address));
    contactInfoRepository = module.get(getRepositoryToken(ContactInfo));
    // This is added to ensure we're using the Tenant import
    const tenant = new Tenant();
    expect(tenant).toBeDefined();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tenants', async () => {
      const expectedResult = {
        items: [{ id: '1', name: 'Test Tenant' }],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        hasNext: false,
        hasPrevious: false,
      };
      tenantRepository.findWithPagination.mockResolvedValue(expectedResult);

      const result = await service.findAll();
      expect(result).toEqual(expectedResult);
      expect(tenantRepository.findWithPagination).toHaveBeenCalledWith(
        {
          where: { isDeleted: false },
        },
        undefined,
      );
    });
  });

  describe('findByStatus', () => {
    it('should return tenants with the specified status', async () => {
      const expectedTenants = [{ id: '1', name: 'Test Tenant', status: TenantStatus.ACTIVE }];
      tenantRepository.findByStatus.mockResolvedValue(expectedTenants);

      const result = await service.findByStatus(TenantStatus.ACTIVE);
      expect(result).toEqual(expectedTenants);
      expect(tenantRepository.findByStatus).toHaveBeenCalledWith(TenantStatus.ACTIVE, undefined);
    });
  });

  describe('findByVerificationStatus', () => {
    it('should return tenants with the specified verification status', async () => {
      const expectedTenants = [
        { id: '1', name: 'Test Tenant', verificationStatus: VerificationStatus.VERIFIED },
      ];
      tenantRepository.findByVerificationStatus.mockResolvedValue(expectedTenants);

      const result = await service.findByVerificationStatus(VerificationStatus.VERIFIED);
      expect(result).toEqual(expectedTenants);
      expect(tenantRepository.findByVerificationStatus).toHaveBeenCalledWith(
        VerificationStatus.VERIFIED,
        undefined,
      );
    });
  });

  describe('findById', () => {
    it('should return a tenant when it exists', async () => {
      const expectedTenant = {
        id: '1',
        name: 'Test Tenant',
      };
      tenantRepository.findById.mockResolvedValue(expectedTenant);

      const result = await service.findById('1');
      expect(result).toEqual(expectedTenant);
      expect(tenantRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
      expect(tenantRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create and return a new tenant', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'New Tenant',
        subdomain: 'new-tenant',
        isActive: true,
      };
      const newTenant = {
        id: '1',
        ...createTenantDto,
        status: TenantStatus.PENDING,
        verification: {
          verificationStatus: VerificationStatus.PENDING,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock DataSource and QueryRunner behavior for create method
      // This is critical - we need to ensure the manager.save returns our newTenant
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockResolvedValue(newTenant),
          remove: jest.fn(),
        },
      };

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      tenantRepository.create.mockReturnValue(newTenant);

      const result = await service.create(createTenantDto);

      expect(result).toEqual(newTenant);
      expect(tenantRepository.create).toHaveBeenCalledWith({
        ...createTenantDto,
        status: TenantStatus.PENDING,
        verification: {
          verificationStatus: VerificationStatus.PENDING,
        },
        isActive: true,
        tenantId: null,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(newTenant);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockEventsService.publishTenantCreated).toHaveBeenCalled();
    });

    it('should rollback transaction and throw error when creation fails', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'New Tenant',
        subdomain: 'new-tenant',
        isActive: true,
      };

      const error = new Error('Database error');
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockRejectedValue(error),
          remove: jest.fn(),
        },
      };

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      // This is the key change - we need to reset the mock before testing
      // to ensure we're capturing the correct behavior
      mockEventsService.publishTenantCreated.mockReset();

      await expect(service.create(createTenantDto)).rejects.toThrow(error);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      // Since the save operation throws, the event should not be published
      expect(mockEventsService.publishTenantCreated).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return a tenant', async () => {
      const tenantId = '1';
      const updateTenantDto: UpdateTenantDto = {
        name: 'Updated Tenant',
      };
      const existingTenant = {
        id: tenantId,
        name: 'Original Tenant',
        subdomain: 'original-tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedTenant = {
        ...existingTenant,
        ...updateTenantDto,
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockResolvedValue(updatedTenant),
          remove: jest.fn(),
        },
      };

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      tenantRepository.findById.mockResolvedValue(existingTenant);

      const result = await service.update(tenantId, updateTenantDto);

      expect(result).toEqual(updatedTenant);
      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantUpdated).toHaveBeenCalled();
    });
  });

  describe('addAddressToTenant', () => {
    it('should add address to a tenant', async () => {
      const tenantId = '1';
      const addressDto: AddressDto = {
        addressType: AddressType.CORPORATE,
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        postalCode: '12345',
        country: 'USA',
        isPrimary: true,
      };
      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TenantStatus.ACTIVE,
        subdomain: 'original-tenant',
      };
      const newAddress = {
        id: '1',
        ...addressDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      };
      // Mock for query runner manager.save in transaction
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockResolvedValue(newAddress),
          remove: jest.fn(),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      tenantRepository.findById.mockResolvedValue(tenant);
      addressRepository.create.mockReturnValue(newAddress);

      const result = await service.addAddressToTenant(tenantId, addressDto);

      // Expect the service to return the address object
      expect(result).toEqual(newAddress);
      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(addressRepository.create).toHaveBeenCalledWith({
        ...addressDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      });
      // Check transaction manager was used to save instead of repository directly
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(newAddress);
    });
  });

  describe('addContactInfoToTenant', () => {
    it('should add contact info to a tenant', async () => {
      const tenantId = '1';
      const contactInfoDto: ContactInfoDto = {
        contactType: ContactType.PRIMARY,
        email: 'test@example.com',
        phone: '123-456-7890',
        isPrimary: true,
      };
      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TenantStatus.ACTIVE,
        subdomain: 'original-tenant',
      };
      const newContactInfo = {
        id: '1',
        ...contactInfoDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      };
      // Mock for query runner manager.save in transaction
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockResolvedValue(newContactInfo),
          remove: jest.fn(),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
      tenantRepository.findById.mockResolvedValue(tenant);
      contactInfoRepository.create.mockReturnValue(newContactInfo);

      const result = await service.addContactInfoToTenant(tenantId, contactInfoDto);

      // Expect the service to return the contact info object
      expect(result).toEqual(newContactInfo);
      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(contactInfoRepository.create).toHaveBeenCalledWith({
        ...contactInfoDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      });
      // Check transaction manager was used to save instead of repository directly
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(newContactInfo);
    });
  });

  describe('remove', () => {
    it('should remove a tenant', async () => {
      const tenantId = '1';
      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
      };
      const addresses = [
        { id: '1', entityId: tenantId, entityType: 'TENANT', isDeleted: false },
        { id: '2', entityId: tenantId, entityType: 'TENANT', isDeleted: false },
      ];
      const contacts = [
        { id: '1', entityId: tenantId, entityType: 'TENANT', isDeleted: false },
        { id: '2', entityId: tenantId, entityType: 'TENANT', isDeleted: false },
      ];

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn(),
          remove: jest.fn().mockResolvedValue(tenant),
        },
      };

      tenantRepository.findById.mockResolvedValue(tenant);
      addressRepository.find.mockResolvedValue(addresses);
      contactInfoRepository.find.mockResolvedValue(contacts);
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      await service.remove(tenantId);

      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(addressRepository.find).toHaveBeenCalled();
      expect(contactInfoRepository.find).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(
        addresses.length + contacts.length,
      );
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(tenant);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantDeleted).toHaveBeenCalledWith(tenantId);
    });
  });
});
