import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService extends Redis implements OnModuleDestroy {
    private readonly logger;
    private hasLoggedConnectionError;
    constructor(config: ConfigService);
    onModuleDestroy(): Promise<void>;
}
