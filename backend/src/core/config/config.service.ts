import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly env: { [key: string]: string | undefined };

  constructor() {
    this.env = process.env;
  }

  get(key: string, defaultValue?: string): string {
    return this.env[key] || defaultValue || '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key);
    return value ? parseInt(value, 10) : defaultValue || 0;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key);
    return value ? value === 'true' : defaultValue || false;
  }

  getDatabaseConfig() {
    return {
      type: 'postgres' as const,
      host: this.get('DATABASE_HOST', 'postgres'),
      port: this.getNumber('DATABASE_PORT', 5432),
      username: this.get('DATABASE_USER', 'postgres'),
      password: this.get('DATABASE_PASSWORD', 'postgres'),
      database: this.get('DATABASE_NAME', 'hrms'),
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize: this.getBoolean('DATABASE_SYNCHRONIZE', true),
    };
  }

  getRabbitMQConfig() {
    return {
      uri: this.get('RABBITMQ_URL', 'amqp://rabbitmq:5672'),
      exchanges: [
        {
          name: 'hrms-events',
          type: 'topic',
        },
      ],
    };
  }
}
