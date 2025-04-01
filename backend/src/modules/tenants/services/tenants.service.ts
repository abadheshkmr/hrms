import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PaginationOptions, PaginatedResult } from '../../../common/types/pagination.types';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus, VerificationStatus, BusinessType, BusinessScale } from '../enums/tenant.enums';
import { BusinessInfo } from '../entities/embedded/business-info.entity';
import { RegistrationInfo } from '../entities/embedded/registration-info.entity';
import { VerificationInfo } from '../entities/embedded/verification-info.entity';
import { ContactDetails } from '../entities/embedded/contact-details.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { EventsService } from '../../../core/events/events.service';
import { Address } from '../../../common/entities/address.entity';
import { ContactInfo } from '../../../common/entities/contact-info.entity';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { TenantWithRelations } from '../../../common/interfaces/tenant-result.interface';
import { TenantRepository } from '../repositories/tenant.repository';
import { TenantHelperService } from './tenant-helper.service';
import { TenantMetricsService } from './tenant-metrics.service';
import { TenantTransactionService } from './tenant-transaction.service';
import { TenantLifecycleService } from './tenant-lifecycle.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly tenantRepository: TenantRepository,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(ContactInfo)
    private contactInfoRepository: Repository<ContactInfo>,
    private readonly eventsService: EventsService,
    private readonly helperService: TenantHelperService,
    private readonly transactionService: TenantTransactionService,
    private readonly metricsService: TenantMetricsService,
    private readonly lifecycleService: TenantLifecycleService,
    private dataSource: DataSource
  ) {}

  /**
   * Find all active tenants with pagination support
   * @param paginationOptions - Optional pagination options
   * @returns Promise with paginated tenants
   */
  async findAll(paginationOptions?: PaginationOptions): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.findWithPagination(
      {
        where: { isDeleted: false },
      },
      paginationOptions
    );
  }

  /**
   * Find tenants by status with pagination support
   * @param status - Tenant status to filter by
   * @param paginationOptions - Optional pagination options
   * @returns Promise with paginated tenants with matching status
   */
  async findByStatus(status: TenantStatus, paginationOptions?: PaginationOptions): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.findByStatus(status, paginationOptions);
  }

  /**
   * Find tenants by verification status with pagination support
   * @param status - Verification status to filter by
   * @param paginationOptions - Optional pagination options
   * @returns Promise with paginated tenants with matching verification status
   */
  async findByVerificationStatus(status: VerificationStatus, paginationOptions?: PaginationOptions): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.findByVerificationStatus(status, paginationOptions);
  }

  /**
   * Advanced search for tenants with multiple criteria and pagination
   * @param criteria - Object with search criteria (name, industry, status, etc.)
   * @param paginationOptions - Optional pagination options
   * @returns Promise with paginated tenants matching criteria
   */
  async advancedSearch(criteria: Record<string, any>, paginationOptions?: PaginationOptions): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.advancedSearch(criteria, paginationOptions);
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

  /**
   * Get tenant with all related addresses and contact information
   * @param id - Tenant ID
   * @returns Promise with tenant and related data
   */
  async getTenantWithAddressesAndContacts(id: string): Promise<TenantWithRelations> {
    const tenant = await this.findById(id);
    const addresses = await this.getAddressesByTenantId(id);
    const contacts = await this.getContactInfoByTenantId(id);

    // Extract only the data properties from the tenant entity
    // This avoids TypeScript errors with the methods from base entities
    const tenantData = {
      id: tenant.id,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      isDeleted: tenant.isDeleted,
      version: tenant.version,
      tenantId: tenant.tenantId,
      name: tenant.name,
      subdomain: tenant.subdomain,
      legalName: tenant.legalName,
      isActive: tenant.isActive,
      status: tenant.status,
      identifier: tenant.identifier,
      foundedDate: tenant.business?.foundedDate,
      business: tenant.business,
      registration: tenant.registration,
      verification: tenant.verification,
      contact: tenant.contact,
      // Include addresses and contacts
      addresses,
      contactInfo: contacts,
    };

    return tenantData;
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
   * Search tenants by name or legal name with pagination support
   * @param searchTerm - Text to search for
   * @param paginationOptions - Optional pagination options
   * @returns Promise with paginated matching tenants
   */
  async searchByName(searchTerm: string, paginationOptions?: PaginationOptions): Promise<PaginatedResult<Tenant>> {
    return this.tenantRepository.searchByName(searchTerm, paginationOptions);
  }

  /**
   * Create a new tenant
   * @param createTenantDto - DTO with tenant data
   * @returns Promise with created tenant
   */
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    try {
      // Sanitize input by trimming whitespace from all string fields
      const sanitizedDto = this.helperService.sanitizeStringInputs(createTenantDto);

      // Extract embedded entity fields from the DTO
      const { businessType, businessScale, gstNumber, panNumber, primaryEmail, ...restOfDto } = sanitizedDto;

      // Check for duplicate name, subdomain, or identifier before creating
      await this.checkForDuplicates(sanitizedDto);

      // Execute the tenant creation in a transaction
      const savedTenant = await this.transactionService.executeInTransaction(async (queryRunner) => {
        // Create new tenant entity
        const tenant = new Tenant();

        // Set basic properties
        Object.assign(tenant, {
          ...restOfDto,
          subdomain: restOfDto.subdomain?.toLowerCase(),
          status: TenantStatus.PENDING,
          isActive: true,
          tenantId: null, // Explicitly set to null since a tenant doesn't belong to another tenant
        });

        // Set embedded business info if provided
        if (businessType || businessScale) {
          // Create BusinessInfo instance rather than plain object
          const business = new BusinessInfo();
          business.businessType = businessType || BusinessType.OTHER;
          business.businessScale = businessScale || BusinessScale.SMALL;
          business.industry = 'OTHER'; // Default value
          tenant.business = business;
        }

        // Set embedded registration info if provided
        if (gstNumber || panNumber) {
          // Create RegistrationInfo instance rather than plain object
          const registration = new RegistrationInfo();
          registration.gstNumber = gstNumber;
          registration.panNumber = panNumber;
          tenant.registration = registration;
        }

        // Set embedded contact details if provided
        if (primaryEmail) {
          // Create ContactDetails instance rather than plain object
          const contactDetails = new ContactDetails();
          contactDetails.primaryEmail = primaryEmail;
          tenant.contact = contactDetails;
        }

        // Set embedded verification info
        // Create VerificationInfo instance rather than plain object
        const verification = new VerificationInfo();
        verification.verificationStatus = VerificationStatus.PENDING;
        verification.verificationAttempted = false;
        tenant.verification = verification;

        // Save the tenant using the entity manager
        return await queryRunner.manager.save(tenant);
      });

      if (!savedTenant) {
        throw new InternalServerErrorException('Failed to create tenant');
      }

      // Create and publish event data
      const eventData = this.helperService.prepareTenantDataForEvent(savedTenant);
      await this.eventsService.publishTenantCreated(eventData);

      // Track API usage and update metrics
      await this.metricsService.trackApiUsage(savedTenant.id);

      return savedTenant;
    } catch (error: unknown) {
      // Handle unique constraint errors
      if (this.helperService.isPostgresUniqueViolationError(error)) {
        // Extract field name from error detail
        const field = this.helperService.extractFieldFromErrorMessage(this.helperService.getErrorDetail(error));
        throw new ConflictException(`A tenant with this ${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Check for duplicates before tenant creation
   * @param dto - Tenant DTO to check for duplicates
   */
  private async checkForDuplicates(dto: CreateTenantDto): Promise<void> {
    const { subdomain, name, identifier } = dto;

    if (subdomain) {
      const existingBySubdomain = await this.tenantRepository.findOne({ where: { subdomain } });
      if (existingBySubdomain) {
        throw new ConflictException(`A tenant with subdomain '${subdomain}' already exists`);
      }
    }

    if (name) {
      const existingByName = await this.tenantRepository.findOne({ where: { name } });
      if (existingByName) {
        throw new ConflictException(`A tenant with name '${name}' already exists`);
      }
    }

    if (identifier) {
      const existingByIdentifier = await this.tenantRepository.findOne({ where: { identifier } });
      if (existingByIdentifier) {
        throw new ConflictException(`A tenant with identifier '${identifier}' already exists`);
      }
    }
  }

  async addAddressToTenant(tenantId: string, addressDto: AddressDto): Promise<Address> {
    const tenant = await this.findById(tenantId);

    return this.transactionService.executeInTransaction(async (queryRunner) => {
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

  async addContactInfoToTenant(tenantId: string, contactInfoDto: ContactInfoDto): Promise<ContactInfo> {
    const tenant = await this.findById(tenantId);

    return this.transactionService.executeInTransaction(async (queryRunner) => {
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

    // Sanitize input by trimming whitespace from all string fields
    const sanitizedDto = this.helperService.sanitizeStringInputs(updateTenantDto);

    // Execute the tenant update in a transaction
    const updatedTenant = await this.transactionService.executeInTransaction(async (queryRunner) => {
      Object.assign(tenant, sanitizedDto);

      // Ensure tenantId remains null for Tenant entities
      tenant.tenantId = null;

      return await queryRunner.manager.save(tenant);
    });

    // Create and publish event data
    const eventData = this.helperService.prepareTenantDataForEvent(updatedTenant);
    await this.eventsService.publishTenantUpdated(eventData);

    // Track API usage and update metrics
    await this.metricsService.trackApiUsage(id);

    return updatedTenant;
  }

  /**
   * Set tenant status
   * @param id - Tenant ID
   * @param status - New TenantStatus enum value
   * @returns Promise with updated tenant
   */
  async setStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.findById(id);

    // Validate status transition
    if (!this.helperService.isValidStatusTransition(tenant.status, status)) {
      throw new BadRequestException(`Invalid status transition from ${tenant.status} to ${status}`);
    }

    // Use transaction with appropriate isolation level
    const updatedTenant = await this.transactionService.executeInTransaction(
      async (queryRunner) => {
        tenant.status = status;
        return queryRunner.manager.save(tenant);
      },
      'REPEATABLE READ' // Use higher isolation for status changes
    );

    // Publish event
    const eventData = this.helperService.prepareTenantDataForEvent(updatedTenant);
    await this.eventsService.publishTenantUpdated(eventData);

    // Track status change in metrics
    await this.metricsService.updateTenantMetrics(id, { status });

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
  async setVerificationStatus(id: string, verificationStatus: VerificationStatus, verifiedById: string, verificationNotes?: string): Promise<Tenant> {
    // First check if tenant exists
    const tenant = await this.findById(id);

    // Validate verification status transition
    if (tenant.verification && !this.helperService.isValidVerificationStatusTransition(tenant.verification.verificationStatus, verificationStatus)) {
      throw new BadRequestException(`Invalid verification status transition from ${tenant.verification.verificationStatus} to ${verificationStatus}`);
    }

    // Execute verification status update in a transaction
    return this.transactionService.executeInTransaction(async (queryRunner) => {
      // Initialize verification property if not exists
      if (!tenant.verification) {
        tenant.verification = new VerificationInfo();
        tenant.verification.verificationStatus = VerificationStatus.PENDING;
        tenant.verification.verificationAttempted = false;
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

      const updatedTenant = await queryRunner.manager.save(tenant);

      // Create and publish event data
      const eventData = this.helperService.prepareTenantDataForEvent(updatedTenant);
      await this.eventsService.publishTenantUpdated(eventData);

      // Track API usage and update metrics
      await this.metricsService.trackApiUsage(id);

      return updatedTenant;
    }, 'REPEATABLE READ');
  }

  async updateAddress(addressId: string, addressDto: AddressDto): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id: addressId } });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    // Get tenantId for metrics tracking
    const tenantId = address.tenantId as string;

    // Execute transaction
    const updatedAddress = await this.transactionService.executeInTransaction(async (queryRunner) => {
      Object.assign(address, addressDto);
      return queryRunner.manager.save(address);
    });

    // Track API usage
    if (tenantId) {
      await this.metricsService.trackApiUsage(tenantId);
    }

    return updatedAddress;
  }

  async updateContactInfo(contactInfoId: string, contactInfoDto: ContactInfoDto): Promise<ContactInfo> {
    const contactInfo = await this.contactInfoRepository.findOne({ where: { id: contactInfoId } });

    if (!contactInfo) {
      throw new NotFoundException(`Contact info with ID ${contactInfoId} not found`);
    }

    // Get tenantId for metrics tracking
    const tenantId = contactInfo.tenantId as string;

    // Execute transaction
    const updatedContactInfo = await this.transactionService.executeInTransaction(async (queryRunner) => {
      Object.assign(contactInfo, contactInfoDto);
      return queryRunner.manager.save(contactInfo);
    });

    // Track API usage
    if (tenantId) {
      await this.metricsService.trackApiUsage(tenantId);
    }

    return updatedContactInfo;
  }

  /**
   * Activate tenant with provisioning workflow
   * @param id - Tenant ID
   * @returns Promise with activated tenant
   */
  async activateTenant(id: string): Promise<Tenant> {
    this.logger.log(`Activating tenant ${id} with provisioning workflow`);

    // First update tenant status
    const updatedTenant = await this.setStatus(id, TenantStatus.ACTIVE);

    // Then run provisioning workflow
    await this.lifecycleService.provisionTenant(id);

    // Track event
    await this.metricsService.trackApiUsage(id);

    return updatedTenant;
  }

  /**
   * Deactivate tenant with deprovisioning workflow
   * @param id - Tenant ID
   * @returns Promise with deactivated tenant
   */
  async deactivateTenant(id: string): Promise<Tenant> {
    this.logger.log(`Deactivating tenant ${id} with deprovisioning workflow`);

    // First update tenant status
    const updatedTenant = await this.setStatus(id, TenantStatus.SUSPENDED);

    // Then run deprovisioning workflow
    await this.lifecycleService.deprovisionTenant(id);

    // Track event
    await this.metricsService.trackApiUsage(id);

    return updatedTenant;
  }

  /**
   * Remove tenant with proper deprovisioning
   * @param id - Tenant ID
   * @returns Promise indicating completion
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing tenant ${id}`);

    // Run deprovisioning workflow first
    await this.lifecycleService.deprovisionTenant(id);

    const tenant = await this.findById(id);
    const addresses = await this.getAddressesByTenantId(id);
    const contacts = await this.getContactInfoByTenantId(id);

    // Execute all deletions with proper isolation
    await this.transactionService.executeCriticalOperation(async (queryRunner) => {
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
    await this.transactionService.executeInTransaction(async (queryRunner) => {
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
    await this.transactionService.executeInTransaction(async (queryRunner) => {
      // Use soft delete
      contactInfo.isDeleted = true;
      await queryRunner.manager.save(contactInfo);
    });
  }

  /**
   * Create tenant with idempotency support
   * 
   * This method ensures that multiple calls with the same idempotency key
   * will only create one tenant, making it safe for clients to retry operations.
   * 
   * The idempotency key is typically a UUID generated by the client and must be unique
   * per logical operation. Keys are stored in a cache with the operation result.
   * 
   * Common usage patterns:
   * - Frontend applications with retry logic
   * - Payment processing integrations (matching payment idempotency)
   * - API clients with uncertain network conditions
   * - Batch processing and migration tools that may need to resume
   * 
   * @param createTenantDto - DTO with tenant data
   * @param idempotencyKey - Client-generated unique key for idempotency
   * @returns Promise with created tenant
   */
  async createWithIdempotency(createTenantDto: CreateTenantDto, idempotencyKey: string): Promise<Tenant> {
    // Check idempotency cache first
    const cachedResult = this.metricsService.getIdempotencyResult(idempotencyKey) as Tenant | null;
    if (cachedResult) {
      this.logger.log(`Using cached result for idempotency key: ${idempotencyKey}`);
      return cachedResult;
    }

    // Not in cache, create normally
    const tenant = await this.create(createTenantDto);

    // Store in idempotency cache
    this.metricsService.storeIdempotencyResult(idempotencyKey, tenant);

    return tenant;
  }
}
