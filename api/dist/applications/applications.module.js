"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsModule = void 0;
const common_1 = require("@nestjs/common");
const ai_module_1 = require("../ai/ai.module");
const jobs_module_1 = require("../jobs/jobs.module");
const pdf_module_1 = require("../pdf/pdf.module");
const ai_generation_processor_1 = require("../queue/ai-generation.processor");
const queue_module_1 = require("../queue/queue.module");
const users_module_1 = require("../users/users.module");
const application_ai_worker_service_1 = require("./application-ai-worker.service");
const application_events_controller_1 = require("./application-events.controller");
const application_events_service_1 = require("./application-events.service");
const application_generate_service_1 = require("./application-generate.service");
const application_manual_service_1 = require("./application-manual.service");
const application_snapshot_service_1 = require("./application-snapshot.service");
const applications_controller_1 = require("./applications.controller");
const applications_service_1 = require("./applications.service");
const idempotency_service_1 = require("./idempotency.service");
let ApplicationsModule = class ApplicationsModule {
};
exports.ApplicationsModule = ApplicationsModule;
exports.ApplicationsModule = ApplicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [queue_module_1.QueueModule, ai_module_1.AiModule, jobs_module_1.JobsModule, users_module_1.UsersModule, pdf_module_1.PdfModule],
        controllers: [applications_controller_1.ApplicationsController, application_events_controller_1.ApplicationEventsController],
        providers: [
            applications_service_1.ApplicationsService,
            application_generate_service_1.ApplicationGenerateService,
            application_manual_service_1.ApplicationManualService,
            application_events_service_1.ApplicationEventsService,
            application_snapshot_service_1.ApplicationSnapshotService,
            application_ai_worker_service_1.ApplicationAiWorkerService,
            ai_generation_processor_1.AiGenerationProcessor,
            idempotency_service_1.IdempotencyService,
        ],
        exports: [applications_service_1.ApplicationsService],
    })
], ApplicationsModule);
//# sourceMappingURL=applications.module.js.map