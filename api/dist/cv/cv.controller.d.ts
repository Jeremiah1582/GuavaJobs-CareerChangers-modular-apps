import { AuthenticatedUser } from '../auth/auth.types';
import { CvService } from './cv.service';
export declare class CvController {
    private readonly cvService;
    constructor(cvService: CvService);
    upload(user: AuthenticatedUser, profileId: string, file: Express.Multer.File): Promise<{
        profileId: string;
        currentCvId: string;
        cv: {
            id: string;
            fileName: string;
            mimeType: string;
            fileSizeBytes: number;
            parseStatus: "PENDING" | "READY" | "FAILED";
            uploadedAt: string;
        };
    }>;
    download(user: AuthenticatedUser, profileId: string): Promise<{
        fileName: string;
        signedUrl: string;
        expiresInSeconds: number;
    }>;
}
