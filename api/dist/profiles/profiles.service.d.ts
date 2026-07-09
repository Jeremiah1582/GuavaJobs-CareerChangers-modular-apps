import { ProfileAtsService } from '../assessments/profile-ats.service';
import { CvService } from '../cv/cv.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileInput, PatchProfileInput, ProfileDetailResponse, ProfileResponse } from '../shared/schemas/profile.schema';
export declare class ProfilesService {
    private readonly prisma;
    private readonly cvService;
    private readonly profileAtsService;
    constructor(prisma: PrismaService, cvService: CvService, profileAtsService: ProfileAtsService);
    list(userId: string): Promise<ProfileResponse[]>;
    getById(userId: string, profileId: string): Promise<ProfileDetailResponse>;
    create(userId: string, input: CreateProfileInput): Promise<ProfileResponse>;
    patch(userId: string, profileId: string, input: PatchProfileInput): Promise<ProfileResponse>;
    private findOwnedProfile;
    private toProfileResponse;
}
