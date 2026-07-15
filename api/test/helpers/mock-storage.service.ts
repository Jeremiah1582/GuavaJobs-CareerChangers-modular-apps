/** In-memory storage — avoids real Supabase Storage in money-path e2e. */
export class MockStorageService {
  private readonly objects = new Map<string, Buffer>();

  async onModuleInit(): Promise<void> {
    // no-op
  }

  async ensureBucket(): Promise<void> {
    // no-op
  }

  async uploadObject(
    storageKey: string,
    body: Buffer,
    _contentType: string,
  ): Promise<void> {
    this.objects.set(storageKey, body);
  }

  async downloadObject(storageKey: string): Promise<Buffer> {
    return this.objects.get(storageKey) ?? Buffer.from('e2e-cv-bytes');
  }

  async createSignedDownloadUrl(
    storageKey: string,
    expiresInSeconds = 3600,
  ): Promise<{ signedUrl: string; expiresInSeconds: number }> {
    return {
      signedUrl: `https://example.test/signed/${encodeURIComponent(storageKey)}`,
      expiresInSeconds,
    };
  }
}
