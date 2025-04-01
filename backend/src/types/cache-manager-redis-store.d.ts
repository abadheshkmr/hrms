// Type definitions for cache-manager-redis-store
// This is a placeholder declaration file to satisfy TypeScript compiler

declare module 'cache-manager-redis-store' {
  import { Store, Config } from 'cache-manager';

  interface RedisStoreConfig extends Config {
    host?: string;
    port?: number;
    auth_pass?: string;
    password?: string;
    db?: number;
    ttl?: number;
    prefix?: string;
    url?: string;
  }

  function redisStore(config?: RedisStoreConfig): Store;

  export = redisStore;
}
