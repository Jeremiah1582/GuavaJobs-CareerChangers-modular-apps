import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnvConfig } from '../config/env.validation';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    this.client.on('error', () => {
      // Avoid crashing the process on unreachable Redis; health check reports status.
    });
  }

  async onModuleInit() {
    await this.ensureConnected();
  }

  async onModuleDestroy() {
    if (this.client.status === 'end') return;
    await this.client.quit();
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.status === 'ready') return;
    try {
      await this.client.connect();
    } catch {
      // Redis may start after the API in local dev (docker compose).
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.ensureConnected();
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
