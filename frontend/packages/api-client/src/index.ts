/**
 * Base API client for HRMS SaaS application
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getApiConfig, getApiUrl } from './config';

export type { ApiConfig } from './config';
export { setApiConfig, getApiConfig } from './config';

/**
 * Base API client class to handle HTTP requests 
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    const { timeoutMs, headers } = getApiConfig();
    
    this.axiosInstance = axios.create({
      timeout: timeoutMs,
      headers
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors (e.g., auth errors, server errors)
        if (error.response) {
          // Server responded with an error status
          console.error('API Error:', error.response.status, error.response.data);
          
          // Handle 401 Unauthorized - could redirect to login or refresh token
          if (error.response.status === 401) {
            // Handle unauthorized error (e.g., redirect to login)
            console.error('Authentication error. Please login again.');
          }
        } else if (error.request) {
          // Request was made but no response was received
          console.error('API Error: No response received', error.request);
        } else {
          // Error in setting up the request
          console.error('API Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = getApiUrl(path);
    const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = getApiUrl(path);
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = getApiUrl(path);
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = getApiUrl(path);
    const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = getApiUrl(path);
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
    return response.data;
  }
}

// Export a default instance for direct use
export const apiClient = new ApiClient();

// Default export
export default apiClient;
