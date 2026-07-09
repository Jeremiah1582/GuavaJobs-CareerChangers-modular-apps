import { AuthenticatedUser } from '../auth/auth.types';
import { AutofillService } from './autofill.service';
export declare class AutofillController {
    private readonly autofill;
    constructor(autofill: AutofillService);
    getPayload(user: AuthenticatedUser, id: string): Promise<{
        values: Record<string, string | number | boolean | null>;
        applyUrl: string | null;
        atsType: "unknown" | "greenhouse" | "lever" | "ashby" | "adzuna";
        profileId: string;
        coverLetterContent: string | null;
        applicationId: string;
        atsSupported: boolean;
        fieldMap: {
            atsType: "greenhouse" | "lever" | "ashby";
            version: string;
            fields: {
                logicalKey: string;
                name?: string | undefined;
                id?: string | undefined;
                selectors?: string[] | undefined;
                autocomplete?: string | undefined;
                inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
            }[];
        } | null;
        cvStaging: {
            hint: string;
            downloadPath: string;
        };
        disclaimers: string[];
    }>;
}
