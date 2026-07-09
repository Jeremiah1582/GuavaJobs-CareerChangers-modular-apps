import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
export declare class StorageService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private readonly supabaseUrl;
    private readonly serviceRoleKey;
    private readonly bucket;
    constructor(config: ConfigService<EnvConfig, true>);
    onModuleInit(): Promise<void>;
    private authHeaders;
    ensureBucket(): Promise<void>;
    uploadObject(storageKey: string, body: Buffer, contentType: string): Promise<void>;
    downloadObject(storageKey: string): Promise<Buffer>;
    createSignedDownloadUrl(storageKey: string, expiresInSeconds?: number): Promise<{
        signedUrl: string;
        expiresInSeconds: number;
    }>;
}
