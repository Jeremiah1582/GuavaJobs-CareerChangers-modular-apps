import { z } from 'zod';
export declare const applicationEventTypeSchema: z.ZodEnum<["RESPONSE", "INTERVIEW", "NOTE", "NEXT_STEP", "STATUS_CHANGE"]>;
export declare const createApplicationEventSchema: z.ZodObject<{
    eventType: z.ZodEnum<["RESPONSE", "INTERVIEW", "NOTE", "NEXT_STEP", "STATUS_CHANGE"]>;
    occurredAt: z.ZodString;
    content: z.ZodString;
    contactName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    eventType: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE";
    occurredAt: string;
    contactName?: string | undefined;
}, {
    content: string;
    eventType: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE";
    occurredAt: string;
    contactName?: string | undefined;
}>;
export declare const patchApplicationEventSchema: z.ZodEffects<z.ZodObject<{
    eventType: z.ZodOptional<z.ZodEnum<["RESPONSE", "INTERVIEW", "NOTE", "NEXT_STEP", "STATUS_CHANGE"]>>;
    occurredAt: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    contactName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    contactName?: string | undefined;
    eventType?: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE" | undefined;
    occurredAt?: string | undefined;
}, {
    content?: string | undefined;
    contactName?: string | undefined;
    eventType?: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE" | undefined;
    occurredAt?: string | undefined;
}>, {
    content?: string | undefined;
    contactName?: string | undefined;
    eventType?: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE" | undefined;
    occurredAt?: string | undefined;
}, {
    content?: string | undefined;
    contactName?: string | undefined;
    eventType?: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE" | undefined;
    occurredAt?: string | undefined;
}>;
export declare const listEventsQuerySchema: z.ZodObject<{
    eventType: z.ZodOptional<z.ZodEnum<["RESPONSE", "INTERVIEW", "NOTE", "NEXT_STEP", "STATUS_CHANGE"]>>;
}, "strip", z.ZodTypeAny, {
    eventType?: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE" | undefined;
}, {
    eventType?: "RESPONSE" | "INTERVIEW" | "NOTE" | "NEXT_STEP" | "STATUS_CHANGE" | undefined;
}>;
export type CreateApplicationEventInput = z.infer<typeof createApplicationEventSchema>;
export type PatchApplicationEventInput = z.infer<typeof patchApplicationEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
