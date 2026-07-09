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
var AiGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGenerationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const application_ai_worker_service_1 = require("../applications/application-ai-worker.service");
const queue_constants_1 = require("./queue.constants");
let AiGenerationProcessor = AiGenerationProcessor_1 = class AiGenerationProcessor extends bullmq_1.WorkerHost {
    aiWorker;
    logger = new common_1.Logger(AiGenerationProcessor_1.name);
    constructor(aiWorker) {
        super();
        this.aiWorker = aiWorker;
    }
    async process(job) {
        this.logger.log(`Processing ${job.data.type} for application ${job.data.applicationId}`);
        await this.aiWorker.process(job.data);
    }
};
exports.AiGenerationProcessor = AiGenerationProcessor;
exports.AiGenerationProcessor = AiGenerationProcessor = AiGenerationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.AI_GENERATION_QUEUE),
    __metadata("design:paramtypes", [application_ai_worker_service_1.ApplicationAiWorkerService])
], AiGenerationProcessor);
//# sourceMappingURL=ai-generation.processor.js.map