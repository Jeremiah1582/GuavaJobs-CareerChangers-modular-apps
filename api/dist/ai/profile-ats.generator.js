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
exports.ProfileAtsGenerator = void 0;
exports.isPrimaryIndustrySet = isPrimaryIndustrySet;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const industry_criteria_1 = require("./industry-criteria");
const llm_client_1 = require("./llm.client");
const assessment_schema_1 = require("../shared/schemas/assessment.schema");
const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) coach for job seekers.
Score ONLY based on the provided CV text and profile metadata.
Never invent employers, dates, degrees, or skills not present in the CV.
Return strict JSON with keys: score (0-100 integer), missingKeywords (string array), suggestions (string array), breakdown (object with numeric sub-scores 0-100 for categories like keywords, formatting, seniorityAlignment).`;
let ProfileAtsGenerator = class ProfileAtsGenerator {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    buildInputFingerprint(profile, parsedCvText) {
        const payload = JSON.stringify({
            profileTitle: profile.profileTitle,
            jobTitle: profile.jobTitle,
            seniority: profile.seniority,
            primaryIndustry: profile.primaryIndustry,
            skills: profile.skills,
            summary: profile.summary,
            cvTextLength: parsedCvText.length,
            cvTextHash: (0, crypto_1.createHash)('sha256').update(parsedCvText).digest('hex'),
        });
        return (0, crypto_1.createHash)('sha256').update(payload).digest('hex');
    }
    async generate(params) {
        const { profile, parsedCvText } = params;
        const criteria = (0, industry_criteria_1.getIndustryCriteria)(profile.primaryIndustry);
        const seniorityHint = criteria.seniorityExpectations[profile.seniority] ??
            'Match expectations to stated seniority level';
        const userPrompt = JSON.stringify({
            task: 'Score this CV for ATS readiness in the given industry',
            industry: profile.primaryIndustry,
            industryLabel: criteria.label,
            keywordFocus: criteria.keywordFocus,
            seniority: profile.seniority,
            seniorityExpectations: seniorityHint,
            profile: {
                profileTitle: profile.profileTitle,
                jobTitle: profile.jobTitle,
                summary: profile.summary,
                skills: profile.skills,
                jobCategories: profile.jobCategories,
            },
            cvText: parsedCvText.slice(0, 50_000),
            rules: [
                'Do not fabricate CV content',
                'missingKeywords should be industry-relevant terms absent or weak in the CV',
                'suggestions must be actionable and honest',
            ],
        }, null, 2);
        const raw = await this.llm.chatJson(SYSTEM_PROMPT, userPrompt);
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new Error('LLM returned invalid JSON for profile ATS');
        }
        const result = assessment_schema_1.profileAtsLlmOutputSchema.parse(parsed);
        const inputFingerprint = this.buildInputFingerprint(profile, parsedCvText);
        return { ...result, inputFingerprint };
    }
};
exports.ProfileAtsGenerator = ProfileAtsGenerator;
exports.ProfileAtsGenerator = ProfileAtsGenerator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_client_1.LlmClient])
], ProfileAtsGenerator);
function isPrimaryIndustrySet(industry) {
    return Boolean(industry);
}
//# sourceMappingURL=profile-ats.generator.js.map