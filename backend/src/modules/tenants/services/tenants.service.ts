import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus, VerificationStatus } from '../enums/tenant.enums';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { EventsService } from '../../../core/events/events.service';
import { Address } from '../../../common/entities/address.entity';
import { ContactInfo } from '../../../common/entities/contact-info.entity';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { TenantWithRelations } from '../../../common/interfaces/tenant-result.interface';
import { TenantData } from '../../../common/interfaces/tenant.interface';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(ContactInfo)
    private contactInfoRepository: Repository<ContactInfo>,
    private readonly eventsService: EventsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Execute a function within a transaction
   * @param operation - Function to execute within the transaction
   * @returns Promise with result of the operation
   */
  private async executeInTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Wrap unknown errors as internal server errors with original message
      if (!(error instanceof Error)) {
        throw new InternalServerErrorException('Unknown error during transaction');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all active tenants
   * @returns Promise with array of tenants
   */
  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { isDeleted: false },
    });
  }

  /**
   * Find tenants by status
   * @param status - TenantStatus enum value
   * @returns Promise with array of tenants
   */
  async findByStatus(status: TenantStatus): Promise<Tenant[]> {
    return this.tenantRepository.findByStatus(status);
  }

  /**
   * Find tenants by verification status
   * @param verificationStatus - VerificationStatus enum value
   * @returns Promise with array of tenants
   */
  async findByVerificationStatus(verificationStatus: VerificationStatus): Promise<Tenant[]> {
    return this.tenantRepository.findByVerificationStatus(verificationStatus);
  }

  /**
   * Find tenant by ID
   * @param id - Tenant ID
   * @returns Promise with tenant or throws NotFoundException
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async getTenantWithAddressesAndContacts(id: string): Promise<TenantWithRelations> {
    const tenant = await this.findById(id);
    const addresses = await this.getAddressesByTenantId(id);
    const contacts = await this.getContactInfoByTenantId(id);

    return {
      ...tenant,
      addresses,
      contactInfo: contacts,
    };
  }

  /**
   * Find tenant by subdomain
   * @param subdomain - Tenant subdomain
   * @returns Promise with tenant or throws NotFoundException
   */
  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findBySubdomain(subdomain);
    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain ${subdomain} not found`);
    }
    return tenant;
  }

  /**
   * Find tenant by identifier
   * @param identifier - Tenant unique identifier
   * @returns Promise with tenant or throws NotFoundException
   */
  async findByIdentifier(identifier: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findByIdentifier(identifier);
    if (!tenant) {
      throw new NotFoundException(`Tenant with identifier ${identifier} not found`);
    }
    return tenant;
  }

  /**
   * Search tenants by name or legal name
   * @param searchTerm - Text to search for
   * @returns Promise with array of matching tenants
   */
  async searchByName(searchTerm: string): Promise<Tenant[]> {
    return this.tenantRepository.searchByName(searchTerm);
  }

  /**
   * Create a new tenant
   * @param createTenantDto - DTO with tenant data
   * @returns Promise with created tenant
   */
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Execute the tenant creation in a transaction
    const savedTenant = await this.executeInTransaction(async (queryRunner) => {
      // Create tenant with default status values
      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        status: TenantStatus.PENDING,
        verification: {
          verificationStatus: VerificationStatus.PENDING,
        },
        isActive: true,
        tenantId: null, // Explicitly set to null since a tenant doesn't belong to another tenant
      });

      return await queryRunner.manager.save(tenant);
    });

    // Prepare tenant data for event with proper typing
    const tenantData: TenantData = {
      id: savedTenant.id,
      name: savedTenant.name,
      domain: savedTenant.subdomain,
      status: savedTenant.isActive ? 'active' : 'inactive',
      createdAt: savedTenant.createdAt,
      updatedAt: savedTenant.updatedAt,
    };

    // Publish event for tenant creation (outside transaction)
    await this.eventsService.publishTenantCreated(tenantData);

    return savedTenant;
  }

  async addAddressToTenant(tenantId: string, addressDto: AddressDto): Promise<Address> {
    const tenant = await this.findById(tenantId);

    return this.executeInTransaction(async (queryRunner) => {
      const address = this.addressRepository.create({
        ...addressDto,
        entityId: tenant.id,
        entityType: 'TENANT',
        tenantId: tenant.id, // The tenant's ID is always used as the tenantId for related entities
      });

      return queryRunner.manager.save(address);
    });
  }

  async getAddressesByTenantId(tenantId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: {
        entityId: tenantId,
        entityType: 'TENANT',
        isDeleted: false,
      },
    });
  }

  async addContactInfoToTenant(
    tenantId: string,
    contactInfoDto: ContactInfoDto,
  ): Promise<ContactInfo> {
    const tenant = await this.findById(tenantId);

    return this.executeInTransaction(async (queryRunner) => {
      const contactInfo = this.contactInfoRepository.create({
        ...contactInfoDto,
        entityId: tenant.id,
        entityType: 'TENANT',
        tenantId: tenant.id, // The tenant's ID is always used as the tenantId for related entities
      });

      return queryRunner.manager.save(contactInfo);
    });
  }

  async getContactInfoByTenantId(tenantId: string): Promise<ContactInfo[]> {
    return this.contactInfoRepository.find({
      where: {
        entityId: tenantId,
        entityType: 'TENANT',
        isDeleted: false,
      },
    });
  }

  /**
   * Update a tenant
   * @param id - Tenant ID
   * @param updateTenantDto - DTO with tenant update data
   * @returns Promise with updated tenant
   */
  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(id);

    // Execute the tenant update in a transaction
    const updatedTenant = await this.executeInTransaction(async (queryRunner) => {
      Object.assign(tenant, updateTenantDto);

      // Ensure tenantId remains null for Tenant entities
      tenant.tenantId = null;

      return await queryRunner.manager.save(tenant);
    });

    // Prepare tenant data for event with proper typing
    const tenantData: TenantData = {
      id: updatedTenant.id,
      name: updatedTenant.name,
      domain: updatedTenant.subdomain,
      status: updatedTenant.isActive ? 'active' : 'inactive',
      createdAt: updatedTenant.createdAt,
      updatedAt: updatedTenant.updatedAt,
    };

    // Publish event for tenant update (outside transaction)
    await this.eventsService.publishTenantUpdated(tenantData);

    return updatedTenant;
  }

  /**
   * Set tenant status
   * @param id - Tenant ID
   * @param status - New TenantStatus enum value
   * @returns Promise with updated tenant
   */
  async setStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const updatedTenant = await this.tenantRepository.setStatus(id, status);
    if (!updatedTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Prepare tenant data for event with proper typing
    const tenantData: TenantData = {
      id: updatedTenant.id,
      name: updatedTenant.name,
      domain: updatedTenant.subdomain,
      status: updatedTenant.isActive ? 'active' : 'inactive',
      createdAt: updatedTenant.createdAt,
      updatedAt: updatedTenant.updatedAt,
    };

    // Publish event for tenant update
    await this.eventsService.publishTenantUpdated(tenantData);

    return updatedTenant;
  }

  /**
   * Set tenant verification status
   * @param id - Tenant ID
   * @param verificationStatus - New VerificationStatus enum value
   * @param verifiedById - ID of user who performed verification
   * @param verificationNotes - Optional notes about verification
   * @returns Promise with updated tenant
   */
  async setVerificationStatus(
    id: string,
    verificationStatus: VerificationStatus,
    verifiedById: string,
    verificationNotes?: string,
  ): Promise<Tenant> {
    // First check if tenant exists
    const tenant = await this.findById(id);

    // Execute verification status update in a transaction
    return this.executeInTransaction(async (queryRunner) => {
      // Initialize verification property if not exists
      if (!tenant.verification) {
        tenant.verification = {
          verificationStatus: VerificationStatus.PENDING,
        };
      }

      // Update verification information
      tenant.verification.verificationStatus = verificationStatus;
      tenant.verification.verifiedById = verifiedById;

      if (verificationStatus === VerificationStatus.VERIFIED) {
        tenant.verification.verificationDate = new Date();
      }

      if (verificationNotes) {
        tenant.verification.verificationNotes = verificationNotes;
      }

      return queryRunner.manager.save(tenant);
    });
  }

  async updateAddress(addressId: string, addressDto: AddressDto): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    return this.executeInTransaction(async (queryRunner) => {
      Object.assign(address, addressDto);
      return queryRunner.manager.save(address);
    });
  }

  async updateContactInfo(
    contactInfoId: string,
    contactInfoDto: ContactInfoDto,
  ): Promise<ContactInfo> {
    const contactInfo = await this.contactInfoRepository.findOne({ where: { id: contactInfoId } });

    if (!contactInfo) {
      throw new NotFoundException(`Contact info with ID ${contactInfoId} not found`);
    }

    return this.executeInTransaction(async (queryRunner) => {
      Object.assign(contactInfo, contactInfoDto);
      return queryRunner.manager.save(contactInfo);
    });
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findById(id);
    const addresses = await this.getAddressesByTenantId(id);
    const contacts = await this.getContactInfoByTenantId(id);

    // Execute all deletions in a single transaction
    await this.executeInTransaction(async (queryRunner) => {
      // Soft delete associated addresses
      for (const address of addresses) {
        address.isDeleted = true;
        await queryRunner.manager.save(address);
      }

      // Soft delete associated contact info
      for (const contact of contacts) {
        contact.isDeleted = true;
        await queryRunner.manager.save(contact);
      }

      // Remove the tenant
      await queryRunner.manager.remove(tenant);
    });

    // Publish event outside of transaction
    await this.eventsService.publishTenantDeleted(id);
  }

  async removeAddress(addressId: string): Promise<void> {
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    // Execute soft delete in a transaction
    await this.executeInTransaction(async (queryRunner) => {
      // Use soft delete
      address.isDeleted = true;
      await queryRunner.manager.save(address);
    });
  }

  async removeContactInfo(contactInfoId: string): Promise<void> {
    const contactInfo = await this.contactInfoRepository.findOne({ where: { id: contactInfoId } });

    if (!contactInfo) {
      throw new NotFoundException(`Contact info with ID ${contactInfoId} not found`);
    }

    // Execute soft delete in a transaction
    await this.executeInTransaction(async (queryRunner) => {
      // Use soft delete
      contactInfo.isDeleted = true;
      await queryRunner.manager.save(contactInfo);
    });
  }
}
