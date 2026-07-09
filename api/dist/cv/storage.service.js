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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const env_validation_1 = require("../config/env.validation");
const SIGNED_URL_TTL_SECONDS = 3600;
let StorageService = StorageService_1 = class StorageService {
    config;
    logger = new common_1.Logger(StorageService_1.name);
    supabaseUrl;
    serviceRoleKey;
    bucket;
    constructor(config) {
        this.config = config;
        const env = {
            SUPABASE_URL: this.config.get('SUPABASE_URL', { infer: true }),
            SUPABASE_SERVICE_ROLE_KEY: this.config.get('SUPABASE_SERVICE_ROLE_KEY', {
                infer: true,
            }),
            SUPABASE_SECRET_KEY: this.config.get('SUPABASE_SECRET_KEY', { infer: true }),
        };
        this.supabaseUrl = env.SUPABASE_URL.replace(/\/$/, '');
        this.serviceRoleKey = (0, env_validation_1.getSupabaseServiceRoleKey)(env);
        this.bucket = this.config.get('SUPABASE_STORAGE_BUCKET', { infer: true });
    }
    async onModuleInit() {
        await this.ensureBucket();
    }
    authHeaders(extra = {}) {
        return {
            apikey: this.serviceRoleKey,
            Authorization: `Bearer ${this.serviceRoleKey}`,
            ...extra,
        };
    }
    async ensureBucket() {
        const res = await fetch(`${this.supabaseUrl}/storage/v1/bucket/${this.bucket}`, {
            headers: this.authHeaders(),
        });
        if (res.status === 200) {
            return;
        }
        const create = await fetch(`${this.supabaseUrl}/storage/v1/bucket`, {
            method: 'POST',
            headers: this.authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                id: this.bucket,
                name: this.bucket,
                public: false,
            }),
        });
        if (!create.ok) {
            const body = await create.text();
            this.logger.warn(`Could not create storage bucket "${this.bucket}": ${create.status} ${body}`);
            return;
        }
        this.logger.log(`Created Supabase Storage bucket "${this.bucket}"`);
    }
    async uploadObject(storageKey, body, contentType) {
        const res = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`, {
            method: 'POST',
            headers: this.authHeaders({
                'Content-Type': contentType,
                'x-upsert': 'true',
            }),
            body: new Uint8Array(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Storage upload failed (${res.status}): ${text}`);
        }
    }
    async downloadObject(storageKey) {
        const res = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`, { headers: this.authHeaders() });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Storage download failed (${res.status}): ${text}`);
        }
        return Buffer.from(await res.arrayBuffer());
    }
    async createSignedDownloadUrl(storageKey, expiresInSeconds = SIGNED_URL_TTL_SECONDS) {
        const res = await fetch(`${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${storageKey}`, {
            method: 'POST',
            headers: this.authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ expiresIn: expiresInSeconds }),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Signed URL failed (${res.status}): ${text}`);
        }
        const data = (await res.json());
        const path = data.signedURL ?? data.signedUrl;
        if (!path) {
            throw new Error('Signed URL response missing path');
        }
        const signedUrl = path.startsWith('http')
            ? path
            : `${this.supabaseUrl}/storage/v1${path.startsWith('/') ? '' : '/'}${path}`;
        return { signedUrl, expiresInSeconds };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map