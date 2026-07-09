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
exports.AtsEnrichmentService = void 0;
const common_1 = require("@nestjs/common");
const canonical_key_util_1 = require("../ats/canonical-key.util");
const ashby_adapter_1 = require("../ats/adapters/ashby.adapter");
const greenhouse_adapter_1 = require("../ats/adapters/greenhouse.adapter");
const lever_adapter_1 = require("../ats/adapters/lever.adapter");
let AtsEnrichmentService = class AtsEnrichmentService {
    greenhouse;
    lever;
    ashby;
    constructor(greenhouse, lever, ashby) {
        this.greenhouse = greenhouse;
        this.lever = lever;
        this.ashby = ashby;
    }
    async fetchByCanonicalKey(canonicalKey) {
        const parsed = (0, canonical_key_util_1.parseCanonicalKey)(canonicalKey);
        if (!parsed) {
            return null;
        }
        switch (parsed.atsType) {
            case 'greenhouse':
                return this.greenhouse.fetchJob(parsed.board, parsed.jobId);
            case 'lever':
                return this.lever.fetchJob(parsed.board, parsed.jobId);
            case 'ashby':
                return this.ashby.fetchJob(parsed.board, parsed.jobId);
            default:
                return null;
        }
    }
};
exports.AtsEnrichmentService = AtsEnrichmentService;
exports.AtsEnrichmentService = AtsEnrichmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [greenhouse_adapter_1.GreenhouseAdapter,
        lever_adapter_1.LeverAdapter,
        ashby_adapter_1.AshbyAdapter])
], AtsEnrichmentService);
//# sourceMappingURL=ats-enrichment.service.js.map