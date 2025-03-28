/**
 * Interface representing tenant data for event publishing
 */
export interface TenantData {
  id: string;
  name: string;
  domain?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Add other tenant properties as needed
}
