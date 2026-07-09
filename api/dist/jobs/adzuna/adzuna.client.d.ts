import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { AdzunaListing } from '../ats/types/unified-job.types';
export declare class AdzunaClient {
    private readonly appId;
    private readonly appKey;
    private readonly defaultCountry;
    constructor(config: ConfigService<EnvConfig, true>);
    isConfigured(): boolean;
    search(params: {
        q?: string;
        location?: string;
        country?: string;
        page?: number;
    }): Promise<{
        listings: AdzunaListing[];
        totalResults: number;
    }>;
}
