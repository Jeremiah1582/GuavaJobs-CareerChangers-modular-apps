import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationEventInput, ListEventsQuery, PatchApplicationEventInput } from '../shared/schemas/application-event.schema';
export declare class ApplicationEventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string, applicationId: string, query: ListEventsQuery): Promise<{
        id: string;
        eventType: string;
        occurredAt: string;
        content: string;
        contactName: string | null;
        createdAt: string;
        updatedAt: string;
    }[]>;
    create(userId: string, applicationId: string, input: CreateApplicationEventInput): Promise<{
        id: string;
        eventType: string;
        occurredAt: string;
        content: string;
        contactName: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    patch(userId: string, applicationId: string, eventId: string, input: PatchApplicationEventInput): Promise<{
        id: string;
        eventType: string;
        occurredAt: string;
        content: string;
        contactName: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    remove(userId: string, applicationId: string, eventId: string): Promise<{
        deleted: boolean;
    }>;
    private assertOwned;
    private assertOwnedEvent;
    private toResponse;
}
