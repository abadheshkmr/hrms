/**
 * Interface for tenant results including related data
 */
import { Address } from '../entities/address.entity';
import { ContactInfo } from '../entities/contact-info.entity';
import { TenantStatus } from '../../modules/tenants/enums/tenant.enums';

/**
 * Extended interface for Tenant with related data
 */
export interface TenantWithRelations {
  // Base properties from Tenant
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
  tenantId: string | null;
  name: string;
  subdomain: string;
  legalName?: string;
  isActive: boolean;
  status: TenantStatus;
  identifier?: string;
  foundedDate?: Date;
  business: any; // Using 'any' for embedded entities to avoid circular dependencies
  registration: any;
  verification: any;
  contact: any;

  // Related data
  addresses: Address[];
  contactInfo: ContactInfo[];
}
