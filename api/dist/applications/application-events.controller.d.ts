import { AuthenticatedUser } from '../auth/auth.types';
import { CreateApplicationEventInput, ListEventsQuery, PatchApplicationEventInput } from '../shared/schemas/application-event.schema';
import { ApplicationEventsService } from './application-events.service';
export declare class ApplicationEventsController {
    private readonly events;
    constructor(events: ApplicationEventsService);
    list(user: AuthenticatedUser, applicationId: string, query: ListEventsQuery): Promise<{
        id: string;
        eventType: string;
        occurredAt: string;
        content: string;
        contactName: string | null;
        createdAt: string;
        updatedAt: string;
    }[]>;
    create(user: AuthenticatedUser, applicationId: string, body: CreateApplicationEventInput): Promise<{
        id: string;
        eventType: string;
        occurredAt: string;
        content: string;
        contactName: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    patch(user: AuthenticatedUser, applicationId: string, eventId: string, body: PatchApplicationEventInput): Promise<{
        id: string;
        eventType: string;
        occurredAt: string;
        content: string;
        contactName: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    remove(user: AuthenticatedUser, applicationId: string, eventId: string): Promise<{
        deleted: boolean;
    }>;
}
