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
exports.AdzunaClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const env_validation_1 = require("../../config/env.validation");
let AdzunaClient = class AdzunaClient {
    appId;
    appKey;
    defaultCountry;
    constructor(config) {
        const env = {
            ADZUNA_APP_ID: config.get('ADZUNA_APP_ID', { infer: true }),
            ADZUNA_APP_KEY: config.get('ADZUNA_APP_KEY', { infer: true }),
            ADZUNA_API_KEY: config.get('ADZUNA_API_KEY', { infer: true }),
            ADZUNA_DEFAULT_COUNTRY: config.get('ADZUNA_DEFAULT_COUNTRY', { infer: true }),
        };
        this.appId = env.ADZUNA_APP_ID ?? '';
        this.appKey = (0, env_validation_1.getAdzunaAppKey)(env);
        this.defaultCountry = env.ADZUNA_DEFAULT_COUNTRY ?? 'gb';
    }
    isConfigured() {
        return Boolean(this.appId && this.appKey);
    }
    async search(params) {
        const country = (params.country ?? this.defaultCountry).toLowerCase();
        const page = params.page ?? 1;
        const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
        url.searchParams.set('app_id', this.appId);
        url.searchParams.set('app_key', this.appKey);
        url.searchParams.set('results_per_page', '20');
        if (params.q) {
            url.searchParams.set('what', params.q);
        }
        if (params.location) {
            url.searchParams.set('where', params.location);
        }
        const res = await fetch(url.toString(), {
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Adzuna search failed (${res.status}): ${text.slice(0, 200)}`);
        }
        const data = (await res.json());
        const listings = (data.results ?? []).map((r) => ({
            id: String(r.id),
            title: r.title ?? 'Untitled role',
            company: r.company?.display_name ?? 'Unknown company',
            location: r.location?.display_name ?? null,
            description: r.description ?? '',
            redirectUrl: r.redirect_url ?? '',
            created: r.created,
            salaryMin: r.salary_min ?? null,
            salaryMax: r.salary_max ?? null,
            salaryCurrency: r.salary_currency ?? null,
        }));
        return {
            listings,
            totalResults: data.count ?? listings.length,
        };
    }
};
exports.AdzunaClient = AdzunaClient;
exports.AdzunaClient = AdzunaClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AdzunaClient);
//# sourceMappingURL=adzuna.client.js.map