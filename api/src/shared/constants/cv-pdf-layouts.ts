/** Ephemeral CV PDF visual layouts — never stored on GeneratedCv.templateId. */
export const CV_PDF_LAYOUTS = ['classic', 'modern'] as const;

export type CvPdfLayout = (typeof CV_PDF_LAYOUTS)[number];

export const DEFAULT_CV_PDF_LAYOUT: CvPdfLayout = 'classic';
