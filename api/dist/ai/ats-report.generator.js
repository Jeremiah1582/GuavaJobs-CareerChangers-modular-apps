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
exports.AtsReportGenerator = exports.applicationAtsLlmOutputSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("@nestjs/common");
const llm_client_1 = require("./llm.client");
exports.applicationAtsLlmOutputSchema = zod_1.z.object({
    score: zod_1.z.coerce.number().int().min(0).max(100),
    letterScore: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    cvScore: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    missingKeywords: zod_1.z.array(zod_1.z.string()).max(30),
    suggestions: zod_1.z.array(zod_1.z.string()).max(15),
    strengths: zod_1.z.array(zod_1.z.string()).max(15),
    gaps: zod_1.z.array(zod_1.z.string()).max(15),
    actionableSteps: zod_1.z.array(zod_1.z.string()).max(15),
    keywordCoverage: zod_1.z.record(zod_1.z.coerce.number()).optional().default({}),
    icpMatch: zod_1.z.record(zod_1.z.unknown()).optional().default({}),
    breakdown: zod_1.z.record(zod_1.z.coerce.number()).optional().default({}),
});
const SYSTEM_PROMPT = `You assess job application fit (CV + cover letter vs job description).
Score honestly based only on provided text. Never invent candidate credentials.
Return JSON with: score (number), letterScore, cvScore, missingKeywords (array of strings), suggestions (array of strings), strengths, gaps, actionableSteps, keywordCoverage (object with numeric values 0-1), icpMatch (object), breakdown (object with numeric scores).`;
let AtsReportGenerator = class AtsReportGenerator {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async generate(params) {
        const userPrompt = JSON.stringify({
            jobTitle: params.jobTitle,
            company: params.companyName,
            jobDescription: params.jobDescription.slice(0, 20_000),
            coverLetter: params.coverLetter.slice(0, 10_000),
            cvText: params.cvText.slice(0, 20_000),
        }, null, 2);
        const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt);
        if (!raw?.trim()) {
            throw new Error('Empty LLM response for ATS report');
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new Error(`Invalid JSON for ATS report: ${raw.slice(0, 120)}`);
        }
        return exports.applicationAtsLlmOutputSchema.parse(normalizeAtsOutput(parsed));
    }
};
exports.AtsReportGenerator = AtsReportGenerator;
exports.AtsReportGenerator = AtsReportGenerator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_client_1.LlmClient])
], AtsReportGenerator);
function normalizeAtsOutput(raw) {
    return {
        ...raw,
        missingKeywords: toStringArray(raw.missingKeywords),
        suggestions: toStringArray(raw.suggestions),
        strengths: toStringArray(raw.strengths),
        gaps: toStringArray(raw.gaps),
        actionableSteps: toStringArray(raw.actionableSteps),
        keywordCoverage: toNumberRecord(raw.keywordCoverage),
        icpMatch: toObject(raw.icpMatch),
        breakdown: toNumberRecord(raw.breakdown),
    };
}
function toStringArray(value) {
    if (Array.isArray(value)) {
        return value.filter((v) => typeof v === 'string');
    }
    if (typeof value === 'string' && value.trim()) {
        return [value.trim()];
    }
    return [];
}
function toNumberRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    const out = {};
    for (const [key, val] of Object.entries(value)) {
        const num = Number(val);
        if (!Number.isNaN(num)) {
            out[key] = num;
        }
    }
    return out;
}
function toObject(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim()) {
        return { summary: value.trim() };
    }
    return {};
}
//# sourceMappingURL=ats-report.generator.js.map