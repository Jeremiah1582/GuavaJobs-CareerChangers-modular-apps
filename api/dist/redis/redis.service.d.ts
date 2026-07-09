import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnvConfig } from '../config/env.validation';
export declare class RedisService implements OnModuleDestroy {
    readonly client: Redis;
    constructor(config: ConfigService<EnvConfig, true>);
    onModuleDestroy(): Promise<void>;
    ping(): Promise<boolean>;
}
