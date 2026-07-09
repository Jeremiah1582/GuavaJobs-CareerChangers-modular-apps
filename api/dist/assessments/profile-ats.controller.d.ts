import { AuthenticatedUser } from '../auth/auth.types';
import { ProfileAtsService } from './profile-ats.service';
export declare class ProfileAtsController {
    private readonly profileAtsService;
    constructor(profileAtsService: ProfileAtsService);
    run(user: AuthenticatedUser, profileId: string): Promise<{
        score: number;
        missingKeywords: string[];
        suggestions: string[];
        breakdown: Record<string, number>;
        industry: "SOFTWARE" | "SALES" | "DATA_ANALYSIS" | "FINANCE" | "HR" | "MARKETING" | "OPERATIONS" | "PRODUCT" | "DESIGN" | "OTHER";
        profileId: string;
        inputFingerprint: string | null;
        assessedAt: string;
    }>;
}
