"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ats_report_generator_1 = require("./ats-report.generator");
const cover_letter_generator_1 = require("./cover-letter.generator");
const job_facts_parser_1 = require("./job-facts.parser");
const llm_client_1 = require("./llm.client");
const profile_ats_generator_1 = require("./profile-ats.generator");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        providers: [
            llm_client_1.LlmClient,
            profile_ats_generator_1.ProfileAtsGenerator,
            cover_letter_generator_1.CoverLetterGenerator,
            ats_report_generator_1.AtsReportGenerator,
            job_facts_parser_1.JobFactsParser,
        ],
        exports: [
            llm_client_1.LlmClient,
            profile_ats_generator_1.ProfileAtsGenerator,
            cover_letter_generator_1.CoverLetterGenerator,
            ats_report_generator_1.AtsReportGenerator,
            job_facts_parser_1.JobFactsParser,
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map