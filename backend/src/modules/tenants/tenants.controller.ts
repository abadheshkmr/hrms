import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Address } from '../../common/entities/address.entity';
import { ContactInfo } from '../../common/entities/contact-info.entity';
import { AddressDto } from '../../common/dto/address.dto';
import { ContactInfoDto } from '../../common/dto/contact-info.dto';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tenants',
    description: 'Retrieves a list of all tenants in the system',
  })
  @ApiResponse({ status: 200, description: 'Returns the list of tenants', type: [Tenant] })
  findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
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
  addContactInfo(
    @Param('id') id: string,
    @Body() contactInfoDto: ContactInfoDto,
  ): Promise<ContactInfo> {
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
  updateContactInfo(
    @Param('id') id: string,
    @Body() contactInfoDto: ContactInfoDto,
  ): Promise<ContactInfo> {
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
}
