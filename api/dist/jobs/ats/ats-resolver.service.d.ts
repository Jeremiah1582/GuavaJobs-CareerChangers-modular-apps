import { ResolvedAts } from './types/unified-job.types';
export declare class AtsResolverService {
    resolveFromUrl(url: string): ResolvedAts | null;
    extractFromText(text: string): ResolvedAts | null;
    resolveFromRedirect(redirectUrl: string): Promise<ResolvedAts | null>;
}
