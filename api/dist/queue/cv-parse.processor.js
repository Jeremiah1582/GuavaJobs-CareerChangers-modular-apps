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
var CvParseProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParseProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const cv_parse_service_1 = require("../cv/cv-parse.service");
const storage_service_1 = require("../cv/storage.service");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_constants_1 = require("./queue.constants");
let CvParseProcessor = CvParseProcessor_1 = class CvParseProcessor extends bullmq_1.WorkerHost {
    prisma;
    storage;
    cvParse;
    logger = new common_1.Logger(CvParseProcessor_1.name);
    constructor(prisma, storage, cvParse) {
        super();
        this.prisma = prisma;
        this.storage = storage;
        this.cvParse = cvParse;
    }
    async process(job) {
        const { cvDocumentId } = job.data;
        const cv = await this.prisma.cvDocument.findUnique({
            where: { id: cvDocumentId },
        });
        if (!cv) {
            this.logger.warn(`CV document ${cvDocumentId} not found; skipping parse`);
            return;
        }
        try {
            const buffer = await this.storage.downloadObject(cv.storageKey);
            const parsedText = await this.cvParse.extractText(buffer, cv.mimeType, cv.fileName);
            await this.prisma.cvDocument.update({
                where: { id: cvDocumentId },
                data: {
                    parsedText,
                    parseStatus: client_1.CvParseStatus.READY,
                },
            });
            this.logger.log(`CV parse complete: ${cvDocumentId}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown parse error';
            this.logger.error(`CV parse failed for ${cvDocumentId}: ${message}`);
            await this.prisma.cvDocument.update({
                where: { id: cvDocumentId },
                data: { parseStatus: client_1.CvParseStatus.FAILED },
            });
            throw error;
        }
    }
};
exports.CvParseProcessor = CvParseProcessor;
exports.CvParseProcessor = CvParseProcessor = CvParseProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.CV_PARSE_QUEUE),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        cv_parse_service_1.CvParseService])
], CvParseProcessor);
//# sourceMappingURL=cv-parse.processor.js.map