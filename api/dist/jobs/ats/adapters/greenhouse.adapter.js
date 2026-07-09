"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhouseAdapter = void 0;
const common_1 = require("@nestjs/common");
const canonical_key_util_1 = require("../canonical-key.util");
let GreenhouseAdapter = class GreenhouseAdapter {
    async fetchJob(board, jobId) {
        const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${encodeURIComponent(jobId)}`;
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
            return null;
        }
        const data = (await res.json());
        const description = stripHtml(data.content ?? '');
        const applyUrl = data.absolute_url ?? `https://boards.greenhouse.io/${board}/jobs/${jobId}`;
        return {
            canonicalKey: (0, canonical_key_util_1.buildCanonicalKey)('greenhouse', board, jobId),
            title: data.title,
            company: board,
            location: data.location?.name ?? null,
            snippet: description.slice(0, 280),
            description,
            applyUrl,
            atsType: 'greenhouse',
            hasFullDescription: description.length > 100,
            applyType: 'url',
            source: 'adzuna',
            fetchedAt: new Date().toISOString(),
            postedAt: data.updated_at ?? null,
        };
    }
};
exports.GreenhouseAdapter = GreenhouseAdapter;
exports.GreenhouseAdapter = GreenhouseAdapter = __decorate([
    (0, common_1.Injectable)()
], GreenhouseAdapter);
function stripHtml(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=greenhouse.adapter.js.map