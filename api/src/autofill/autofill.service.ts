import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../shared/schemas/error.schema';
import { AutofillPayload } from '../shared/schemas/autofill.schema';
import { atsTypeSchema } from '../shared/schemas/job.schema';
import {
  buildAutofillValues,
  detectAtsType,
  getFieldMapForAts,
} from './autofill.util';

const CV_STAGING_HINT =
  'CV files cannot be attached by autofill. Download your CV using downloadPath, then tap the employer file picker to attach it manually.';

const DISCLAIMERS = [
  'Review every filled field before submitting on the employer site.',
  'GuavaJobs never submits applications on your behalf.',
  'Screening and demographic questions are only filled when you saved an explicit answer.',
];

@Injectable()
export class AutofillService {
  constructor(private readonly prisma: PrismaService) {}

  async getPayload(userId: string, applicationId: string): Promise<AutofillPayload> {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: {
        user: true,
        profile: true,
      },
    });

    if (!application) {
      throw new AppError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const detected = detectAtsType(
      application.canonicalJobKey,
      application.applyUrl,
    );
    const atsType = atsTypeSchema.safeParse(detected).success
      ? (detected as AutofillPayload['atsType'])
      : 'unknown';
    const fieldMap = getFieldMapForAts(detected);

    const values = buildAutofillValues({
      user: application.user,
      profile: application.profile,
      application,
    });

    return {
      applicationId: application.id,
      profileId: application.profileId,
      applyUrl: application.applyUrl,
      atsType,
      atsSupported: fieldMap !== null,
      fieldMap,
      values,
      coverLetterContent: application.coverLetterContent,
      cvStaging: {
        hint: CV_STAGING_HINT,
        downloadPath: `/api/v1/profiles/${application.profileId}/cv/download`,
      },
      disclaimers: DISCLAIMERS,
    };
  }
}
