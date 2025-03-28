import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantStatus, VerificationStatus } from './entities/tenant.entity';
import { Address } from '../../common/entities/address.entity';
import { ContactInfo } from '../../common/entities/contact-info.entity';
import { EventsService } from '../../core/events/events.service';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AddressDto } from '../../common/dto/address.dto';
import { ContactInfoDto } from '../../common/dto/contact-info.dto';
import { BusinessScale, BusinessType } from './entities/tenant.entity';
import { AddressType } from '../../common/enums/address.enum';
import { ContactType } from '../../common/enums/contact.enum';
import { TenantRepository } from './repositories/tenant.repository';

// Define TenantWithRelations interface for typing
interface TenantWithRelations {
  id: string;
  name: string;
  addresses: Address[];
  contactInfo: ContactInfo[];
}

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

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get(TenantRepository);
    addressRepository = module.get(getRepositoryToken(Address));
    contactInfoRepository = module.get(getRepositoryToken(ContactInfo));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tenants', async () => {
      const expectedTenants = [{ id: '1', name: 'Test Tenant' }];
      tenantRepository.find.mockResolvedValue(expectedTenants);

      const result = await service.findAll();
      expect(result).toEqual(expectedTenants);
      expect(tenantRepository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return tenants with the specified status', async () => {
      const expectedTenants = [{ id: '1', name: 'Test Tenant', status: TenantStatus.ACTIVE }];
      tenantRepository.findByStatus.mockResolvedValue(expectedTenants);

      const result = await service.findByStatus(TenantStatus.ACTIVE);
      expect(result).toEqual(expectedTenants);
      expect(tenantRepository.findByStatus).toHaveBeenCalledWith(TenantStatus.ACTIVE);
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
        verificationStatus: VerificationStatus.PENDING,
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

      // Set up repository mock
      tenantRepository.create.mockReturnValue(newTenant);

      const result = await service.create(createTenantDto);

      // Verify the result and mocks
      expect(result).toEqual(newTenant);
      expect(tenantRepository.create).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantCreated).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the tenant', async () => {
      const updateTenantDto: UpdateTenantDto = {
        name: 'Updated Tenant',
        businessType: BusinessType.SERVICE,
        businessScale: BusinessScale.MEDIUM,
      };
      const existingTenant = {
        id: '1',
        name: 'Old Name',
        businessType: BusinessType.PRODUCT,
        businessScale: BusinessScale.SMALL,
        subdomain: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: null,
      };
      const updatedTenant = {
        ...existingTenant,
        ...updateTenantDto,
        updatedAt: new Date(),
      };

      // Mock the tenant lookup
      tenantRepository.findById.mockResolvedValue(existingTenant);

      // Mock DataSource and QueryRunner for update method
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

      const result = await service.update('1', updateTenantDto);

      expect(result).toEqual(updatedTenant);
      expect(tenantRepository.findById).toHaveBeenCalledWith('1');
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantUpdated).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.update('1', { name: 'Updated Tenant' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAddressToTenant', () => {
    it('should add an address to a tenant', async () => {
      const tenantId = '1';
      const addressDto: AddressDto = {
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
        addressType: AddressType.WORK,
        isPrimary: true,
      };

      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
      };
      const address = {
        id: '1',
        ...addressDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      };

      tenantRepository.findById.mockResolvedValue(tenant);
      addressRepository.create.mockReturnValue(address);
      addressRepository.save.mockResolvedValue(address);

      const result = await service.addAddressToTenant(tenantId, addressDto);

      expect(result).toEqual(address);
      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(addressRepository.create).toHaveBeenCalledWith({
        ...addressDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      });
      expect(addressRepository.save).toHaveBeenCalledWith(address);
    });
  });

  describe('addContactInfoToTenant', () => {
    it('should add contact info to a tenant', async () => {
      const tenantId = '1';
      const contactInfoDto: ContactInfoDto = {
        contactType: ContactType.PRIMARY,
        email: 'test@example.com',
        isPrimary: true,
      };

      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
      };
      const contactInfo = {
        id: '1',
        ...contactInfoDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
        value: 'test@example.com', // For the test expectations that use this field
      };

      tenantRepository.findById.mockResolvedValue(tenant);
      contactInfoRepository.create.mockReturnValue(contactInfo);
      contactInfoRepository.save.mockResolvedValue(contactInfo);

      const result = await service.addContactInfoToTenant(tenantId, contactInfoDto);

      expect(result).toEqual(contactInfo);
      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(contactInfoRepository.create).toHaveBeenCalledWith({
        ...contactInfoDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      });
      expect(contactInfoRepository.save).toHaveBeenCalledWith(contactInfo);
    });
  });

  describe('getTenantWithAddressesAndContacts', () => {
    it('should return a tenant with addresses and contact info', async () => {
      const tenantId = '1';
      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
      };
      // Create mock addresses with required fields for Address type
      const addresses = [
        {
          id: '1',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          addressType: AddressType.WORK,
          entityId: tenantId,
          entityType: 'TENANT',
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ];

      // Create mock contacts with required fields for ContactInfo type
      const contacts = [
        {
          id: '1',
          contactType: ContactType.PRIMARY,
          email: 'test@example.com',
          entityId: tenantId,
          entityType: 'TENANT',
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ];

      tenantRepository.findById.mockResolvedValue(tenant);
      addressRepository.find.mockResolvedValue(addresses);
      contactInfoRepository.find.mockResolvedValue(contacts);

      const result = await service.getTenantWithAddressesAndContacts(tenantId);

      const expectedResult: TenantWithRelations = {
        ...tenant,
        addresses,
        contactInfo: contacts,
      };

      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a tenant', async () => {
      const tenantId = '1';
      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
      };
      // Create mock addresses with required fields for Address type
      const addresses = [
        {
          id: '1',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          addressType: AddressType.WORK,
          entityId: tenantId,
          entityType: 'TENANT',
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ];

      // Create mock contacts with required fields for ContactInfo type
      const contacts = [
        {
          id: '1',
          contactType: ContactType.PRIMARY,
          email: 'test@example.com',
          entityId: tenantId,
          entityType: 'TENANT',
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        },
      ];

      // Mock the necessary repository methods
      tenantRepository.findById.mockResolvedValue(tenant);
      addressRepository.find.mockResolvedValue(addresses);
      contactInfoRepository.find.mockResolvedValue(contacts);

      // Mock DataSource and QueryRunner for the remove method
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest
            .fn()
            .mockImplementation(
              (entity: { entityType?: string; addressLine1?: string; isDeleted?: boolean }) => {
                if (entity.entityType === 'TENANT') {
                  if (entity.addressLine1) {
                    // If it's an address
                    return Promise.resolve({ ...entity, isDeleted: true });
                  } else {
                    // If it's a contact info
                    return Promise.resolve({ ...entity, isDeleted: true });
                  }
                }
                return Promise.resolve(entity);
              },
            ),
          remove: jest.fn().mockResolvedValue(tenant),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      await service.remove(tenantId);

      // Verify the method calls
      expect(tenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(addressRepository.find).toHaveBeenCalled();
      expect(contactInfoRepository.find).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(tenant);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantDeleted).toHaveBeenCalledWith(tenantId);
    });
  });
});
