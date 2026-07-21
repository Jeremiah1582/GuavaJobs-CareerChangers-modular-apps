import { z } from 'zod';
import {
  CV_PDF_LAYOUTS,
  DEFAULT_CV_PDF_LAYOUT,
} from '../constants/cv-pdf-layouts';

export const generatedCvPdfQuerySchema = z.object({
  layout: z.enum(CV_PDF_LAYOUTS).default(DEFAULT_CV_PDF_LAYOUT),
});

export type GeneratedCvPdfQuery = z.infer<typeof generatedCvPdfQuerySchema>;
