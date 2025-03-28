import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
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

// Define TenantWithRelations interface for typing
interface TenantWithRelations {
  id: string;
  name: string;
  addresses: Address[];
  contactInfo: ContactInfo[];
}

// Properly type MockRepository to work with TypeORM's Repository
type MockRepository<T extends object = any> = {
  [K in keyof Repository<T>]?: jest.Mock;
};

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
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
  let tenantRepository: MockRepository<Tenant>;
  let addressRepository: MockRepository<Address>;
  let contactInfoRepository: MockRepository<ContactInfo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Address),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ContactInfo),
          useValue: createMockRepository(),
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
    tenantRepository = module.get<MockRepository<Tenant>>(getRepositoryToken(Tenant));
    addressRepository = module.get<MockRepository<Address>>(getRepositoryToken(Address));
    contactInfoRepository = module.get<MockRepository<ContactInfo>>(
      getRepositoryToken(ContactInfo),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tenants', async () => {
      const expectedTenants = [{ id: '1', name: 'Test Tenant' }];
      tenantRepository.find!.mockResolvedValue(expectedTenants);

      const result = await service.findAll();
      expect(result).toEqual(expectedTenants);
      expect(tenantRepository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a tenant when it exists', async () => {
      const expectedTenant = {
        id: '1',
        name: 'Test Tenant',
      };
      tenantRepository.findOne!.mockResolvedValue(expectedTenant);

      const result = await service.findById('1');
      expect(result).toEqual(expectedTenant);
      expect(tenantRepository.findOne!).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      tenantRepository.findOne!.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
      expect(tenantRepository.findOne!).toHaveBeenCalledWith({ where: { id: '1' } });
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
      tenantRepository.create!.mockReturnValue(newTenant);

      const result = await service.create(createTenantDto);

      // Verify the result and mocks
      expect(result).toEqual(newTenant);
      expect(tenantRepository.create!).toHaveBeenCalled();
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
      tenantRepository.findOne!.mockResolvedValue(existingTenant);
      
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
      expect(tenantRepository.findOne!).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantUpdated).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      tenantRepository.findOne!.mockResolvedValue(null);

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
      } as Tenant;
      const address = {
        id: '1',
        ...addressDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      };

      tenantRepository.findOne!.mockResolvedValue(tenant);
      addressRepository.create!.mockReturnValue(address);
      addressRepository.save!.mockResolvedValue(address);

      const result = await service.addAddressToTenant(tenantId, addressDto);

      expect(result).toEqual(address);
      expect(tenantRepository.findOne!).toHaveBeenCalledWith({ where: { id: tenantId } });
      expect(addressRepository.create!).toHaveBeenCalledWith({
        ...addressDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      });
      expect(addressRepository.save!).toHaveBeenCalledWith(address);
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
      } as Tenant;
      const contactInfo = {
        id: '1',
        ...contactInfoDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
        value: 'test@example.com', // For the test expectations that use this field
      };

      tenantRepository.findOne!.mockResolvedValue(tenant);
      contactInfoRepository.create!.mockReturnValue(contactInfo);
      contactInfoRepository.save!.mockResolvedValue(contactInfo);

      const result = await service.addContactInfoToTenant(tenantId, contactInfoDto);

      expect(result).toEqual(contactInfo);
      expect(tenantRepository.findOne!).toHaveBeenCalledWith({ where: { id: tenantId } });
      expect(contactInfoRepository.create!).toHaveBeenCalledWith({
        ...contactInfoDto,
        entityId: tenantId,
        entityType: 'TENANT',
        tenantId,
      });
      expect(contactInfoRepository.save!).toHaveBeenCalledWith(contactInfo);
    });
  });

  describe('getTenantWithAddressesAndContacts', () => {
    it('should return a tenant with addresses and contact info', async () => {
      const tenantId = '1';
      const tenant = {
        id: tenantId,
        name: 'Test Tenant',
      } as Tenant;
      const addresses = [
        {
          id: '1',
          addressLine1: '123 Test St',
          entityId: tenantId,
          entityType: 'TENANT',
        },
      ] as Address[];
      const contacts = [
        {
          id: '1',
          contactType: ContactType.PRIMARY,
          email: 'test@example.com',
          entityId: tenantId,
          entityType: 'TENANT',
        },
      ] as ContactInfo[];

      tenantRepository.findOne!.mockResolvedValue(tenant);
      addressRepository.find!.mockResolvedValue(addresses);
      contactInfoRepository.find!.mockResolvedValue(contacts);

      const result = (await service.getTenantWithAddressesAndContacts(
        tenantId,
      )) as TenantWithRelations;

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
      } as Tenant;
      const addresses = [
        {
          id: '1',
          addressLine1: '123 Test St',
          entityId: tenantId,
          entityType: 'TENANT',
          isDeleted: false,
        },
      ];
      const contacts = [
        {
          id: '1',
          contactType: ContactType.PRIMARY,
          email: 'test@example.com',
          entityId: tenantId,
          entityType: 'TENANT',
          isDeleted: false,
        },
      ] as ContactInfo[];

      // Mock the necessary repository methods
      tenantRepository.findOne!.mockResolvedValue(tenant);
      addressRepository.find!.mockResolvedValue(addresses);
      contactInfoRepository.find!.mockResolvedValue(contacts);

      // Mock DataSource and QueryRunner for the remove method
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockImplementation((entity: any) => {
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
          }),
          remove: jest.fn().mockResolvedValue(tenant),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      await service.remove(tenantId);

      // Verify the method calls
      expect(tenantRepository.findOne!).toHaveBeenCalledWith({ where: { id: tenantId } });
      expect(addressRepository.find!).toHaveBeenCalled();
      expect(contactInfoRepository.find!).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(tenant);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventsService.publishTenantDeleted).toHaveBeenCalledWith(tenantId);
    });
  });
});
