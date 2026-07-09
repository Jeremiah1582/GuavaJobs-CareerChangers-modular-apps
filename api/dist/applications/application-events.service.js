"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const error_schema_1 = require("../shared/schemas/error.schema");
let ApplicationEventsService = class ApplicationEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId, applicationId, query) {
        await this.assertOwned(userId, applicationId);
        const events = await this.prisma.applicationEvent.findMany({
            where: {
                applicationId,
                ...(query.eventType ? { eventType: query.eventType } : {}),
            },
            orderBy: { occurredAt: 'desc' },
        });
        return events.map((e) => this.toResponse(e));
    }
    async create(userId, applicationId, input) {
        await this.assertOwned(userId, applicationId);
        const event = await this.prisma.applicationEvent.create({
            data: {
                applicationId,
                eventType: input.eventType,
                occurredAt: new Date(input.occurredAt),
                content: input.content,
                contactName: input.contactName,
            },
        });
        return this.toResponse(event);
    }
    async patch(userId, applicationId, eventId, input) {
        await this.assertOwnedEvent(userId, applicationId, eventId);
        const data = {
            ...input,
            occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        };
        const event = await this.prisma.applicationEvent.update({
            where: { id: eventId },
            data,
        });
        return this.toResponse(event);
    }
    async remove(userId, applicationId, eventId) {
        await this.assertOwnedEvent(userId, applicationId, eventId);
        await this.prisma.applicationEvent.delete({ where: { id: eventId } });
        return { deleted: true };
    }
    async assertOwned(userId, applicationId) {
        const app = await this.prisma.application.findFirst({
            where: { id: applicationId, userId },
        });
        if (!app) {
            throw new error_schema_1.AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
        }
    }
    async assertOwnedEvent(userId, applicationId, eventId) {
        await this.assertOwned(userId, applicationId);
        const event = await this.prisma.applicationEvent.findFirst({
            where: { id: eventId, applicationId },
        });
        if (!event) {
            throw new error_schema_1.AppError('EVENT_NOT_FOUND', 'Event not found', 404);
        }
    }
    toResponse(event) {
        return {
            id: event.id,
            eventType: event.eventType,
            occurredAt: event.occurredAt.toISOString(),
            content: event.content,
            contactName: event.contactName,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
        };
    }
};
exports.ApplicationEventsService = ApplicationEventsService;
exports.ApplicationEventsService = ApplicationEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationEventsService);
//# sourceMappingURL=application-events.service.js.map