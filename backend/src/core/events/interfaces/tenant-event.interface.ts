import { TenantData } from '../../../common/interfaces/tenant.interface';

export interface TenantCreatedEvent {
  tenant: TenantData;
  timestamp: string;
}

export interface TenantUpdatedEvent {
  tenant: TenantData;
  timestamp: string;
}

export interface TenantDeletedEvent {
  tenantId: string;
  timestamp: string;
}
