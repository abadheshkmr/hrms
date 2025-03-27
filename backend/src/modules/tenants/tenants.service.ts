import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { EventsService } from '../../core/events/events.service';
import { Address } from '../../common/entities/address.entity';
import { ContactInfo } from '../../common/entities/contact-info.entity';
import { AddressDto } from '../../common/dto/address.dto';
import { ContactInfoDto } from '../../common/dto/contact-info.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(ContactInfo)
    private contactInfoRepository: Repository<ContactInfo>,
    private readonly eventsService: EventsService,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async getTenantWithAddressesAndContacts(id: string): Promise<any> {
    const tenant = await this.findById(id);
    const addresses = await this.getAddressesByTenantId(id);
    const contacts = await this.getContactInfoByTenantId(id);

    return {
      ...tenant,
      addresses,
      contactInfo: contacts,
    };
  }

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { subdomain } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain ${subdomain} not found`);
    }
    return tenant;
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create(createTenantDto);
    const savedTenant = await this.tenantRepository.save(tenant);
    await this.eventsService.publishTenantCreated(savedTenant);
    return savedTenant;
  }

  async addAddressToTenant(tenantId: string, addressDto: AddressDto): Promise<Address> {
    const tenant = await this.findById(tenantId);

    const address = this.addressRepository.create({
      ...addressDto,
      entityId: tenant.id,
      entityType: 'TENANT',
      tenantId: tenant.tenantId || tenant.id, // Use the tenant's tenantId if available, otherwise use the tenant's id
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
      tenantId: tenant.tenantId || tenant.id, // Use the tenant's tenantId if available, otherwise use the tenant's id
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

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(id);
    Object.assign(tenant, updateTenantDto);
    const updatedTenant = await this.tenantRepository.save(tenant);
    await this.eventsService.publishTenantUpdated(updatedTenant);
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

    // Soft delete associated addresses
    const addresses = await this.getAddressesByTenantId(id);
    for (const address of addresses) {
      address.isDeleted = true;
      await this.addressRepository.save(address);
    }
    // Soft delete associated contact info
    const contacts = await this.getContactInfoByTenantId(id);
    for (const contact of contacts) {
      contact.isDeleted = true;
      await this.contactInfoRepository.save(contact);
    }
    await this.tenantRepository.remove(tenant);
    await this.eventsService.publishTenantDeleted(id);
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
