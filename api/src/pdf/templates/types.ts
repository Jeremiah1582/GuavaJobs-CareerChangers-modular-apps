import type { HydratedGeneratedCvExport } from '../../shared/schemas/generated-cv.schema';
import type { CvPdfLayout } from '../../shared/constants/cv-pdf-layouts';

export type CvPdfDocumentProps = {
  cv: HydratedGeneratedCvExport;
};

export type { CvPdfLayout, HydratedGeneratedCvExport };
