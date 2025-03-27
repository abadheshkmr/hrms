// API functions for interacting with the tenants endpoints

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  subdomain: string;
}

export interface UpdateTenantDto {
  name?: string;
  subdomain?: string;
  isActive?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/api';

export const fetchTenants = async (): Promise<Tenant[]> => {
  const response = await fetch(`${API_URL}/tenants`);
  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }
  return response.json();
};

export const fetchTenantById = async (id: string): Promise<Tenant> => {
  const response = await fetch(`${API_URL}/tenants/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tenant with id ${id}`);
  }
  return response.json();
};

export const createTenant = async (data: CreateTenantDto): Promise<Tenant> => {
  const response = await fetch(`${API_URL}/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create tenant');
  }
  return response.json();
};

export const updateTenant = async (id: string, data: UpdateTenantDto): Promise<Tenant> => {
  const response = await fetch(`${API_URL}/tenants/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update tenant with id ${id}`);
  }
  return response.json();
};

export const deleteTenant = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/tenants/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete tenant with id ${id}`);
  }
};
