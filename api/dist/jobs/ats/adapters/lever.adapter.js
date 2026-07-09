"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeverAdapter = void 0;
const common_1 = require("@nestjs/common");
const canonical_key_util_1 = require("../canonical-key.util");
let LeverAdapter = class LeverAdapter {
    async fetchJob(site, postingId) {
        const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(postingId)}?mode=json`;
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
            return null;
        }
        const data = (await res.json());
        const description = data.descriptionPlain?.trim() ||
            stripHtml(data.description ?? '') ||
            data.text?.trim() ||
            '';
        const applyUrl = data.applyUrl ?? data.hostedUrl ?? `https://jobs.lever.co/${site}/${postingId}`;
        return {
            canonicalKey: (0, canonical_key_util_1.buildCanonicalKey)('lever', site, postingId),
            title: data.text,
            company: site,
            location: data.categories?.location ?? null,
            snippet: description.slice(0, 280),
            description,
            applyUrl,
            atsType: 'lever',
            hasFullDescription: description.length > 100,
            applyType: 'url',
            source: 'adzuna',
            fetchedAt: new Date().toISOString(),
            postedAt: data.createdAt
                ? new Date(data.createdAt).toISOString()
                : null,
        };
    }
};
exports.LeverAdapter = LeverAdapter;
exports.LeverAdapter = LeverAdapter = __decorate([
    (0, common_1.Injectable)()
], LeverAdapter);
function stripHtml(html) {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=lever.adapter.js.map