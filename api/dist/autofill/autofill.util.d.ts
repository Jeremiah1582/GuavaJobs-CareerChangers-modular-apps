import { AtsFieldMap } from '../shared/schemas/autofill.schema';
export declare function getFieldMapForAts(atsType: string): AtsFieldMap | null;
export declare function detectAtsType(canonicalJobKey: string | null | undefined, applyUrl: string | null | undefined): string;
export declare function splitFullName(name: string): {
    firstName: string;
    lastName: string;
    fullName: string;
};
export declare function buildAutofillValues(input: {
    user: {
        name: string;
        email: string;
        linkedinUrl: string | null;
        githubUrl: string | null;
    };
    profile: {
        jobTitle: string;
        locationCity: string | null;
        locationCountry: string | null;
        contactPhone: string | null;
        autofillAnswers: unknown;
    };
    application: {
        coverLetterContent: string | null;
        jobRoleTitle: string | null;
        companyName: string | null;
    };
}): Record<string, string | number | boolean | null>;
