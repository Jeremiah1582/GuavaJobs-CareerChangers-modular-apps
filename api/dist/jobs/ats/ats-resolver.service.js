"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtsResolverService = void 0;
const common_1 = require("@nestjs/common");
let AtsResolverService = class AtsResolverService {
    resolveFromUrl(url) {
        let parsed;
        try {
            parsed = new URL(url);
        }
        catch {
            return null;
        }
        const host = parsed.hostname.toLowerCase();
        const path = parsed.pathname;
        const ghBoards = path.match(/^\/([^/]+)\/jobs\/(\d+)\/?$/i);
        if (ghBoards &&
            (host === 'boards.greenhouse.io' ||
                host === 'job-boards.greenhouse.io' ||
                host.endsWith('.greenhouse.io'))) {
            return {
                atsType: 'greenhouse',
                board: ghBoards[1],
                jobId: ghBoards[2],
            };
        }
        const lever = path.match(/^\/([^/]+)\/([0-9a-f-]{36}|[a-z0-9-]+)\/?$/i);
        if (lever && host === 'jobs.lever.co') {
            return {
                atsType: 'lever',
                board: lever[1],
                jobId: lever[2],
            };
        }
        const ashby = path.match(/^\/([^/]+)\/([0-9a-f-]{36})\/?$/i);
        if (ashby && host === 'jobs.ashbyhq.com') {
            return {
                atsType: 'ashby',
                board: ashby[1],
                jobId: ashby[2],
            };
        }
        const ashbyApp = path.match(/^\/([^/]+)\/application\/([0-9a-f-]{36})\/?$/i);
        if (ashbyApp && host === 'jobs.ashbyhq.com') {
            return {
                atsType: 'ashby',
                board: ashbyApp[1],
                jobId: ashbyApp[2],
            };
        }
        return null;
    }
    extractFromText(text) {
        const urls = text.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
        for (const raw of urls) {
            const cleaned = raw.replace(/[),.;]+$/, '');
            const direct = this.resolveFromUrl(cleaned);
            if (direct) {
                return direct;
            }
        }
        return null;
    }
    async resolveFromRedirect(redirectUrl) {
        const direct = this.resolveFromUrl(redirectUrl);
        if (direct) {
            return direct;
        }
        try {
            const res = await fetch(redirectUrl, {
                method: 'GET',
                redirect: 'follow',
                headers: { 'User-Agent': 'GuavaJobs/1.0 (+https://guavajobs.app)' },
                signal: AbortSignal.timeout(8000),
            });
            return this.resolveFromUrl(res.url);
        }
        catch {
            return null;
        }
    }
};
exports.AtsResolverService = AtsResolverService;
exports.AtsResolverService = AtsResolverService = __decorate([
    (0, common_1.Injectable)()
], AtsResolverService);
//# sourceMappingURL=ats-resolver.service.js.map