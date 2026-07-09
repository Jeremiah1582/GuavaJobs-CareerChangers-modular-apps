import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig, getSupabaseServiceRoleKey } from '../config/env.validation';

const SIGNED_URL_TTL_SECONDS = 3600;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    const env = {
      SUPABASE_URL: this.config.get('SUPABASE_URL', { infer: true }),
      SUPABASE_SERVICE_ROLE_KEY: this.config.get('SUPABASE_SERVICE_ROLE_KEY', {
        infer: true,
      }),
      SUPABASE_SECRET_KEY: this.config.get('SUPABASE_SECRET_KEY', { infer: true }),
    } as EnvConfig;

    this.supabaseUrl = env.SUPABASE_URL.replace(/\/$/, '');
    this.serviceRoleKey = getSupabaseServiceRoleKey(env);
    this.bucket = this.config.get('SUPABASE_STORAGE_BUCKET', { infer: true });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  private authHeaders(extra: Record<string, string> = {}) {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      ...extra,
    };
  }

  async ensureBucket(): Promise<void> {
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
      this.logger.warn(
        `Could not create storage bucket "${this.bucket}": ${create.status} ${body}`,
      );
      return;
    }

    this.logger.log(`Created Supabase Storage bucket "${this.bucket}"`);
  }

  async uploadObject(
    storageKey: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const res = await fetch(
      `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`,
      {
        method: 'POST',
        headers: this.authHeaders({
          'Content-Type': contentType,
          'x-upsert': 'true',
        }),
        body: new Uint8Array(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Storage upload failed (${res.status}): ${text}`);
    }
  }

  async downloadObject(storageKey: string): Promise<Buffer> {
    const res = await fetch(
      `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storageKey}`,
      { headers: this.authHeaders() },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Storage download failed (${res.status}): ${text}`);
    }

    return Buffer.from(await res.arrayBuffer());
  }

  async createSignedDownloadUrl(
    storageKey: string,
    expiresInSeconds = SIGNED_URL_TTL_SECONDS,
  ): Promise<{ signedUrl: string; expiresInSeconds: number }> {
    const res = await fetch(
      `${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${storageKey}`,
      {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Signed URL failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { signedURL?: string; signedUrl?: string };
    const path = data.signedURL ?? data.signedUrl;
    if (!path) {
      throw new Error('Signed URL response missing path');
    }

    const signedUrl = path.startsWith('http')
      ? path
      : `${this.supabaseUrl}/storage/v1${path.startsWith('/') ? '' : '/'}${path}`;

    return { signedUrl, expiresInSeconds };
  }
}
