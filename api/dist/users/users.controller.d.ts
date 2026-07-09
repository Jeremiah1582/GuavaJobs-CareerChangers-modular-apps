import { AuthenticatedUser } from '../auth/auth.types';
import { PatchMeInput } from '../shared/schemas/user.schema';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: AuthenticatedUser): Promise<{
        name: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        email: string;
        imgUrl: string | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
        tier: "FREE" | "PAID";
        defaultProfileId: string | null;
        defaultProfile: {
            id: string;
            profileTitle: string;
            jobTitle: string;
            isDefault: boolean;
        } | null;
        usage: {
            tier: "FREE" | "PAID";
            aiGenerationsUsedPeriod: number;
            usagePeriodStart: string | null;
            aiGenerationsLimit: number | null;
        };
    }>;
    patchMe(user: AuthenticatedUser, body: PatchMeInput): Promise<{
        name: string;
        id: string;
        createdAt: string;
        updatedAt: string;
        email: string;
        imgUrl: string | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
        tier: "FREE" | "PAID";
        defaultProfileId: string | null;
        defaultProfile: {
            id: string;
            profileTitle: string;
            jobTitle: string;
            isDefault: boolean;
        } | null;
        usage: {
            tier: "FREE" | "PAID";
            aiGenerationsUsedPeriod: number;
            usagePeriodStart: string | null;
            aiGenerationsLimit: number | null;
        };
    }>;
}
