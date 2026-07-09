import { z } from 'zod';
export declare const autofillFieldBindingSchema: z.ZodObject<{
    logicalKey: z.ZodString;
    selectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    name: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
    autocomplete: z.ZodOptional<z.ZodString>;
    inputType: z.ZodOptional<z.ZodEnum<["text", "email", "tel", "textarea", "select", "checkbox", "url"]>>;
}, "strip", z.ZodTypeAny, {
    logicalKey: string;
    name?: string | undefined;
    id?: string | undefined;
    selectors?: string[] | undefined;
    autocomplete?: string | undefined;
    inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
}, {
    logicalKey: string;
    name?: string | undefined;
    id?: string | undefined;
    selectors?: string[] | undefined;
    autocomplete?: string | undefined;
    inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
}>;
export declare const atsFieldMapSchema: z.ZodObject<{
    atsType: z.ZodEnum<["greenhouse", "lever", "ashby"]>;
    version: z.ZodString;
    fields: z.ZodArray<z.ZodObject<{
        logicalKey: z.ZodString;
        selectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        name: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodString>;
        autocomplete: z.ZodOptional<z.ZodString>;
        inputType: z.ZodOptional<z.ZodEnum<["text", "email", "tel", "textarea", "select", "checkbox", "url"]>>;
    }, "strip", z.ZodTypeAny, {
        logicalKey: string;
        name?: string | undefined;
        id?: string | undefined;
        selectors?: string[] | undefined;
        autocomplete?: string | undefined;
        inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
    }, {
        logicalKey: string;
        name?: string | undefined;
        id?: string | undefined;
        selectors?: string[] | undefined;
        autocomplete?: string | undefined;
        inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
export declare const autofillValueSchema: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
export declare const autofillPayloadSchema: z.ZodObject<{
    applicationId: z.ZodString;
    profileId: z.ZodString;
    applyUrl: z.ZodNullable<z.ZodString>;
    atsType: z.ZodEnum<["greenhouse", "lever", "ashby", "adzuna", "unknown"]>;
    atsSupported: z.ZodBoolean;
    fieldMap: z.ZodNullable<z.ZodObject<{
        atsType: z.ZodEnum<["greenhouse", "lever", "ashby"]>;
        version: z.ZodString;
        fields: z.ZodArray<z.ZodObject<{
            logicalKey: z.ZodString;
            selectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            name: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodString>;
            autocomplete: z.ZodOptional<z.ZodString>;
            inputType: z.ZodOptional<z.ZodEnum<["text", "email", "tel", "textarea", "select", "checkbox", "url"]>>;
        }, "strip", z.ZodTypeAny, {
            logicalKey: string;
            name?: string | undefined;
            id?: string | undefined;
            selectors?: string[] | undefined;
            autocomplete?: string | undefined;
            inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
        }, {
            logicalKey: string;
            name?: string | undefined;
            id?: string | undefined;
            selectors?: string[] | undefined;
            autocomplete?: string | undefined;
            inputType?: "url" | "select" | "email" | "text" | "tel" | "textarea" | "checkbox" | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
    }>>;
    values: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
    coverLetterContent: z.ZodNullable<z.ZodString>;
    cvStaging: z.ZodObject<{
        hint: z.ZodString;
        downloadPath: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        hint: string;
        downloadPath: string;
    }, {
        hint: string;
        downloadPath: string;
    }>;
    disclaimers: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
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
}, {
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
export declare const patchAutofillAnswersSchema: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodUnknown>, Record<string, unknown>, Record<string, unknown>>;
export type AutofillFieldBinding = z.infer<typeof autofillFieldBindingSchema>;
export type AtsFieldMap = z.infer<typeof atsFieldMapSchema>;
export type AutofillPayload = z.infer<typeof autofillPayloadSchema>;
