import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly enabled: boolean;
  private readonly client: Redis | null;

  constructor(config: ConfigService) {
    this.enabled = config.get<boolean>('REDIS_ENABLED', true);
    this.client = this.enabled
      ? new Redis(config.getOrThrow<string>('REDIS_URL'), {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        })
      : null;
  }

  async onModuleInit() {
    if (!this.client) return;
    try {
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch (error) {
      this.logger.warn(
        `Redis unavailable; cache features remain disabled: ${this.errorMessage(error)}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client?.status === 'ready') {
      await this.client.quit();
    } else {
      this.client?.disconnect();
    }
  }

  async health() {
    if (!this.enabled || !this.client) return { status: 'disabled' };
    if (this.client.status !== 'ready') return { status: 'unavailable' };
    const response = await this.client.ping();
    return { status: response === 'PONG' ? 'up' : 'down' };
  }

  getClient(): Redis | null {
    return this.client;
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
