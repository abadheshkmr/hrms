import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { TenantMetricsDto, TenantConfigurationDto } from '../dto/tenant-metrics.dto';

/**
 * Service responsible for managing tenant metrics and configuration
 */
@Injectable()
export class TenantMetricsService {
  private readonly logger = new Logger(TenantMetricsService.name);
  private readonly metricsCache = new Map<string, TenantMetricsDto>();
  private readonly configCache = new Map<string, Map<string, string>>();
  private readonly idempotencyCache = new Map<string, any>();
  private readonly IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Store result in idempotency cache with TTL
   * @param key - Idempotency key
   * @param result - Operation result to cache
   */
  storeIdempotencyResult(key: string, result: any): void {
    this.idempotencyCache.set(key, {
      result,
      expiry: Date.now() + this.IDEMPOTENCY_TTL_MS
    });
  }

  /**
   * Get result from idempotency cache if valid
   * @param key - Idempotency key
   * @returns Cached result or null if not found/expired
   */
  getIdempotencyResult(key: string): any {
    const cached = this.idempotencyCache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiry < Date.now()) {
      this.idempotencyCache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Clean expired entries from idempotency cache
   * Should be called by a scheduled task
   */
  cleanIdempotencyCache(): void {
    const now = Date.now();
    for (const [key, value] of this.idempotencyCache.entries()) {
      if (value.expiry < now) {
        this.idempotencyCache.delete(key);
      }
    }
  }

  /**
   * Update metrics for a tenant
   * @param tenantId - ID of the tenant
   * @param metrics - Metrics data to update
   * @param overwrite - Whether to overwrite existing metrics (default: merge)
   * @returns Updated metrics
   */
  async updateTenantMetrics(
    tenantId: string, 
    metrics: TenantMetricsDto, 
    overwrite = false
  ): Promise<TenantMetricsDto> {
    try {
      // Get existing metrics
      const existingMetrics = this.metricsCache.get(tenantId) || {};
      
      // Update metrics based on mode
      const updatedMetrics = overwrite 
        ? { ...metrics } 
        : { ...existingMetrics, ...metrics };
      
      // Store in cache
      this.metricsCache.set(tenantId, updatedMetrics);
      
      return updatedMetrics;
    } catch (error) {
      this.logger.error(`Failed to update metrics for tenant ${tenantId}`, error);
      // Return existing metrics or empty object on error
      return this.metricsCache.get(tenantId) || {};
    }
  }

  /**
   * Get metrics for a tenant
   * @param tenantId - ID of the tenant
   * @returns Tenant metrics or empty object if not found
   */
  getTenantMetrics(tenantId: string): TenantMetricsDto {
    return this.metricsCache.get(tenantId) || {};
  }

  /**
   * Track API usage for a tenant
   * @param tenantId - ID of the tenant
   * @param increaseRequestCount - Number of requests to add (default: 1)
   */
  async trackApiUsage(tenantId: string, increaseRequestCount = 1): Promise<void> {
    try {
      const metrics = this.metricsCache.get(tenantId) || {
        totalApiRequests: 0
      };
      
      // Update metrics
      metrics.totalApiRequests = (metrics.totalApiRequests || 0) + increaseRequestCount;
      metrics.lastActivityAt = new Date();
      
      // Store updated metrics
      this.metricsCache.set(tenantId, metrics);
    } catch (error) {
      // Log but don't throw - metrics tracking should not block API operations
      this.logger.error(`Failed to track API usage for tenant ${tenantId}`, error);
    }
  }

  /**
   * Recalculate metrics for a tenant based on actual usage
   * @param tenantId - ID of the tenant
   * @returns Updated metrics
   */
  async recalculateTenantMetrics(tenantId: string): Promise<TenantMetricsDto> {
    try {
      // For actual implementation, we would query various sources
      // This is a placeholder implementation that simulates gathering metrics
      
      // Get tenant to ensure it exists and get status
      const tenant = await this.tenantRepository.findOne({ 
        where: { id: tenantId } 
      });
      
      if (!tenant) {
        throw new Error(`Tenant with ID ${tenantId} not found`);
      }
      
      // Build metrics (in real implementation would get from actual sources)
      const metrics: TenantMetricsDto = {
        activeUsersCount: Math.floor(Math.random() * 100), // Simulated value
        totalApiRequests: Math.floor(Math.random() * 10000), // Simulated value
        avgRequestsPerDay: Math.floor(Math.random() * 500), // Simulated value
        storageUsageMb: Math.floor(Math.random() * 1000), // Simulated value
        lastActivityAt: new Date(),
        status: tenant.status
      };
      
      // Store updated metrics
      this.metricsCache.set(tenantId, metrics);
      
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to recalculate metrics for tenant ${tenantId}`, error);
      return this.metricsCache.get(tenantId) || {};
    }
  }

  /**
   * Set configuration value for a tenant
   * @param tenantId - ID of the tenant
   * @param key - Configuration key
   * @param value - Configuration value
   */
  setTenantConfiguration(tenantId: string, key: string, value: string): void {
    let tenantConfig = this.configCache.get(tenantId);
    
    if (!tenantConfig) {
      tenantConfig = new Map<string, string>();
      this.configCache.set(tenantId, tenantConfig);
    }
    
    tenantConfig.set(key, value);
  }

  /**
   * Set multiple configuration values for a tenant
   * @param tenantId - ID of the tenant
   * @param config - Configuration DTO with key/value pairs
   */
  setTenantConfigurations(tenantId: string, configs: TenantConfigurationDto[]): void {
    for (const config of configs) {
      this.setTenantConfiguration(tenantId, config.key, config.value);
    }
  }

  /**
   * Get configuration value for a tenant
   * @param tenantId - ID of the tenant
   * @param key - Configuration key
   * @param defaultValue - Default value if not found
   * @returns Configuration value or default value
   */
  getTenantConfiguration(tenantId: string, key: string, defaultValue = ''): string {
    const tenantConfig = this.configCache.get(tenantId);
    
    if (!tenantConfig) {
      return defaultValue;
    }
    
    return tenantConfig.get(key) || defaultValue;
  }

  /**
   * Get all configuration values for a tenant
   * @param tenantId - ID of the tenant
   * @returns Object with all configuration values
   */
  getAllTenantConfigurations(tenantId: string): Record<string, string> {
    const tenantConfig = this.configCache.get(tenantId);
    
    if (!tenantConfig) {
      return {};
    }
    
    // Convert Map to plain object
    const result: Record<string, string> = {};
    tenantConfig.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }
}
