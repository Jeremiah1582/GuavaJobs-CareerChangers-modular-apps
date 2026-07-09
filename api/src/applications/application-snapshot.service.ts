import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { StorageService } from '../cv/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import { UnifiedJob } from '../shared/schemas/job.schema';

export type SnapshotBundle = {
  jobSnapshot: Record<string, unknown>;
  profileSnapshot: Record<string, unknown>;
  cvSnapshot: Record<string, unknown>;
  cvStorageKey: string | null;
  applyUrl: string;
};

@Injectable()
export class ApplicationSnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async buildForGenerate(
    userId: string,
    profileId: string,
    applicationId: string,
    job: UnifiedJob,
  ): Promise<SnapshotBundle> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      include: { currentCv: true },
    });

    if (!profile) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }

    if (!profile.currentCv?.parsedText) {
      throw new AppError(
        'CV_REQUIRED',
        'Upload and parse a CV before generating an application',
        400,
      );
    }

    const cvStorageKey = await this.copyCvForApplication(
      applicationId,
      profile.currentCv.storageKey,
      profile.currentCv.fileName,
      profile.currentCv.mimeType,
    );

    return {
      jobSnapshot: {
        canonicalKey: job.canonicalKey,
        title: job.title,
        company: job.company,
        location: job.location,
        seniority: null,
        description: job.description,
        applyUrl: job.applyUrl,
        atsType: job.atsType,
        source: job.source,
        fetchedAt: job.fetchedAt,
      },
      profileSnapshot: this.profileToSnapshot(profile),
      cvSnapshot: {
        cvDocumentId: profile.currentCv.id,
        fileName: profile.currentCv.fileName,
        mimeType: profile.currentCv.mimeType,
        parsedText: profile.currentCv.parsedText,
        uploadedAt: profile.currentCv.uploadedAt.toISOString(),
      },
      cvStorageKey,
      applyUrl: job.applyUrl,
    };
  }

  private profileToSnapshot(
    profile: Profile,
  ): Record<string, unknown> {
    return {
      id: profile.id,
      profileTitle: profile.profileTitle,
      jobTitle: profile.jobTitle,
      seniority: profile.seniority,
      primaryIndustry: profile.primaryIndustry,
      summary: profile.summary,
      skills: profile.skills,
      jobCategories: profile.jobCategories,
      locationCity: profile.locationCity,
      locationCountry: profile.locationCountry,
    };
  }

  private async copyCvForApplication(
    applicationId: string,
    sourceKey: string,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? 'pdf';
    const destKey = `applications/${applicationId}/cv.${ext}`;
    const buffer = await this.storage.downloadObject(sourceKey);
    await this.storage.uploadObject(destKey, buffer, mimeType);
    return destKey;
  }
}
