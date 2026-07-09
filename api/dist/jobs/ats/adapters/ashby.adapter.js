"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AshbyAdapter = void 0;
const common_1 = require("@nestjs/common");
const canonical_key_util_1 = require("../canonical-key.util");
let AshbyAdapter = class AshbyAdapter {
    async fetchJob(boardName, jobPostingId) {
        const listUrl = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}`;
        const res = await fetch(listUrl, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
            return null;
        }
        const data = (await res.json());
        const job = data.jobs?.find((j) => j.id === jobPostingId);
        if (!job) {
            return null;
        }
        const description = job.descriptionPlain?.trim() ||
            stripHtml(job.descriptionHtml ?? '') ||
            '';
        const applyUrl = job.applyUrl ??
            job.jobUrl ??
            `https://jobs.ashbyhq.com/${boardName}/${jobPostingId}`;
        return {
            canonicalKey: (0, canonical_key_util_1.buildCanonicalKey)('ashby', boardName, jobPostingId),
            title: job.title,
            company: boardName,
            location: job.location ?? null,
            snippet: description.slice(0, 280),
            description,
            applyUrl,
            atsType: 'ashby',
            hasFullDescription: description.length > 100,
            applyType: 'url',
            source: 'adzuna',
            fetchedAt: new Date().toISOString(),
            postedAt: job.publishedAt ?? null,
        };
    }
};
exports.AshbyAdapter = AshbyAdapter;
exports.AshbyAdapter = AshbyAdapter = __decorate([
    (0, common_1.Injectable)()
], AshbyAdapter);
function stripHtml(html) {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=ashby.adapter.js.map