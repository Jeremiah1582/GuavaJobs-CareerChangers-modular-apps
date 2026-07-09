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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationEventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../common/pipes/zod-validation.pipe");
const application_event_schema_1 = require("../shared/schemas/application-event.schema");
const application_events_service_1 = require("./application-events.service");
let ApplicationEventsController = class ApplicationEventsController {
    events;
    constructor(events) {
        this.events = events;
    }
    list(user, applicationId, query) {
        return this.events.list(user.id, applicationId, query);
    }
    create(user, applicationId, body) {
        return this.events.create(user.id, applicationId, body);
    }
    patch(user, applicationId, eventId, body) {
        return this.events.patch(user.id, applicationId, eventId, body);
    }
    remove(user, applicationId, eventId) {
        return this.events.remove(user.id, applicationId, eventId);
    }
};
exports.ApplicationEventsController = ApplicationEventsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List application events' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Query)(new zod_validation_pipe_1.ZodValidationPipe(application_event_schema_1.listEventsQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationEventsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create NOTE / NEXT_STEP / INTERVIEW / RESPONSE' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(application_event_schema_1.createApplicationEventSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationEventsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':eventId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update event' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Param)('eventId')),
    __param(3, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(application_event_schema_1.patchApplicationEventSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationEventsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':eventId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete event' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ApplicationEventsController.prototype, "remove", null);
exports.ApplicationEventsController = ApplicationEventsController = __decorate([
    (0, swagger_1.ApiTags)('application-events'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('applications/:applicationId/events'),
    __metadata("design:paramtypes", [application_events_service_1.ApplicationEventsService])
], ApplicationEventsController);
//# sourceMappingURL=application-events.controller.js.map