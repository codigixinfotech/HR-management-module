import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private hasLoggedConnectionError = false;

  constructor(config: ConfigService) {
    super(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    // Redis is optional for local dev without a running instance; app still boots.
    // ioredis emits an 'error' event on every retry, so log just the first one to avoid spam.
    this.on('error', (err) => {
      if (!this.hasLoggedConnectionError) {
        this.hasLoggedConnectionError = true;
        this.logger.warn(`Redis unavailable, continuing without it: ${err.message}`);
      }
    });
    this.on('connect', () => {
      this.hasLoggedConnectionError = false;
    });

    this.connect().catch(() => {
      // already logged via the 'error' listener above
    });
  }

  async onModuleDestroy() {
    this.disconnect();
  }
}
