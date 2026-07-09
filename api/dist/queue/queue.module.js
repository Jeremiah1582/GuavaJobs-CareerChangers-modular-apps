"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cv_parse_service_1 = require("../cv/cv-parse.service");
const storage_service_1 = require("../cv/storage.service");
const cv_parse_processor_1 = require("./cv-parse.processor");
const queue_constants_1 = require("./queue.constants");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        url: config.get('REDIS_URL', { infer: true }),
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue({ name: queue_constants_1.CV_PARSE_QUEUE }, { name: queue_constants_1.AI_GENERATION_QUEUE }),
        ],
        providers: [cv_parse_processor_1.CvParseProcessor, cv_parse_service_1.CvParseService, storage_service_1.StorageService],
        exports: [bullmq_1.BullModule, storage_service_1.StorageService, cv_parse_service_1.CvParseService],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map