import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, Query, Headers, BadRequestException } from '@nestjs/common';
import { TenantsService } from '../services/tenants.service';
import { TenantMetricsService } from '../services/tenant-metrics.service';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantMetricsDto, TenantConfigurationDto } from '../dto/tenant-metrics.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { PaginationOptions, PaginatedResult } from '../../../common/types/pagination.types';
import { Address } from '../../../common/entities/address.entity';
import { ContactInfo } from '../../../common/entities/contact-info.entity';
import { AddressDto } from '../../../common/dto/address.dto';
import { ContactInfoDto } from '../../../common/dto/contact-info.dto';
import { TenantStatus, VerificationStatus } from '../enums/tenant.enums';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly metricsService: TenantMetricsService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tenants',
    description: 'Retrieves a list of all tenants in the system with pagination support',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based indexing)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tenants',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: 'Tenant' } },
        meta: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            itemCount: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalPages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number): Promise<PaginatedResult<Tenant>> {
    const paginationOptions: PaginationOptions = {};

    if (page) {
      paginationOptions.page = parseInt(page.toString(), 10);
    }

    if (limit) {
      paginationOptions.take = parseInt(limit.toString(), 10);
    }

    return this.tenantsService.findAll(paginationOptions);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Retrieves a tenant by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 200, description: 'Returns the tenant details', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.findById(id);
  }

  @Get(':id/full')
  @ApiOperation({
    summary: 'Get tenant with addresses and contact info',
    description: 'Retrieves a tenant with all related addresses and contact information',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 200, description: 'Returns the tenant with related details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findTenantWithAddressesAndContacts(@Param('id') id: string): Promise<any> {
    return this.tenantsService.getTenantWithAddressesAndContacts(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Creates a new tenant in the system',
  })
  @ApiBody({ type: CreateTenantDto, description: 'Tenant data to create' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created', type: Tenant })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 409, description: 'Conflict - tenant name or subdomain already exists' })
  create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto);
  }

  /**
   * Idempotent tenant creation endpoint
   * This endpoint allows for safe retries of tenant creation without risking duplicates.
   * 
   * Use cases:
   * 1. Multi-step tenant onboarding flows where network issues might occur
   * 2. Integration with payment processing systems that use idempotency
   * 3. Third-party API clients that need reliable retry mechanisms
   * 4. Data migration and import tools that need to safely resume operations
   * 
   * The client must provide a unique Idempotency-Key in the header.
   * If the same key is used multiple times, only the first request will create 
   * a tenant; subsequent requests will return the cached result.
   */
  @Post('idempotent')
  @ApiOperation({ summary: 'Create tenant with idempotency', description: 'Creates a new tenant with idempotency support' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique client-generated key for idempotent operations',
    required: true,
  })
  @ApiBody({ type: CreateTenantDto, description: 'Tenant data to create' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created', type: Tenant })
  @ApiResponse({ status: 400, description: 'Bad request - missing idempotency key or validation errors' })
  @ApiResponse({ status: 409, description: 'Conflict - tenant name or subdomain already exists' })
  async createWithIdempotency(@Body() createTenantDto: CreateTenantDto, @Headers('Idempotency-Key') idempotencyKey: string): Promise<Tenant> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    return this.tenantsService.createWithIdempotency(createTenantDto, idempotencyKey);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant', description: 'Updates an existing tenant by ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant to update',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: UpdateTenantDto, description: 'Tenant data to update' })
  @ApiResponse({ status: 200, description: 'Tenant successfully updated', type: Tenant })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Conflict - tenant name or subdomain already exists' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tenant', description: 'Deletes a tenant by ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant to delete',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 204, description: 'Tenant successfully deleted' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }

  // Address Management
  @Post(':id/addresses')
  @ApiOperation({
    summary: 'Add address to tenant',
    description: 'Adds a new address to an existing tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: AddressDto, description: 'Address data to add' })
  @ApiResponse({ status: 201, description: 'Address successfully added', type: Address })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  addAddress(@Param('id') id: string, @Body() addressDto: AddressDto): Promise<Address> {
    return this.tenantsService.addAddressToTenant(id, addressDto);
  }

  @Get(':id/addresses')
  @ApiOperation({
    summary: 'Get all addresses for a tenant',
    description: 'Retrieves all addresses associated with a tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 200, description: 'Returns the list of addresses', type: [Address] })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getAddresses(@Param('id') id: string): Promise<Address[]> {
    return this.tenantsService.getAddressesByTenantId(id);
  }

  @Patch('addresses/:id')
  @ApiOperation({
    summary: 'Update an address',
    description: 'Updates an existing address',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the address',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: AddressDto, description: 'Address data to update' })
  @ApiResponse({ status: 200, description: 'Address successfully updated', type: Address })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  updateAddress(@Param('id') id: string, @Body() addressDto: AddressDto): Promise<Address> {
    return this.tenantsService.updateAddress(id, addressDto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address', description: 'Deletes an address by ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the address to delete',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 204, description: 'Address successfully deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  removeAddress(@Param('id') id: string): Promise<void> {
    return this.tenantsService.removeAddress(id);
  }

  // Contact Info Management
  @Post(':id/contact-info')
  @ApiOperation({
    summary: 'Add contact info to tenant',
    description: 'Adds new contact information to an existing tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: ContactInfoDto, description: 'Contact information data to add' })
  @ApiResponse({
    status: 201,
    description: 'Contact information successfully added',
    type: ContactInfo,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  addContactInfo(@Param('id') id: string, @Body() contactInfoDto: ContactInfoDto): Promise<ContactInfo> {
    return this.tenantsService.addContactInfoToTenant(id, contactInfoDto);
  }

  @Get(':id/contact-info')
  @ApiOperation({
    summary: 'Get all contact info for a tenant',
    description: 'Retrieves all contact information associated with a tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the list of contact information',
    type: [ContactInfo],
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getContactInfo(@Param('id') id: string): Promise<ContactInfo[]> {
    return this.tenantsService.getContactInfoByTenantId(id);
  }

  @Patch('contact-info/:id')
  @ApiOperation({
    summary: 'Update contact info',
    description: 'Updates existing contact information',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the contact information',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: ContactInfoDto, description: 'Contact information data to update' })
  @ApiResponse({
    status: 200,
    description: 'Contact information successfully updated',
    type: ContactInfo,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 404, description: 'Contact information not found' })
  updateContactInfo(@Param('id') id: string, @Body() contactInfoDto: ContactInfoDto): Promise<ContactInfo> {
    return this.tenantsService.updateContactInfo(id, contactInfoDto);
  }

  @Delete('contact-info/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete contact info',
    description: 'Deletes contact information by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the contact information to delete',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 204, description: 'Contact information successfully deleted' })
  @ApiResponse({ status: 404, description: 'Contact information not found' })
  removeContactInfo(@Param('id') id: string): Promise<void> {
    return this.tenantsService.removeContactInfo(id);
  }

  // Status and search endpoints
  @Get('status/:status')
  @ApiOperation({
    summary: 'Find tenants by status',
    description: 'Retrieves a paginated list of tenants with a specific status',
  })
  @ApiParam({
    name: 'status',
    description: 'Tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based indexing)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tenants with the specified status',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: 'Tenant' } },
        meta: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            itemCount: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalPages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  findByStatus(
    @Param('status') status: TenantStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginatedResult<Tenant>> {
    const paginationOptions: PaginationOptions = {};

    if (page) {
      paginationOptions.page = parseInt(page.toString(), 10);
    }

    if (limit) {
      paginationOptions.take = parseInt(limit.toString(), 10);
    }

    return this.tenantsService.findByStatus(status, paginationOptions);
  }

  @Get('verification/:status')
  @ApiOperation({
    summary: 'Find tenants by verification status',
    description: 'Retrieves a paginated list of tenants with a specific verification status',
  })
  @ApiParam({
    name: 'status',
    description: 'Verification status',
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based indexing)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tenants with the specified verification status',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: 'Tenant' } },
        meta: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            itemCount: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalPages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  findByVerificationStatus(
    @Param('status') status: VerificationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginatedResult<Tenant>> {
    const paginationOptions: PaginationOptions = {};

    if (page) {
      paginationOptions.page = parseInt(page.toString(), 10);
    }

    if (limit) {
      paginationOptions.take = parseInt(limit.toString(), 10);
    }

    return this.tenantsService.findByVerificationStatus(status, paginationOptions);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search tenants by name',
    description: 'Searches for tenants by name with pagination support',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Tenant name to search for',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based indexing)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tenants matching the search criteria',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: 'Tenant' } },
        meta: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            itemCount: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalPages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  searchByName(@Query('name') name: string, @Query('page') page?: number, @Query('limit') limit?: number): Promise<PaginatedResult<Tenant>> {
    const paginationOptions: PaginationOptions = {};

    if (page) {
      paginationOptions.page = parseInt(page.toString(), 10);
    }

    if (limit) {
      paginationOptions.take = parseInt(limit.toString(), 10);
    }

    return this.tenantsService.searchByName(name, paginationOptions);
  }

  @Get(':id/metrics')
  @ApiOperation({
    summary: 'Get tenant metrics',
    description: 'Retrieves metrics data for a specific tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 200, description: 'Returns the tenant metrics', type: TenantMetricsDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantMetrics(@Param('id') id: string): Promise<TenantMetricsDto> {
    // First ensure tenant exists and user has access
    await this.tenantsService.findById(id);

    return this.metricsService.getTenantMetrics(id);
  }

  @Post(':id/configuration')
  @ApiOperation({
    summary: 'Set tenant configuration',
    description: 'Sets configuration values for a specific tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: [TenantConfigurationDto],
    description: 'Array of configuration key-value pairs',
  })
  @ApiResponse({ status: 200, description: 'Configuration values successfully set' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async setTenantConfiguration(@Param('id') id: string, @Body() configs: TenantConfigurationDto[]): Promise<void> {
    // First ensure tenant exists and user has access
    await this.tenantsService.findById(id);

    this.metricsService.setTenantConfigurations(id, configs);
  }

  @Get(':id/configuration')
  @ApiOperation({
    summary: 'Get tenant configuration',
    description: 'Retrieves all configuration values for a specific tenant',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the tenant configuration values',
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantConfiguration(@Param('id') id: string): Promise<Record<string, string>> {
    // First ensure tenant exists and user has access
    await this.tenantsService.findById(id);

    return this.metricsService.getAllTenantConfigurations(id);
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate tenant',
    description: 'Activates a tenant and runs the provisioning workflow',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 200, description: 'Tenant successfully activated', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async activateTenant(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.activateTenant(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate tenant',
    description: 'Deactivates a tenant and runs the deprovisioning workflow',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({ status: 200, description: 'Tenant successfully deactivated', type: Tenant })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deactivateTenant(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.deactivateTenant(id);
  }

  @Get('advanced-search')
  @ApiOperation({
    summary: 'Advanced tenant search',
    description: 'Performs advanced search on tenants with multiple criteria and pagination',
  })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Tenant name' })
  @ApiQuery({ name: 'industry', required: false, type: String, description: 'Industry type' })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus, description: 'Tenant status' })
  @ApiQuery({
    name: 'verificationStatus',
    required: false,
    enum: VerificationStatus,
    description: 'Verification status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based indexing)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tenants matching search criteria',
    schema: {
      properties: {
        items: { type: 'array', items: { $ref: 'Tenant' } },
        meta: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            itemCount: { type: 'number' },
            itemsPerPage: { type: 'number' },
            totalPages: { type: 'number' },
            currentPage: { type: 'number' },
          },
        },
      },
    },
  })
  advancedSearch(
    @Query('name') name?: string,
    @Query('industry') industry?: string,
    @Query('status') status?: TenantStatus,
    @Query('verificationStatus') verificationStatus?: VerificationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<PaginatedResult<Tenant>> {
    // Define a properly typed search criteria object to avoid unsafe member access
    const searchCriteria: Partial<{
      name: string;
      industry: string;
      status: TenantStatus;
      verificationStatus: VerificationStatus;
    }> = {};

    if (name) searchCriteria.name = name;
    if (industry) searchCriteria.industry = industry;
    if (status) searchCriteria.status = status;
    if (verificationStatus) searchCriteria.verificationStatus = verificationStatus;

    const paginationOptions: PaginationOptions = {};

    if (page) {
      paginationOptions.page = parseInt(page.toString(), 10);
    }

    if (limit) {
      paginationOptions.take = parseInt(limit.toString(), 10);
    }

    return this.tenantsService.advancedSearch(searchCriteria, paginationOptions);
  }
}
