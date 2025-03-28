/**
 * Interface for tenant results including related data
 */
import { Address } from '../entities/address.entity';
import { ContactInfo } from '../entities/contact-info.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

export interface TenantWithRelations extends Tenant {
  // Related data
  addresses: Address[];
  contactInfo: ContactInfo[];
}
