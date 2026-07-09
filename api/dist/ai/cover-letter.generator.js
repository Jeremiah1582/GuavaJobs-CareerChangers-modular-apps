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
exports.CoverLetterGenerator = exports.coverLetterLlmOutputSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("@nestjs/common");
const llm_client_1 = require("./llm.client");
exports.coverLetterLlmOutputSchema = zod_1.z.object({
    coverLetter: zod_1.z.string().min(50).max(8000),
});
const SYSTEM_PROMPT = `You write honest, tailored cover letters for job applications.
Use ONLY facts from the candidate profile and CV text provided.
Never invent employers, dates, degrees, or skills.
Career-change framing is allowed when supported by the CV.
Return JSON: { "coverLetter": "plain text letter" }`;
let CoverLetterGenerator = class CoverLetterGenerator {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async generate(params) {
        const userPrompt = JSON.stringify({
            jobTitle: params.jobTitle,
            company: params.companyName,
            jobDescription: params.jobDescription.slice(0, 20_000),
            profile: params.profileSummary,
            cvText: params.cvText.slice(0, 20_000),
            rules: [
                'Plain text only, 3-4 paragraphs',
                'No placeholders like [Company Name]',
                'Do not fabricate experience',
            ],
        }, null, 2);
        const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt);
        if (!raw?.trim()) {
            throw new Error('Empty LLM response for cover letter');
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new Error(`Invalid JSON for cover letter: ${raw.slice(0, 120)}`);
        }
        const normalized = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? {
                ...parsed,
                coverLetter: parsed.coverLetter ??
                    parsed.content ??
                    parsed.letter,
            }
            : parsed;
        return exports.coverLetterLlmOutputSchema.parse(normalized);
    }
};
exports.CoverLetterGenerator = CoverLetterGenerator;
exports.CoverLetterGenerator = CoverLetterGenerator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_client_1.LlmClient])
], CoverLetterGenerator);
//# sourceMappingURL=cover-letter.generator.js.map