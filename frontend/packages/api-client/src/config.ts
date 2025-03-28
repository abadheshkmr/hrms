/**
 * API client configuration for HRMS SaaS
 */

export interface ApiConfig {
  baseUrl: string;
  apiVersion?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

// Default configuration for development
const defaultConfig: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  apiVersion: 'v1',
  timeoutMs: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

let apiConfig: ApiConfig = { ...defaultConfig };

/**
 * Sets API client configuration
 */
export const setApiConfig = (config: Partial<ApiConfig>): void => {
  apiConfig = { ...apiConfig, ...config };
};

/**
 * Gets current API client configuration
 */
export const getApiConfig = (): ApiConfig => {
  return apiConfig;
};

/**
 * Gets full API URL including version if specified
 */
export const getApiUrl = (path: string): string => {
  const { baseUrl, apiVersion } = getApiConfig();
  const versionPath = apiVersion ? `/${apiVersion}` : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${versionPath}${normalizedPath}`;
};
