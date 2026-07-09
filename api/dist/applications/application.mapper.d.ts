import { Application, ApplicationAtsReport, ApplicationEvent, ApplicationGenerationStatus } from '@prisma/client';
import { ApplicationResponse } from '../shared/schemas/application.schema';
type ApplicationWithRelations = Application & {
    atsReport?: ApplicationAtsReport | null;
    events?: ApplicationEvent[];
};
export declare function toApplicationResponse(app: ApplicationWithRelations, includeEvents?: boolean): ApplicationResponse;
export declare function isTerminalGenerationStatus(status: ApplicationGenerationStatus | null | undefined): boolean;
export {};
