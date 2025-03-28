/**
 * Tenant API client for HRMS SaaS application
 */
import { apiClient } from './index';
import { z } from 'zod';

// Tenant-related type definitions based on the backend
export interface Address {
  id: string;
  tenantId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isHeadOffice?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  id: string;
  tenantId: string;
  type: string;
  email: string;
  phone?: string;
  name?: string;
  designation?: string;
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
  contactInfo?: ContactInfo[];
}

// Input validation schemas using Zod
export const createAddressSchema = z.object({
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  isHeadOffice: z.boolean().optional()
});

export const createContactInfoSchema = z.object({
  type: z.string().min(1, 'Contact type is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  name: z.string().optional(),
  designation: z.string().optional(),
  isPrimary: z.boolean().optional()
});

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  subdomain: z.string().min(1, 'Subdomain is required')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  status: z.string().optional(),
  description: z.string().optional(),
  addresses: z.array(createAddressSchema).optional(),
  contactInfo: z.array(createContactInfoSchema).optional()
});

// Schema for updating a tenant, similar to create but with all fields optional
export const updateTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').optional(),
  subdomain: z.string().min(1, 'Subdomain is required')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  addresses: z.array(createAddressSchema).optional(),
  contactInfo: z.array(createContactInfoSchema).optional()
});

// Define DTO types
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type CreateContactInfoDto = z.infer<typeof createContactInfoSchema>;
export type CreateTenantDto = z.infer<typeof createTenantSchema>;

/**
 * Tenant API service
 */
export class TenantApi {
  /**
   * Fetches all tenants
   */
  async getAllTenants(): Promise<Tenant[]> {
    return apiClient.get<Tenant[]>('/tenants');
  }

  /**
   * Fetches a tenant by ID including addresses and contact info
   */
  async getTenantById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`);
  }

  /**
   * Creates a new tenant
   */
  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    // Validate data against schema
    createTenantSchema.parse(data);
    return apiClient.post<Tenant>('/tenants', data);
  }

  /**
   * Updates an existing tenant
   */
  async updateTenant(id: string, data: Partial<CreateTenantDto>): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/tenants/${id}`, data);
  }

  /**
   * Deletes a tenant
   */
  async deleteTenant(id: string): Promise<void> {
    return apiClient.delete(`/tenants/${id}`);
  }

  /**
   * Adds an address to a tenant
   */
  async addAddress(tenantId: string, data: CreateAddressDto): Promise<Address> {
    // Validate data against schema
    createAddressSchema.parse(data);
    return apiClient.post<Address>(`/tenants/${tenantId}/addresses`, data);
  }

  /**
   * Updates an address
   */
  async updateAddress(tenantId: string, addressId: string, data: Partial<CreateAddressDto>): Promise<Address> {
    return apiClient.patch<Address>(`/tenants/${tenantId}/addresses/${addressId}`, data);
  }

  /**
   * Deletes an address
   */
  async deleteAddress(tenantId: string, addressId: string): Promise<void> {
    return apiClient.delete(`/tenants/${tenantId}/addresses/${addressId}`);
  }

  /**
   * Adds contact information to a tenant
   */
  async addContactInfo(tenantId: string, data: CreateContactInfoDto): Promise<ContactInfo> {
    // Validate data against schema
    createContactInfoSchema.parse(data);
    return apiClient.post<ContactInfo>(`/tenants/${tenantId}/contacts`, data);
  }

  /**
   * Updates contact information
   */
  async updateContactInfo(tenantId: string, contactId: string, data: Partial<CreateContactInfoDto>): Promise<ContactInfo> {
    return apiClient.patch<ContactInfo>(`/tenants/${tenantId}/contacts/${contactId}`, data);
  }

  /**
   * Deletes contact information
   */
  async deleteContactInfo(tenantId: string, contactId: string): Promise<void> {
    return apiClient.delete(`/tenants/${tenantId}/contacts/${contactId}`);
  }
}

// Export a singleton instance
export const tenantApi = new TenantApi();

// Default export
export default tenantApi;
