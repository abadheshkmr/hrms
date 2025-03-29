import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant, TenantStatus, VerificationStatus } from '../entities/tenant.entity';
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Create tenant with default status values
      const tenant = this.tenantRepository.create({
        ...createTenantDto,
        status: TenantStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
        isActive: true,
        tenantId: null, // Explicitly set to null since a tenant doesn't belong to another tenant
      });

      const savedTenant = await queryRunner.manager.save(tenant);
      // Prepare tenant data for event with proper typing
      const tenantData: TenantData = {
        id: savedTenant.id,
        name: savedTenant.name,
        domain: savedTenant.subdomain,
        status: savedTenant.isActive ? 'active' : 'inactive',
        createdAt: savedTenant.createdAt,
        updatedAt: savedTenant.updatedAt,
      };

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Publish event for tenant creation (moved outside transaction)
      await this.eventsService.publishTenantCreated(tenantData);

      return savedTenant;
    } catch (error) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async addAddressToTenant(tenantId: string, addressDto: AddressDto): Promise<Address> {
    const tenant = await this.findById(tenantId);

    const address = this.addressRepository.create({
      ...addressDto,
      entityId: tenant.id,
      entityType: 'TENANT',
      tenantId: tenant.id, // The tenant's ID is always used as the tenantId for related entities
    });

    return this.addressRepository.save(address);
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

    const contactInfo = this.contactInfoRepository.create({
      ...contactInfoDto,
      entityId: tenant.id,
      entityType: 'TENANT',
      tenantId: tenant.id, // The tenant's ID is always used as the tenantId for related entities
    });

    return this.contactInfoRepository.save(contactInfo);
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tenant = await this.findById(id);
      Object.assign(tenant, updateTenantDto);

      // Ensure tenantId remains null for Tenant entities
      tenant.tenantId = null;

      const updatedTenant = await queryRunner.manager.save(tenant);

      // Prepare tenant data for event with proper typing
      const tenantData: TenantData = {
        id: updatedTenant.id,
        name: updatedTenant.name,
        domain: updatedTenant.subdomain,
        status: updatedTenant.isActive ? 'active' : 'inactive',
        createdAt: updatedTenant.createdAt,
        updatedAt: updatedTenant.updatedAt,
      };

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Publish event for tenant update (moved outside transaction)
      await this.eventsService.publishTenantUpdated(tenantData);

      return updatedTenant;
    } catch (error) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
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
    const updatedTenant = await this.tenantRepository.setVerificationStatus(
      id,
      verificationStatus,
      verifiedById,
      verificationNotes,
    );

    if (!updatedTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return updatedTenant;
  }

  async updateAddress(addressId: string, addressDto: AddressDto): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    Object.assign(address, addressDto);
    return this.addressRepository.save(address);
  }

  async updateContactInfo(
    contactInfoId: string,
    contactInfoDto: ContactInfoDto,
  ): Promise<ContactInfo> {
    const contactInfo = await this.contactInfoRepository.findOne({ where: { id: contactInfoId } });

    if (!contactInfo) {
      throw new NotFoundException(`Contact info with ID ${contactInfoId} not found`);
    }

    Object.assign(contactInfo, contactInfoDto);
    return this.contactInfoRepository.save(contactInfo);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findById(id);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete associated addresses
      const addresses = await this.getAddressesByTenantId(id);
      for (const address of addresses) {
        address.isDeleted = true;
        await queryRunner.manager.save(address);
      }

      // Soft delete associated contact info
      const contacts = await this.getContactInfoByTenantId(id);
      for (const contact of contacts) {
        contact.isDeleted = true;
        await queryRunner.manager.save(contact);
      }

      // Remove the tenant
      await queryRunner.manager.remove(tenant);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Publish event outside of transaction
      await this.eventsService.publishTenantDeleted(id);
    } catch (error) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async removeAddress(addressId: string): Promise<void> {
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    // Use soft delete
    address.isDeleted = true;
    await this.addressRepository.save(address);
  }

  async removeContactInfo(contactInfoId: string): Promise<void> {
    const contactInfo = await this.contactInfoRepository.findOne({ where: { id: contactInfoId } });

    if (!contactInfo) {
      throw new NotFoundException(`Contact info with ID ${contactInfoId} not found`);
    }

    // Use soft delete
    contactInfo.isDeleted = true;
    await this.contactInfoRepository.save(contactInfo);
  }
}
